# HablaPE — Plan de Ejecución (Ecosistema Google)

> **Conoce el procedimiento. Actúa informado.** Plan de ejecución del MVP para la hackathon: dos recorridos completos (control de identidad policial y reclamo de consumo), construidos íntegramente sobre el ecosistema de Google.

---

## 1. Objetivo y alcance

Entregar un prototipo funcional, desplegado en Google Cloud, que demuestre de punta a punta:

1. **Recorrido A — Control de identidad policial:** entrada por voz → clasificación del escenario → obligaciones y garantías con fuente visible → ficha neutral a partir de la foto de un acta sintética.
2. **Recorrido B — Reclamo de consumo:** foto de boleta/contrato + explicación por voz → extracción y confirmación de datos → enrutamiento (Libro de Reclamaciones / Reclama Virtual / regulador) → borrador editable + lista de comprobantes + enlace oficial.

**Fuera de alcance del MVP:** envío automático de denuncias o reclamos, asesoría jurídica personalizada, calificación de conductas, grabación automática, más de dos procedimientos.

---

## 2. Principios rectores

| Principio | Implicación práctica |
| --- | --- |
| No es un chatbot jurídico abierto | El agente solo opera sobre los dos procedimientos configurados; todo lo demás se rechaza con un mensaje de derivación. |
| Cero alucinación normativa | Toda afirmación legal proviene del corpus versionado; el modelo redacta, no inventa. Validadores determinísticos fuera del modelo. |
| Separación de voces | La UI distingue siempre: lo que dijo el usuario / lo que dice la fuente / la explicación del modelo / la acción siguiente. |
| Datos 100 % sintéticos | Ningún dato personal real; todo material de prueba marcado con `is_synthetic=true`. |
| Reproducibilidad | Corpus, prompts y reglas versionados en Git; despliegue por CI/CD; demo ejecutable por cualquiera del equipo. |

---

## 3. Arquitectura sobre el ecosistema Google

### 3.1 Mapa de servicios

| Capa | Servicio Google | Uso en HablaPE |
| --- | --- | --- |
| Modelo principal | **Gemma (12B, multimodal)** servido desde **Vertex AI Model Garden** (endpoint dedicado) | Clasificación de escenario, extracción de campos de imágenes, redacción en lenguaje claro, selección de herramientas (function calling). |
| Prototipado del modelo | **Google AI Studio** | Iterar prompts y esquemas de salida antes de fijar el endpoint. |
| Voz → texto | **Cloud Speech-to-Text v2 (Chirp)**, `es-PE` | Transcripción de la explicación hablada del usuario. Fallback si el endpoint Gemma no acepta audio nativo. |
| Embeddings RAG | **EmbeddingGemma** (local, en el contenedor) | Corpus pequeño → índice **FAISS** empaquetado en la imagen; sin dependencia de red en la recuperación. |
| Backend | **Cloud Run** (servicio `api`) | FastAPI (Python 3.12): orquestador del agente, validadores determinísticos, generación de borradores. |
| Frontend | **Cloud Run** (servicio `web`) | Streamlit: pantallas de los dos recorridos, botones de fuente, borrador editable. |
| Almacenamiento | **Cloud Storage** | Corpus oficial versionado (Markdown/JSON), datos sintéticos (audios, actas, boletas), artefactos de evaluación. |
| Estado ligero | **Firestore (modo nativo)** | Sesiones de demo, registro de derivaciones y trazas de validación (sin PII). |
| Secretos | **Secret Manager** | URL/credenciales del endpoint Gemma, claves de servicio. |
| Contenedores | **Artifact Registry** | Imágenes Docker de `api` y `web`. |
| CI/CD | **GitHub + GitHub Actions → Cloud Run** (autenticación por **Workload Identity Federation**, sin llaves JSON) | Lint, tests, build, deploy en cada push a `main`. |
| Observabilidad | **Cloud Logging + Cloud Monitoring** | Trazas por petición: escenario detectado, fuentes citadas, resultado de cada validador. |
| Identidad y permisos | **IAM** | Cuentas de servicio de mínimo privilegio por servicio de Cloud Run. |

### 3.2 Flujo funcional

