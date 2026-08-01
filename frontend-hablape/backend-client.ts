import { GoogleAuth } from "google-auth-library";

type BackendValidation = {
  name: string;
  passed: boolean;
  reason: string;
};

type BackendSource = {
  chunk_id: string;
  document_id: string;
  title: string;
  publisher: string;
  locator: string;
  official_url: string;
  corpus_version: string;
  source_status: string;
};

export type BackendOrientation = {
  request_id: string;
  answer_mode: "deterministic" | "direct_gemma" | "rag_gemma" | "blocked";
  journey: "general" | "identidad" | "consumo" | "consumo_sectorial" | "fuera_de_alcance";
  urgency: "normal" | "revisar_pronto" | "urgente";
  flags: string[];
  blocks: {
    user_facts: string[];
    official_rules: string[];
    plain_explanation: string;
    next_actions: string[];
    channel?: string | null;
    draft?: string | null;
  };
  sources: BackendSource[];
  validations: BackendValidation[];
  privacy: {
    possible_personal_data: string[];
    raw_input_persisted: boolean;
    retention: string;
  };
  meta: {
    api_version: string;
    corpus_version: string;
    model_provider: string;
    language: "es" | "en" | "qu" | "ay";
    translation_applied: boolean;
    generated_at: string;
    requires_human_legal_review: boolean;
  };
};

type BackendErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    request_id?: string;
  };
};

export class BackendRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "BackendRequestError";
  }
}

const googleAuth = new GoogleAuth();

function backendBaseUrl(): string {
  const value = process.env.HABLAPE_BACKEND_URL?.trim().replace(/\/$/, "");
  if (!value) {
    throw new BackendRequestError(
      "HABLAPE_BACKEND_URL no está configurada en el servidor del frontend.",
      503,
      "backend_not_configured",
    );
  }
  return value;
}

function backendAuthMode(): "none" | "id-token" {
  const configured = process.env.HABLAPE_BACKEND_AUTH?.trim().toLowerCase();
  if (configured === "none" || configured === "id-token") {
    return configured;
  }
  return process.env.K_SERVICE ? "id-token" : "none";
}

async function authorizationHeader(url: string): Promise<string | undefined> {
  if (backendAuthMode() === "none") {
    return undefined;
  }

  const audience = process.env.HABLAPE_BACKEND_AUDIENCE?.trim() || backendBaseUrl();
  const client = await googleAuth.getIdTokenClient(audience);
  const headers = await client.getRequestHeaders(url);
  return headers.get("authorization") ?? undefined;
}

export async function requestBackend<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${backendBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const authorization = await authorizationHeader(url);
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (authorization) {
    headers.set("Authorization", authorization);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      signal: init.signal ?? AbortSignal.timeout(90_000),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "error de red";
    throw new BackendRequestError(
      `No se pudo contactar al backend de HablaPE: ${detail}`,
      503,
      "backend_unavailable",
    );
  }

  const requestId = response.headers.get("x-request-id") ?? undefined;
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const body = payload as BackendErrorPayload;
    throw new BackendRequestError(
      body?.error?.message || `El backend respondió HTTP ${response.status}.`,
      response.status,
      body?.error?.code || "backend_error",
      body?.error?.request_id || requestId,
    );
  }

  return payload as T;
}

function journeyLabel(journey: BackendOrientation["journey"]): string {
  const labels: Record<BackendOrientation["journey"], string> = {
    general: "Conversación general con Gemma",
    identidad: "Control de identidad policial",
    consumo: "Reclamo de consumo",
    consumo_sectorial: "Reclamo de consumo con ruta sectorial",
    fuera_de_alcance: "Consulta fuera del alcance de HablaPE",
  };
  return labels[journey];
}

function riskLevel(
  urgency: BackendOrientation["urgency"],
): "bajo" | "medio" | "alto" {
  if (urgency === "urgente") return "alto";
  if (urgency === "revisar_pronto") return "medio";
  return "bajo";
}

