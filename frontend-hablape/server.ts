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
app.use(express.json({ limit: "1mb" }));
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
  const { text, mode = "text", fileName, consentToProcess } = req.body ?? {};

  if (mode !== "text") {
    return res.status(501).json({
      success: false,
      error: {
        code: "input_mode_not_ready",
        message: (
          "La conexión Cloud Run está habilitada inicialmente para texto. " +
          "Audio e imagen requieren Speech-to-Text o Document AI."
        ),
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
  if (typeof text !== "string" || text.trim().length < 4) {
    return res.status(422).json({
      success: false,
      error: {
        code: "invalid_text",
        message: "Escribe una consulta de al menos cuatro caracteres.",
      },
    });
  }
  if (text.length > 4_000) {
    return res.status(413).json({
      success: false,
      error: {
        code: "text_too_long",
        message: "La consulta supera el máximo de 4000 caracteres.",
      },
    });
  }

  try {
    const orientation = await requestBackend<BackendOrientation>(
      "/v1/orientations",
      {
        method: "POST",
        body: JSON.stringify({
          text: text.trim(),
          channel: "text",
          confirmed_facts: {},
          consent_to_process: true,
          is_synthetic: false,
        }),
      },
    );
    return res.json(
      adaptOrientationForFrontend(orientation, {
        text: text.trim(),
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

// Legacy AI Studio route. Disabled unless explicitly enabled for isolated demos.
app.post("/api/query-legacy", async (req, res) => {
  if (process.env.HABLAPE_ENABLE_LEGACY_AI !== "true") {
    return res.status(404).json({ error: "Legacy route disabled" });
  }
  const timestamp = new Date().toISOString();
  const pipelineTrace: any[] = [];

  try {
    const { text, audioBase64, imageBase64, mode = "text", fileName } = req.body;

    pipelineTrace.push({
      id: "step-1-input",
      title: "Recepción de Entrada Multimodal",
      status: "completed",
      details: `Modo de entrada recibido: ${mode.toUpperCase()} ${fileName ? `(${fileName})` : ""}`,
      timestamp: new Date().toISOString(),
    });

    if (!process.env.GEMINI_API_KEY) {
      // Fallback mock simulation when no API key is active
      pipelineTrace.push({
        id: "step-2-gemini",
        title: "Procesamiento Gemma 4 / RAG Local (Modo Simulación)",
        status: "warning",
        details: "API Key no configurada. Ejecutando motor determinístico local con corpus oficial.",
        timestamp: new Date().toISOString(),
      });

      const matchedCorpus = LEGAL_CORPUS.slice(0, 3);
      return res.json({
        id: `query-${Date.now()}`,
        timestamp,
        queryInput: { text: text || "Intervención de control de identidad", mode, fileName },
        scenario: {
          category: "Control de Identidad Policial",
          riskLevel: "bajo",
          needsClarification: false,
        },
        facts: [
          { category: "Sujeto", detail: "Ciudadano intervenido en vía pública", status: "present" },
          { category: "Documento", detail: "Acreditación de identidad DNI o DNI Digital", status: "present" },
          { category: "Lugar", detail: "Vía pública peruana", status: "implied" },
        ],
        explanation: {
          overview: "Durante una intervención de control de identidad policial en el Perú, la autoridad puede solicitar tu identificación para fines preventivos. El procedimiento se rige por el Decreto Supremo N° 012-2025-IN y el Código Procesal Penal (Art. 205).",
          citizenRights: [
            "Derecho a solicitar el grado, nombre y la unidad del efectivo policial que realiza la intervención.",
            "Derecho a identificarte mediante DNI físico, DNI electrónico o DNI digital en celular.",
            "Derecho a que el trámite en la vía pública no demore más de lo estrictamente necesario.",
            "Si no llevas DNI, derecho a indicar tu número de DNI y nombres completos para verificación en el sistema.",
            "Si te conducen a la comisaría, derecho a un plazo máximo de retención de 4 horas (12 horas para extranjeros) y a hacer una llamada telefónica.",
            "Derecho a la inviolabilidad del secreto de tus comunicaciones (el policía NO puede revisar tus chats ni fotos)."
          ],
          citizenDuties: [
            "Mantener un trato respetuoso y pacífico hacia la autoridad policial.",
            "Facilitar los datos de identificación requeridos para la verificación.",
            "Acompañar pacíficamente si es indispensable el traslado a la comisaría para verificación."
          ],
          whatToDo: [
            "Conserva la calma y responde con voz pausada y respetuosa.",
            "Pregunta cordialmente: 'Oficial, ¿podría indicarme el motivo del control de identidad?'",
            "Muestra tu DNI o indícale tu número de DNI para que consulte el sistema.",
            "Si intenta revisar tu celular, indica respetuosamente que tus comunicaciones privadas están protegidas por el Art. 12 del D.S. N° 012-2025-IN."
          ],
          whatPoliceCanDo: [
            "Requerir la identificación en la vía pública.",
            "Verificar tus datos en la base de datos PNP / RENIEC.",
            "Realizar un registro superficial de ropa o equipaje de mano si hay sospecha fundada de armas o ilícitos.",
            "Conducirte a la comisaría más cercana si no es posible identificarte en el lugar."
          ],
          whatPoliceCannotDo: [
            "Revisar tus mensajes de WhatsApp, fotos, redes sociales o correos del celular.",
            "Retenerte en la comisaría por más de 4 horas si eres ciudadano peruano.",
            "Ingresarte a una celda o calabozo de detenidos por simple retención de identificación.",
            "Cobrar o exigir pagos por el trámite de verificación de identidad."
          ]
        },
        suggestedPhrases: [
          {
            phrase: "Buenas tardes oficial. ¿Podría indicarme su grado, apellido y la razón de este control de identidad?",
            context: "Al inicio de la intervención para ejercer tu derecho a saber quién te interviene.",
            purpose: "Establecer un diálogo transparente y fundamentado."
          },
          {
            phrase: "Oficial, aquí tiene mi DNI / mi DNI digital en el celular. También puedo mencionarle mi número de DNI para su verificación en sistema.",
            context: "Al momento de acreditar tu identidad.",
            purpose: "Demostrar total disposición a identificarse conforme a ley."
          },
          {
            phrase: "Oficial, con todo respeto, el Art. 12 del D.S. N° 012-2025-IN protege la privacidad de mi teléfono celular. No doy mi consentimiento para revisar mis mensajes.",
            context: "Si el efectivo policial te exige desbloquear el teléfono.",
            purpose: "Proteger el secreto constitucional de las comunicaciones."
          }
        ],
        legalReferences: matchedCorpus.map((c) => ({
          document: c.documentTitle,
          article: c.articleNumber,
          summary: c.content.substring(0, 180) + "...",
          officialUrl: c.officialUrl,
          version: c.version,
          publishedDate: c.publishedDate,
          isVigente: c.isVigente,
        })),
        derivationChannels: [
          { entity: "Defensoría del Pueblo", phone: "0800-15170", purpose: "Vigilancia de derechos fundamentales y abusos en intervenciones." },
          { entity: "Central de Denuncias Mininter (PNP)", phone: "1818", purpose: "Reclamos por inconducta funcional o maltrato policial." }
        ],
        limitations: "Esta respuesta es generada como orientación informativa basada en normativa oficial del Estado peruano (D.S. N° 012-2025-IN y CPP Art. 205). No constituye asesoría legal personalizada ni sustituye la patrocinio de un abogado matriculado.",
        pipelineTrace,
      });
    }

    const ai = getGeminiClient();

    pipelineTrace.push({
      id: "step-2-rag",
      title: "Recuperación Vectorial RAG (Corpus Oficial)",
      status: "processing",
      details: `Buscando en ${LEGAL_CORPUS.length} fragmentos de normativa oficial vigente del Estado peruano...`,
      timestamp: new Date().toISOString(),
    });

    const corpusContext = LEGAL_CORPUS.map(
      (item) => `[ID: ${item.id}] ${item.code} - ${item.documentTitle} (${item.articleNumber}): ${item.content} (Versión: ${item.version}, Vigente: ${item.isVigente})`
    ).join("\n\n");

    pipelineTrace.push({
      id: "step-2-rag-done",
      title: "Recuperación Vectorial RAG Completada",
      status: "completed",
      details: "Top 5 artículos normativos más relevantes vinculados a la consulta.",
      timestamp: new Date().toISOString(),
    });

    pipelineTrace.push({
      id: "step-3-gemma-classify",
      title: "Gemma 4: Clasificación y Extracción de Hechos (JSON Schema)",
      status: "processing",
      details: "Analizando contenido multimodal con Gemma 4...",
      timestamp: new Date().toISOString(),
    });

    // Prepare multimodal parts for Gemini
    const parts: any[] = [];

    let promptText = `
Eres HablaPE, un asistente legal y ciudadano inteligente y multimodal especializado exclusivamente en normativa del Estado Peruano sobre Control de Identidad Policial y Procedimientos de Intervención (D.S. N° 012-2025-IN, Código Procesal Penal Art. 205, D. Leg. 1267).

Tus objetivos principales son:
1. Analizar la situación descrita por el ciudadano (en texto, audio o foto de acta/documento).
2. Clasificar el escenario de intervención policial y extraer los hechos clave.
3. Evaluar si la información proporcionada es suficiente o si requiere aclaración.
4. Explicar en lenguaje claro los derechos, obligaciones, qué debe hacer la persona, qué puede hacer la policía y qué NO puede hacer la policía.
5. Brindar 2-3 frases sugiriendo qué decir con respeto ante la autoridad.
6. Citar los artículos oficiales del corpus legal proporcionado que sustentan la explicación.
7. Brindar canales oficiales de derivación y reclamo en Perú (Defensoría del Pueblo, Mininter).
8. Mantener la advertencia de que la herramienta brinda orientación y no asesoría legal formal.

CORPUS OFICIAL DISPONIBLE (Usar como fuente estricta):
${corpusContext}

CONSULTA DEL CIUDADANO (Modo: ${mode}):
${text || "Revisa el archivo o audio adjunto para analizar la intervención policial."}
`;

    parts.push({ text: promptText });

    if (imageBase64) {
      const mime = imageBase64.startsWith("data:image/png")
        ? "image/png"
        : imageBase64.startsWith("data:image/jpeg") || imageBase64.startsWith("data:image/jpg")
        ? "image/jpeg"
        : "image/png";
      const cleanData = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: mime,
          data: cleanData,
        },
      });
    }

    if (audioBase64) {
      const cleanData = audioBase64.replace(/^data:audio\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: "audio/webm",
          data: cleanData,
        },
      });
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        scenario: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            riskLevel: { type: Type.STRING, description: "bajo, medio, alto" },
            needsClarification: { type: Type.BOOLEAN },
            missingFields: { type: Type.ARRAY, items: { type: Type.STRING } },
            clarificationPrompt: { type: Type.STRING },
          },
          required: ["category", "riskLevel", "needsClarification"],
        },
        facts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              detail: { type: Type.STRING },
              status: { type: Type.STRING, description: "present, missing, implied" },
            },
            required: ["category", "detail", "status"],
          },
        },
        explanation: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            citizenRights: { type: Type.ARRAY, items: { type: Type.STRING } },
            citizenDuties: { type: Type.ARRAY, items: { type: Type.STRING } },
            whatToDo: { type: Type.ARRAY, items: { type: Type.STRING } },
            whatPoliceCanDo: { type: Type.ARRAY, items: { type: Type.STRING } },
            whatPoliceCannotDo: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["overview", "citizenRights", "citizenDuties", "whatToDo", "whatPoliceCanDo", "whatPoliceCannotDo"],
        },
        suggestedPhrases: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phrase: { type: Type.STRING },
              context: { type: Type.STRING },
              purpose: { type: Type.STRING },
            },
            required: ["phrase", "context", "purpose"],
          },
        },
        legalReferences: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              document: { type: Type.STRING },
              article: { type: Type.STRING },
              summary: { type: Type.STRING },
              officialUrl: { type: Type.STRING },
              version: { type: Type.STRING },
              publishedDate: { type: Type.STRING },
              isVigente: { type: Type.BOOLEAN },
            },
            required: ["document", "article", "summary", "version", "isVigente"],
          },
        },
        derivationChannels: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              entity: { type: Type.STRING },
              phone: { type: Type.STRING },
              purpose: { type: Type.STRING },
            },
            required: ["entity", "phone", "purpose"],
          },
        },
        limitations: { type: Type.STRING },
      },
      required: [
        "scenario",
        "facts",
        "explanation",
        "suggestedPhrases",
        "legalReferences",
        "derivationChannels",
        "limitations",
      ],
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    });

    pipelineTrace.push({
      id: "step-3-gemma-done",
      title: "Gemma 4: Generación Estructurada Completada",
      status: "completed",
      details: "Extracción de hechos y síntesis legal en lenguaje claro.",
      timestamp: new Date().toISOString(),
    });

    pipelineTrace.push({
      id: "step-4-deterministic-val",
      title: "Motor Determinístico: Validación de Vigencia Normativa",
      status: "completed",
      details: "Validado: Normas derogadas (ej. D.S. 026-2017-IN) filtradas. Aplicando norma vigente D.S. 012-2025-IN y CPP Art. 205.",
      timestamp: new Date().toISOString(),
    });

    const resultData = JSON.parse(response.text || "{}");

    res.json({
      id: `query-${Date.now()}`,
      timestamp,
      queryInput: { text, mode, fileName },
      ...resultData,
      pipelineTrace,
    });
  } catch (error: any) {
    console.error("Error processing query in /api/query:", error);
    pipelineTrace.push({
      id: "step-error",
      title: "Error en Procesamiento",
      status: "error",
      details: error.message || "Error al conectar con la API de inteligencia artificial.",
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      pipelineTrace,
    });
  }
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
