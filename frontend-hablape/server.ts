import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { LEGAL_CORPUS, FREQUENT_SCENARIOS } from "./src/data/legalCorpus.js";
import {
  adaptOrientationForFrontend,
  BackendOrientation,
  BackendRequestError,
  requestBackend,
} from "./backend-client.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.disable("x-powered-by");
app.use(express.json({ limit: "12mb" }));
const jsonBodyErrorHandler: express.ErrorRequestHandler = (error, _req, res, next) => {
  if (typeof error === "object" && error !== null && "type" in error && error.type === "entity.too.large") {
    res.status(413).json({
      success: false,
      error: { code: "request_too_large", message: "La entrada multimedia supera el tamaño permitido." },
    });
    return;
  }
  next(error);
};
app.use(jsonBodyErrorHandler);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), geolocation=()");
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
});

// Initialize Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not set. Gemini API calls will use fallback or fail gracefully.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "placeholder_key",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Routes

// Health check including the private FastAPI dependency.
app.get("/api/health", async (_req, res) => {
  try {
    const backend = await requestBackend<Record<string, unknown>>("/health/ready");
    res.json({
      status: "ready",
      app: "HablaPE",
      version: "1.0.0",
      backend,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend no disponible";
    res.status(503).json({
      status: "not_ready",
      app: "HablaPE",
      version: "1.0.0",
      backend: { error: message },
    });
  }
});

// Get Legal Corpus
app.get("/api/corpus", (req, res) => {
  const { query, category } = req.query;
  let results = [...LEGAL_CORPUS];

  if (category && typeof category === "string") {
    results = results.filter((art) => art.category.toLowerCase() === category.toLowerCase());
  }

  if (query && typeof query === "string") {
    const q = query.toLowerCase();
    results = results.filter(
      (art) =>
        art.title.toLowerCase().includes(q) ||
        art.content.toLowerCase().includes(q) ||
        art.code.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, count: results.length, data: results });
});

// Get Frequent Scenarios
app.get("/api/scenarios", (_req, res) => {
  res.json({ success: true, data: FREQUENT_SCENARIOS });
});

// Browser -> same-origin Express BFF -> private FastAPI Cloud Run service.
app.post("/api/query", async (req, res) => {
  const {
    text,
    mode = "text",
    fileName,
    consentToProcess,
    audioBase64,
    imageBase64,
    audioDurationSeconds,
    language: requestedLanguage,
    idioma,
  } = req.body ?? {};

  const language = typeof requestedLanguage === "string"
    ? requestedLanguage
    : typeof idioma === "string"
      ? idioma
      : "es";
  if (!new Set(["es", "en", "qu", "ay"]).has(language)) {
    return res.status(422).json({
      success: false,
      error: {
        code: "invalid_language",
        message: "El idioma debe ser es, en, qu o ay.",
      },
    });
  }
  if (!new Set(["text", "audio", "image"]).has(mode)) {
    return res.status(422).json({
      success: false,
      error: {
        code: "invalid_input_mode",
        message: "El modo debe ser text, audio o image.",
      },
    });
  }
  if (consentToProcess !== true) {
    return res.status(400).json({
      success: false,
      error: {
        code: "consent_required",
        message: "Debes aceptar el procesamiento temporal del relato.",
      },
    });
  }
  const normalizedText = typeof text === "string" ? text.trim() : "";
  if (normalizedText.length > 4_000) {
    return res.status(413).json({
      success: false,
      error: {
        code: "text_too_long",
        message: "La consulta supera el máximo de 4000 caracteres.",
      },
    });
  }

  type ParsedMedia = {
    mime_type: string;
    data_base64: string;
    file_name?: string;
    duration_seconds?: number;
  };
  const parseMedia = (
    value: unknown,
    kind: "audio" | "image",
    maxBytes: number,
  ): ParsedMedia | undefined => {
    if (typeof value !== "string" || !value) return undefined;
    const comma = value.indexOf(",");
    const header = comma >= 0 ? value.slice(0, comma) : "";
    const data = comma >= 0 ? value.slice(comma + 1) : "";
    if (!header.startsWith(`data:${kind}/`) || !header.endsWith(";base64") || !data) {
      throw new BackendRequestError(
        `El ${kind === "audio" ? "audio" : "archivo de imagen"} no tiene un Data URL válido.`,
        422,
        `invalid_${kind}`,
      );
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
      throw new BackendRequestError("El contenido base64 es inválido.", 422, `invalid_${kind}`);
    }
    const mimeType = header.slice(5).split(";")[0].toLowerCase();
    const allowed = kind === "image"
      ? new Set(["image/jpeg", "image/png", "image/webp"])
      : new Set(["audio/webm", "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp4", "audio/ogg"]);
    if (!allowed.has(mimeType)) {
      throw new BackendRequestError(
        `Formato de ${kind === "audio" ? "audio" : "imagen"} no admitido.`,
        415,
        `unsupported_${kind}`,
      );
    }
    if (Buffer.byteLength(data, "base64") > maxBytes) {
      throw new BackendRequestError(
        `El ${kind === "audio" ? "audio" : "archivo de imagen"} supera el tamaño permitido.`,
        413,
        `${kind}_too_large`,
      );
    }
    if (kind === "audio" && typeof audioDurationSeconds === "number" && audioDurationSeconds > 30) {
      throw new BackendRequestError(
        "El audio no puede superar 30 segundos.",
        413,
        "audio_too_long",
      );
    }
    return {
      mime_type: mimeType,
      data_base64: data,
      file_name: typeof fileName === "string" ? fileName.slice(0, 200) : undefined,
      duration_seconds:
        kind === "audio" && typeof audioDurationSeconds === "number"
          ? audioDurationSeconds
          : undefined,
    };
  };

  let audio: ParsedMedia | undefined;
  let image: ParsedMedia | undefined;
  try {
    audio = mode === "audio" ? parseMedia(audioBase64, "audio", 8 * 1024 * 1024) : undefined;
    image = mode === "image" ? parseMedia(imageBase64, "image", 5 * 1024 * 1024) : undefined;
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return res.status(error.status).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: "media_validation_error", message: "No se pudo validar el archivo." },
    });
  }

  if (normalizedText.length < 2 && !audio && !image) {
    return res.status(422).json({
      success: false,
      error: {
        code: "missing_input",
        message: "Incluye texto, una grabación o una imagen.",
      },
    });
  }

  try {
    const orientation = await requestBackend<BackendOrientation>(
      "/v1/orientations",
      {
        method: "POST",
        body: JSON.stringify({
          text: normalizedText,
          channel: mode,
          image,
          audio,
          confirmed_facts: {},
          consent_to_process: true,
          is_synthetic: false,
          idioma: language,
        }),
      },
    );
    return res.json(
      adaptOrientationForFrontend(orientation, {
        text: normalizedText,
        mode,
        fileName: typeof fileName === "string" ? fileName : undefined,
      }),
    );
  } catch (error) {
    if (error instanceof BackendRequestError) {
      console.error(
        `[HablaPE BFF] backend_error status=${error.status} code=${error.code} request_id=${error.requestId || "-"}`,
      );
      return res.status(error.status).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          requestId: error.requestId,
        },
      });
    }
    console.error("[HablaPE BFF] unexpected_backend_error");
    return res.status(500).json({
      success: false,
      error: {
        code: "internal_error",
        message: "No se pudo procesar la consulta.",
      },
    });
  }
});

// The synthetic legacy route is permanently retired to prevent accidental use.
app.all("/api/query-legacy", (_req, res) => {
  res.status(410).json({
    success: false,
    error: {
      code: "legacy_route_removed",
      message: "Esta ruta fue retirada. Usa /api/query con el agente adaptativo.",
    },
  });
});

// Text To Speech API
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ useWebTTS: true, text });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `En español peruano claro y respetuoso: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ success: true, audioBase64: base64Audio, mimeType: "audio/pcm" });
    } else {
      return res.json({ useWebTTS: true, text });
    }
  } catch (err: any) {
    console.error("TTS error:", err);
    res.json({ useWebTTS: true, text: req.body.text });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[HablaPE Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