```
Usuario (voz / texto / foto)
        │
        ▼
[web · Streamlit · Cloud Run]
        │  audio → Speech-to-Text (es-PE)   imagen → base64
        ▼
[api · FastAPI · Cloud Run]
   1. Gemma: clasifica escenario (identidad | consumo | fuera_de_alcance)
   2. Gemma: extrae hechos/campos visibles (JSON con esquema estricto)
   3. Recuperación: FAISS + EmbeddingGemma sobre corpus versionado (GCS → local)
   4. Validadores determinísticos (Python puro):
        - entidad competente correcta
        - toda cita existe en el corpus y en su versión vigente
        - fechas/plazos coherentes con la fuente
        - campos obligatorios presentes antes de generar borrador
   5. Gemma: redacta explicación en lenguaje claro citando SOLO fragmentos aprobados
        │
        ▼
Respuesta en 4 bloques: [lo que dijiste] [lo que dice la fuente] [explicación] [acción + canal oficial]
        │
        ▼
Firestore (traza sin PII) · Cloud Logging
```

**Regla de oro del pipeline:** el modelo nunca produce la cita; los validadores adjuntan la cita desde el corpus y el modelo solo la explica. Si un validador falla, la respuesta degrada a "no puedo confirmarlo con una fuente oficial" + canal de derivación.

### 3.3 Decisión de serving del modelo (resolver en Semana −3)

| Opción | Pros | Contras | Cuándo elegirla |
| --- | --- | --- | --- |
| **A. Vertex AI Model Garden — endpoint dedicado Gemma** (recomendada) | Gestionado, autoscaling, misma región que Cloud Run, sin administrar GPU | Costo por hora del endpoint; solicitar cuota de GPU con anticipación | Si la cuota de GPU (L4/A100) se aprueba a tiempo. |
| B. Cloud Run con GPU (L4) + vLLM sirviendo Gemma | Todo en Cloud Run, escala a cero | Arranque en frío largo (cargar 12B), cuota GPU en Cloud Run limitada | Si A falla y el equipo domina vLLM. |
| C. Gemma vía API de Google AI (AI Studio) | Cero infraestructura, inmediato | Menos control; verificar que la variante multimodal esté disponible por API | Plan de contingencia y desarrollo local. |

**Acción:** validar la opción A antes del evento con una prueba de carga mínima (10 peticiones concurrentes, p95 < 8 s por respuesta completa). Dejar la opción C configurada como *feature flag* de emergencia.

---

## 4. Estructura del repositorio

```
HablaPE/
├── api/                      # FastAPI (Cloud Run)
│   ├── main.py
│   ├── agent/                # orquestador, selección de herramientas
│   ├── retrieval/            # EmbeddingGemma + FAISS
│   ├── validators/           # reglas determinísticas por procedimiento
│   ├── schemas/              # Pydantic: salidas estructuradas de Gemma
│   └── tests/
├── web/                      # Streamlit (Cloud Run)
├── corpus/                   # corpus oficial versionado
│   ├── identidad/            # Sentencia 1039/2025 TC, CPP art. relevantes, guías PNP
│   ├── consumo/              # Código de Protección al Consumidor, trámite Indecopi
│   └── manifest.json         # versión, fecha de captura, URL oficial de cada fuente
├── synthetic/                # datos sintéticos (is_synthetic=true)
│   ├── audios/  actas/  boletas/  perfiles/
├── eval/                     # harness de métricas del MVP
│   ├── scenarios.jsonl       # casos etiquetados (≥40 por recorrido)
│   └── run_eval.py
├── infra/                    # Dockerfiles, cloudbuild/, scripts gcloud
├── .github/workflows/        # ci.yml (test) + deploy.yml (Cloud Run)
└── PLAN_EJECUCION.md
```

---

## 5. Corpus oficial (entregable crítico pre-hackathon)

> Mapa completo de normas con enlaces oficiales y PDFs verificados: ver [`corpus/FUENTES.md`](corpus/FUENTES.md).

1. **Identidad:** Sentencia 1039/2025 del TC, artículos aplicables del Código Procesal Penal (control de identidad), guía/protocolo policial vigente. Descomponer en fragmentos atómicos: *una obligación o garantía por fragmento*, con `id`, `fuente`, `articulo`, `version`, `fecha_captura`, `url_oficial`.
2. **Consumo:** Código de Protección y Defensa del Consumidor (artículos de garantías, cobros no informados, idoneidad), reglamento del Libro de Reclamaciones, ficha del trámite de Indecopi, tabla de enrutamiento (Indecopi vs. Osiptel/SBS/Osinergmin/SuSalud/ATU por tipo de proveedor).
3. **Formato:** Markdown con frontmatter YAML → compilado a JSON; el `manifest.json` es la única fuente de verdad de versiones y lo leen los validadores.
4. **Revisión humana:** una persona del equipo (idealmente con formación legal) valida cada fragmento contra la fuente original antes de congelar la versión `v1.0`.