export function adaptOrientationForFrontend(
  orientation: BackendOrientation,
  queryInput: { text: string; mode: "text" | "audio" | "image"; fileName?: string },
) {
  const timestamp = orientation.meta.generated_at || new Date().toISOString();
  const failedValidations = orientation.validations.filter((item) => !item.passed);
  const usesRag = orientation.answer_mode === "rag_gemma";
  const isBlocked = orientation.answer_mode === "blocked";
  const attemptedRag = usesRag || orientation.flags.includes("route_requested:rag");

  return {
    id: orientation.request_id,
    timestamp,
    queryInput,
    scenario: {
      category:
        attemptedRag && isBlocked
          ? "Consulta con recuperación RAG bloqueada"
          : journeyLabel(orientation.journey),
      riskLevel: riskLevel(orientation.urgency),
      needsClarification: isBlocked && !attemptedRag,
      missingFields: [],
      clarificationPrompt:
        isBlocked && !attemptedRag
          ? "Reformula la consulta o añade contexto para que pueda validarse."
          : undefined,
    },
    facts: orientation.blocks.user_facts.map((detail, index) => ({
      category: index === 0 ? "Relato" : "Hecho confirmado",
      detail,
      status: "present" as const,
    })),
    explanation: {
      overview: orientation.blocks.plain_explanation,
      citizenRights: orientation.blocks.official_rules,
      citizenDuties: [],
      whatToDo: orientation.blocks.next_actions,
      whatPoliceCanDo: [],
      whatPoliceCannotDo: [],
    },
    suggestedPhrases: [],
    legalReferences: orientation.sources.map((source) => ({
      document: source.title,
      article: source.locator,
      summary: `${source.publisher}. Fuente ${source.source_status}.`,
      officialUrl: source.official_url,
      version: source.corpus_version,
      publishedDate: "",
      isVigente: !source.source_status.toLowerCase().includes("historical"),
      chunkId: source.chunk_id,
    })),
    derivationChannels: orientation.blocks.channel
      ? [
          {
            entity: "Canal oficial recomendado",
            phone: "",
            purpose: "Continuar el trámite por el canal oficial indicado.",
            website: orientation.blocks.channel,
          },
        ]
      : [],
    limitations: attemptedRag
      ? (
          usesRag
            ? (
                "Orientación informativa basada en chunks oficiales recuperados por HablaPE. " +
                "No constituye asesoría legal personalizada y requiere revisión humana " +
                "antes de tomar una decisión importante."
              )
            : (
                "La consulta requería evidencia oficial, pero el backend no pudo recuperar " +
                "chunks válidos. No se generó una orientación jurídica sin fuentes."
              )
        )
      : (
          "Respuesta conversacional de Gemma sin búsqueda RAG ni fuentes jurídicas. " +
          "No debe usarse como asesoría legal ni como confirmación de una norma vigente."
        ),
    pipelineTrace: [
      {
        id: "backend-routing",
        title: "Decisión del agente",
        status: "completed" as const,
        details: `Modo: ${orientation.answer_mode}; recorrido: ${orientation.journey}.`,
        timestamp,
      },
      {
        id: "backend-grounding",
        title: "Recuperación de fuentes aprobadas",
        status: attemptedRag
          ? (orientation.sources.length ? ("completed" as const) : ("warning" as const))
          : ("completed" as const),
        details: attemptedRag
          ? orientation.sources.length
            ? `${orientation.sources.length} chunks oficiales vinculados por el backend.`
            : "Se solicitó RAG, pero no se recuperaron chunks oficiales utilizables."
          : "El agente eligió respuesta directa; no se ejecutó Vector Search.",
        timestamp,
      },
      {
        id: "backend-validation",
        title: "Validación determinística",
        status: failedValidations.length ? ("warning" as const) : ("completed" as const),
        details: failedValidations.length
          ? failedValidations.map((item) => item.reason).join(" ")
          : "Todas las validaciones determinísticas fueron aprobadas.",
        timestamp,
      },
    ],
    backendMeta: {
      apiVersion: orientation.meta.api_version,
      corpusVersion: orientation.meta.corpus_version,
      modelProvider: orientation.meta.model_provider,
      answerMode: orientation.answer_mode,
      language: orientation.meta.language,
      translationApplied: orientation.meta.translation_applied,
      validations: orientation.validations,
      privacy: orientation.privacy,
    },
  };
}
