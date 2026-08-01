import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";

import {
  adaptOrientationForFrontend,
  BackendOrientation,
  BackendRequestError,
  BackendTranscription,
  requestBackend,
} from "./backend-client.js";

const orientation: BackendOrientation = {
  request_id: "request-123",
  answer_mode: "rag_gemma",
  journey: "identidad",
  urgency: "revisar_pronto",
  flags: ["motivo_no_informado"],
  blocks: {
    user_facts: ["Un policía me pidió el DNI."],
    official_rules: ["La identificación debe intentarse en el lugar."],
    plain_explanation: "Puedes preguntar el motivo del control.",
    next_actions: ["Pregunta con calma el motivo del control."],
    channel: null,
    draft: null,
  },
  sources: [
    {
      chunk_id: "chk-test",
      document_id: "cpp",
      title: "Código Procesal Penal",
      publisher: "Estado peruano",
      locator: "Artículo 205",
      official_url: "https://example.test/cpp",
      corpus_version: "2026-08-01",
      source_status: "verified_current",
    },
  ],
  validations: [{ name: "citas", passed: true, reason: "Fuente aprobada." }],
  privacy: {
    possible_personal_data: [],
    raw_input_persisted: false,
    retention: "no_persistido",
  },
  meta: {
    api_version: "1.0.0",
    corpus_version: "2026-08-01",
    model_provider: "rules",
    language: "es",
    translation_applied: false,
    generated_at: "2026-08-01T12:00:00Z",
    requires_human_legal_review: true,
  },
};

let receivedAudio = Buffer.alloc(0);
let receivedAudioContentType = "";

const server = createServer((request, response) => {
  response.setHeader("Content-Type", "application/json");
  response.setHeader("X-Request-ID", "request-123");
  if (request.url === "/v1/orientations") {
    response.end(JSON.stringify(orientation));
    return;
  }
  if (request.url === "/v1/transcriptions") {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      receivedAudio = Buffer.concat(chunks);
      receivedAudioContentType = String(request.headers["content-type"] || "");
      response.end(
        JSON.stringify({
          request_id: "request-audio",
          transcript: "Un policía me pidió mi DNI.",
          language_code: "es-US",
          model: "chirp_3",
          provider: "google-cloud-speech-v2",
          raw_audio_persisted: false,
        } satisfies BackendTranscription),
      );
    });
    return;
  }
  response.statusCode = 400;
  response.end(
    JSON.stringify({
      error: {
        code: "consent_required",
        message: "Consentimiento requerido.",
        request_id: "request-error",
      },
    }),
  );
});

before(async () => {
  process.env.HABLAPE_BACKEND_AUTH = "none";
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Puerto no disponible");
  process.env.HABLAPE_BACKEND_URL = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

test("requests FastAPI and keeps generated answer separate from sources", async () => {
  const result = await requestBackend<BackendOrientation>("/v1/orientations", {
    method: "POST",
    body: JSON.stringify({ text: "consulta" }),
  });
  const adapted = adaptOrientationForFrontend(result, {
    text: "consulta",
    mode: "text",
  });

  assert.equal(adapted.explanation.overview, orientation.blocks.plain_explanation);
  assert.equal(adapted.legalReferences.length, 1);
  assert.equal(adapted.legalReferences[0].chunkId, "chk-test");
  assert.equal(adapted.backendMeta.answerMode, "rag_gemma");
  assert.equal(adapted.backendMeta.privacy.raw_input_persisted, false);
});

test("propagates the backend error contract without leaking response details", async () => {
  await assert.rejects(
    requestBackend("/error"),
    (error: unknown) =>
      error instanceof BackendRequestError &&
      error.status === 400 &&
      error.code === "consent_required" &&
      error.requestId === "request-error",
  );
});

test("reports an aborted backend request as a clear timeout", async () => {
  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    requestBackend("/v1/orientations", { signal: controller.signal }),
    (error: unknown) =>
      error instanceof BackendRequestError
      && error.status === 504
      && error.code === "backend_timeout",
  );
});

test("preserves binary audio and its media type for Speech-to-Text", async () => {
  const audio = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
  const result = await requestBackend<BackendTranscription>("/v1/transcriptions", {
    method: "POST",
    headers: { "Content-Type": "audio/webm" },
    body: audio,
  });

  assert.deepEqual(receivedAudio, audio);
  assert.equal(receivedAudioContentType, "audio/webm");
  assert.equal(result.transcript, "Un policía me pidió mi DNI.");
  assert.equal(result.raw_audio_persisted, false);
});

test("shows an attempted RAG retrieval as blocked instead of direct chat", () => {
  const blocked: BackendOrientation = {
    ...orientation,
    answer_mode: "blocked",
    journey: "general",
    flags: ["answer_mode:blocked", "route_requested:rag"],
    sources: [],
    validations: [
      {
        name: "evidencia_oficial",
        passed: false,
        reason: "No se recuperaron chunks oficiales.",
      },
    ],
  };

  const adapted = adaptOrientationForFrontend(blocked, {
    text: "Un policía me pidió mi celular y mi DNI",
    mode: "text",
  });

  assert.equal(adapted.scenario.category, "Consulta con recuperación RAG bloqueada");
  assert.equal(adapted.scenario.needsClarification, false);
  assert.match(adapted.pipelineTrace[1].details, /Se solicitó RAG/);
  assert.match(adapted.limitations, /requería evidencia oficial/);
});

test("distinguishes generation failure from missing RAG evidence", () => {
  const blocked: BackendOrientation = {
    ...orientation,
    answer_mode: "blocked",
    flags: ["answer_mode:blocked", "route_requested:rag"],
    validations: [
      {
        name: "respuesta_modelo",
        passed: false,
        reason: "La respuesta generativa no superó la validación.",
      },
      {
        name: "evidencia_oficial",
        passed: true,
        reason: "Se adjuntó un chunk recuperado.",
      },
    ],
  };

  const adapted = adaptOrientationForFrontend(blocked, {
    text: "¿La policía puede revisar mi celular?",
    mode: "text",
  });

  assert.equal(
    adapted.scenario.category,
    "Fuentes recuperadas; explicación no validada",
  );
  assert.match(adapted.limitations, /recuperó fuentes oficiales/);
  assert.match(adapted.pipelineTrace[1].details, /1 chunks oficiales/);
});