---

## 6. Validadores determinísticos (fuera del modelo)

| Validador | Regla |
| --- | --- |
| `competencia` | La entidad de derivación sale de la tabla de enrutamiento, nunca del modelo. |
| `citas` | Cada `source_id` citado existe en `manifest.json` y su versión es la vigente; si el modelo cita algo fuera del corpus, se descarta la respuesta. |
| `plazos` | Todo plazo mencionado debe coincidir literalmente con el campo `plazo` del fragmento fuente. |
| `campos_reclamo` | El borrador de reclamo solo se genera si proveedor, fecha, pedido y descripción fueron confirmados por el usuario. |
| `alcance` | Escenarios fuera de los dos procedimientos → respuesta fija de derivación, sin pasar por generación. |
| `neutralidad` | Lista de patrones prohibidos en la salida (recomendar resistirse, calificar al agente, afirmar que hubo infracción). |

Cada validador emite `pass/fail + motivo` a la traza de Firestore/Logging: eso alimenta directamente las métricas del MVP.

---

## 7. Cronograma

### Fase 0 — Fundaciones (Semana −4)

- [ ] Crear proyecto GCP `hablape-mvp`, habilitar APIs (Vertex AI, Speech-to-Text, Run, Storage, Secret Manager, Firestore, Artifact Registry), configurar presupuesto y alertas de gasto.
- [ ] **Solicitar cuota de GPU para el endpoint de Gemma (bloqueante — hacerlo el día 1).**
- [ ] Repositorio con estructura anterior, CI mínima (lint + tests) y Workload Identity Federation para deploy.
- [ ] Esqueleto FastAPI + Streamlit desplegado en Cloud Run ("hola mundo" de punta a punta).

### Fase 1 — Corpus y modelo (Semana −3)

- [ ] Corpus v1.0 de ambos procedimientos, revisado y congelado.
- [ ] Decisión de serving (§3.3) tomada y endpoint validado con prueba de carga.
- [ ] Prompts y esquemas JSON de: clasificación, extracción de acta, extracción de boleta, redacción en lenguaje claro. Iterados en AI Studio, versionados en el repo.
- [ ] Índice FAISS construido y empaquetado; prueba de recuperación sobre 20 consultas manuales.

### Fase 2 — Recorridos completos (Semana −2)

- [ ] Recorrido A completo: voz → STT → clasificación → bloques obligaciones/garantías con botón de fuente → foto de acta → ficha neutral.
- [ ] Recorrido B completo: foto boleta + voz → confirmación de datos → enrutamiento → borrador editable + checklist de comprobantes + enlace oficial.
- [ ] Los 6 validadores implementados con tests unitarios.
- [ ] 40+ escenarios sintéticos etiquetados por recorrido en `eval/scenarios.jsonl`.

### Fase 3 — Endurecimiento y métricas (Semana −1)

- [ ] `run_eval.py` corriendo en CI: clasificación ≥90 %, extracción ≥90 %, citas 100 %, invenciones 0, derivación ≥90 %. Iterar prompts/reglas hasta cumplir.
- [ ] Pruebas de degradación: sin señal STT, foto borrosa, escenario fuera de alcance, endpoint caído (activa fallback C).
- [ ] Guion de demo ensayado 2 veces con cronómetro; grabar un video de respaldo por si falla la red del evento.
- [ ] Congelar `main`; solo hotfixes con revisión de otra persona.

### Día D — Hackathon (agenda tipo, ajustar al horario oficial)

| Hora | Actividad | Responsable |
| --- | --- | --- |
| H0–H1 | Verificación de entorno: endpoint Gemma activo, warm-up de Cloud Run, smoke test de ambos recorridos | Infra |
| H1–H4 | Pulido de UI y de los 4 bloques de respuesta; ajustes de wording en lenguaje claro | Frontend + Contenido |
| H4–H6 | Corrida final de `run_eval.py`; captura de métricas para las diapositivas | Backend |
| H6–H7 | Ensayo general de la demo (2 pasadas completas + plan B con video) | Todos |
| H7–H8 | Pitch: problema (datos Defensoría e Indecopi) → demo en vivo → métricas → hoja de ruta de escalabilidad | Pitch lead |
| Buffer | Nada nuevo se despliega en las últimas 2 horas salvo bug bloqueante | — |

### Post-hackathon (opcional)

