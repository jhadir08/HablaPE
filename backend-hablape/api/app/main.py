from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import Settings
from app.schemas import (
    CapabilitiesResponse,
    CapabilityStatus,
    ComplaintDraftRequest,
    ComplaintDraftResponse,
    ErrorBody,
    ErrorResponse,
    Language,
    OrientationRequest,
    OrientationResponse,
    SourceDocument,
)
from app.services.corpus import CorpusRepository
from app.services.models import build_model_runtime
from app.services.orchestrator import DomainError, OrientationOrchestrator
from app.services.traces import build_trace_store


logging.basicConfig(
    level=logging.INFO,
    format=(
        "%(asctime)s %(levelname)s %(name)s "
        "request_id=%(request_id)s %(message)s"
    ),
)


class _RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return True


for handler in logging.getLogger().handlers:
    handler.addFilter(_RequestIdFilter())

logger = logging.getLogger("hablape.api")


def _error(
    *,
    status_code: int,
    code: str,
    message: str,
    request_id: str,
    details: dict | None = None,
) -> JSONResponse:
    payload = ErrorResponse(
        error=ErrorBody(
            code=code,
            message=message,
            request_id=request_id,
            details=details,
        )
    )
    return JSONResponse(
        status_code=status_code,
        content=payload.model_dump(mode="json"),
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = Settings.from_env()
    corpus = CorpusRepository(
        settings.corpus_manifest_path, settings.corpus_chunks_path
    )
    traces = build_trace_store(settings)
    if settings.model_provider == "agent":
        from app.services.adaptive_agent import build_adaptive_orchestrator

        orchestrator = build_adaptive_orchestrator(
            settings=settings,
            corpus=corpus,
            traces=traces,
        )
        model = orchestrator
    else:
        model = build_model_runtime(settings)
        orchestrator = OrientationOrchestrator(
            settings=settings,
            corpus=corpus,
            model=model,
            traces=traces,
        )
    app.state.settings = settings
    app.state.corpus = corpus
    app.state.model = model
    app.state.traces = traces
    app.state.orchestrator = orchestrator
    yield


app = FastAPI(
    title="HablaPE API",
    version="1.0.0",
    summary="Backend trazable para orientación procedimental en Perú.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

_bootstrap_settings = Settings.from_env()
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(_bootstrap_settings.cors_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid4())
    request.state.request_id = request_id
    started = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    logger.info(
        "request_completed method=%s path=%s status=%s duration_ms=%.2f",
        request.method,
        request.url.path,
        response.status_code,
        (time.perf_counter() - started) * 1000,
        extra={"request_id": request_id},
    )
    return response


@app.exception_handler(DomainError)
async def domain_error_handler(request: Request, exc: DomainError):
    return _error(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        request_id=request.state.request_id,
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    request: Request, exc: RequestValidationError
):
    return _error(
        status_code=422,
        code="validation_error",
        message="La solicitud no cumple el contrato de la API.",
        request_id=request.state.request_id,
        details={"errors": exc.errors()},
    )


@app.get("/health/live", tags=["health"])
def health_live() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"], response_model=None)
def health_ready(request: Request):
    ready = request.app.state.model.ready() and request.app.state.traces.ready()
    payload = {
        "status": "ready" if ready else "not_ready",
        "corpus_version": request.app.state.corpus.version,
        "model_provider": request.app.state.model.provider_name,
        "trace_provider": request.app.state.traces.provider_name,
    }
    if not ready:
        return JSONResponse(status_code=503, content=payload)
    return payload


@app.get(
    "/v1/capabilities",
    response_model=CapabilitiesResponse,
    tags=["metadata"],
)
def capabilities(request: Request) -> CapabilitiesResponse:
    settings: Settings = request.app.state.settings
    model = request.app.state.model
    traces = request.app.state.traces
    return CapabilitiesResponse(
        api_version=settings.api_version,
        environment=settings.environment,
        journeys=[
            "general",
            "identidad",
            "consumo",
            "consumo_sectorial_con_derivacion_segura",
        ],
        supported_languages=[
            Language.SPANISH,
            Language.ENGLISH,
            Language.QUECHUA,
            Language.AYMARA,
        ],
        text_orientation=CapabilityStatus(
            status="ready" if model.ready() else "not_ready",
            provider=model.provider_name,
            detail=(
                "Gemma selecciona conversación directa o RAG; las citas RAG "
                "las asigna el backend desde los chunks recuperados."
                if settings.model_provider == "agent"
                else "El modelo solo redacta explicaciones; reglas y citas son deterministas."
            ),
        ),
        document_extraction=CapabilityStatus(
            status=(
                "configured"
                if settings.model_provider == "agent"
                else "pending_gcp"
            ),
            provider="gemma-4",
            detail=(
                "La imagen se procesa en memoria por Gemma y no se persiste; "
                "valida el contrato del contenedor con un smoke test."
                if settings.model_provider == "agent"
                else "Requiere un endpoint multimodal configurado."
            ),
        ),
        speech_to_text=CapabilityStatus(
            status=(
                "configured"
                if settings.model_provider == "agent"
                else "pending_gcp"
            ),
            provider="gemma-4-12b",
            detail=(
                "Gemma recibe el audio directamente; máximo 30 segundos y "
                "contrato del contenedor sujeto a smoke test."
                if settings.model_provider == "agent"
                else "Requiere un endpoint multimodal configurado."
            ),
        ),
        trace_store=CapabilityStatus(
            status="ready" if traces.ready() else "not_ready",
            provider=traces.provider_name,
            detail="Nunca persiste el relato ni los campos confirmados.",
        ),
        corpus_version=request.app.state.corpus.version,
    )


@app.get(
    "/v1/sources",
    response_model=list[SourceDocument],
    tags=["corpus"],
)
def list_sources(request: Request) -> list[SourceDocument]:
    return request.app.state.corpus.list_documents()


@app.post(
    "/v1/orientations",
    response_model=OrientationResponse,
    responses={400: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    tags=["orientation"],
)
def create_orientation(
    payload: OrientationRequest, request: Request
) -> OrientationResponse:
    return request.app.state.orchestrator.orient(
        payload, request.state.request_id
    )


@app.post(
    "/v1/complaints/draft",
    response_model=ComplaintDraftResponse,
    responses={400: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    tags=["consumer"],
)
def create_complaint_draft(
    payload: ComplaintDraftRequest, request: Request
) -> ComplaintDraftResponse:
    return request.app.state.orchestrator.create_complaint_draft(
        payload, request.state.request_id
    )