- Retroalimentación del jurado → backlog Fase 2 del roadmap (laboral, ATU, acceso a información).
- Evaluar apagar el endpoint dedicado y dejar solo el fallback API para controlar costos.

---

## 8. Roles del equipo (4 personas, ajustable)

| Rol | Responsabilidades |
| --- | --- |
| **Backend/Agente** | FastAPI, orquestación Gemma, function calling, validadores, eval harness. |
| **Infra/MLOps** | GCP, serving de Gemma, CI/CD, Secret Manager, observabilidad, costos. |
| **Frontend/UX** | Streamlit, los 4 bloques de respuesta, flujo de confirmación, accesibilidad y lenguaje claro. |
| **Contenido/Legal + Pitch** | Corpus y su revisión, datos sintéticos, guion de demo, diapositivas, narrativa ODS 16. |

---

## 9. Datos sintéticos

- **Audios:** 15+ locuciones grabadas por el equipo (variantes de acento y ruido de calle) por recorrido.
- **Actas:** 10 actas de control de identidad generadas con plantilla (nombres ficticios, comisarías inventadas), impresas y fotografiadas con distintas luces/ángulos.
- **Boletas/contratos:** 15 documentos sintéticos cubriendo los tres subtipos (garantía no reconocida, cobro no informado, servicio incumplido) y varios sectores para probar el enrutamiento.
- Todo archivo lleva metadato `is_synthetic=true` y marca de agua visible "DOCUMENTO SINTÉTICO — DEMO".

---

## 10. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
| --- | --- | --- | --- |
| Cuota GPU no aprobada a tiempo | Media | Alto | Solicitar en Semana −4; fallback C (API de Google AI) detrás de feature flag. |
| Latencia p95 > 8 s en demo | Media | Alto | Warm-up previo, respuestas en streaming a la UI, límite de tokens de salida. |
| STT falla con acento/ruido | Media | Medio | Chirp `es-PE` + botón de entrada por texto siempre visible. |
| Modelo cita norma inexistente | Baja (con pipeline) | Crítico | Validador `citas` bloquea; las citas las adjunta el sistema, no el modelo. |
| Wifi del evento inestable | Media | Alto | Video de respaldo grabado; hotspot móvil; demo ensayada offline-first en lo posible. |
| Costo GCP se dispara | Baja | Medio | Presupuesto con alerta al 50/80 %, endpoint apagado fuera de horas de trabajo. |
| Alcance se infla ("agreguemos un tercer caso") | Alta | Alto | Este plan es el contrato: dos recorridos, todo lo demás es hoja de ruta en diapositivas. |

---

## 11. Guion de demo (5 minutos)

1. **(45 s) Problema:** 60.66 % de comisarías conoce cabalmente el protocolo de control de identidad (Informe Defensorial 266); 84,912 reclamos en Reclama Virtual en 2025.
2. **(90 s) Recorrido A en vivo:** voz "un policía me pide identificarme" → pantalla con obligaciones/garantías + botones de fuente → foto de acta sintética → ficha neutral.
3. **(90 s) Recorrido B en vivo:** foto de boleta + voz → confirmación → borrador de reclamo + enlace a Reclama Virtual.
4. **(45 s) Bajo el capó:** corpus versionado + validadores fuera del modelo = 100 % de afirmaciones con fuente, 0 normas inventadas (mostrar tablero de métricas de `run_eval`).
5. **(30 s) Escalabilidad:** misma arquitectura, nuevo corpus por procedimiento; roadmap fases 2–4.

---

## 12. Estimación de costos (mes de desarrollo + evento)

| Concepto | Estimado |
| --- | --- |
| Endpoint Gemma (GPU L4, ~60 h de uso activo) | ~USD 60–120 |
| Cloud Run (api + web, escala a cero) | < USD 5 |
| Speech-to-Text (~3 h de audio) | < USD 5 |
| Storage / Firestore / Logging | < USD 5 |
| **Total aproximado** | **< USD 150** (verificar créditos que otorgue la hackathon) |

---

## 13. Checklist de salida (definición de "listo para el evento")

- [ ] Ambos recorridos funcionan de punta a punta en Cloud Run desde un celular y una laptop.
- [ ] `run_eval.py` en verde con las 5 métricas del MVP.
- [ ] Corpus `v1.0` congelado con revisión humana documentada en `manifest.json`.
- [ ] Feature flag de fallback del modelo probada.
- [ ] Video de respaldo grabado y descargado localmente.
- [ ] Pitch ensayado ≤ 5 min con transiciones de demo fluidas.
