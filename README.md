# HablaPE: Asistente Multimodal e Inteligente para la Protección de Derechos y Procedimientos en Intervenciones Policiales

> **Resumen Ejecutivo:** HablaPE es una plataforma inteligente y multimodal que permite conversar sobre información general y, cuando la consulta requiere respaldo jurídico, ofrece orientación sustentada en chunks oficiales del Estado peruano. **Gemma 4** comprende y enruta la consulta; el backend mantiene la recuperación y las citas bajo control determinístico.

---

## 1. El Problema

En el Perú, el acceso a la información sobre derechos y procedimientos durante una intervención policial está fragmentado en múltiples cuerpos legales: el Código Procesal Penal (Art. 205), el Decreto Supremo N° 012-2025-IN, el Manual de Derechos Humanos de la PNP, la Constitución Política, entre otros.

Frente a un control de identidad o una intervención cotidiana en la vía pública, el ciudadano promedio enfrenta tres barreras críticas:
1. **Desconocimiento y lenguaje técnico:** La normativa utiliza una terminología jurídica densa e inaccesible para la población general.
2. **Estrés e incertidumbre del momento:** Durante un control preventivo, el estrés impide buscar y analizar leyes manualmente.
3. **Vulnerabilidad a la arbitrariedad:** Sin claridad sobre los límites legales, los requisitos y las garantías procedimentales, aumenta el riesgo de vulneración de derechos o de incumplimiento de deberes ciudadanos.

Este problema impacta directamente en la confianza institucional y en el ejercicio efectivo de la ciudadanía en el país.

---

## 2. La Solución (Descripción del Proyecto)

**HablaPE** es un **navegador inteligente y multimodal de derechos y procedimientos**. Ante una situación de intervención policial, el ciudadano interactúa con el sistema enviando voz, texto o la fotografía de un documento (como un acta de intervención).

El sistema procesa la entrada, identifica el escenario específico, consulta un corpus normativo oficial, y entrega una respuesta estructurada y fácil de entender.

### Principios Fundamentales del MVP:
* **Foco en el caso de mayor impacto:** La primera versión se enfoca exclusivamente en el **control de identidad policial**, un procedimiento de alta frecuencia en el Perú.
* **Separación estricta de componentes:** Cada respuesta desglosa claramente: **Hechos entendidos**, **Explicación clara**, **Tus derechos**, **Tus obligaciones**, **Frases sugeridas para comunicarte**, **Fuente oficial (artículo, norma, versión)** y **Limitaciones**.
* **IA Responsable:** HablaPE **no emite asesoría legal personalizada ni redacta ni tramita denuncias automáticamente**. Deriva al ciudadano a la entidad correspondiente de manera neutral y objetiva.

---

## 3. Tracks Seleccionados

### Track Principal: *AI for Social Impact*
HablaPE se alinea directamente con los **Objetivos de Desarrollo Sostenible (ODS) de las Naciones Unidas**:
* **ODS 16.3 (Promover el estado de derecho y garantizar la igualdad de acceso a la justicia):** Democratiza el conocimiento del marco legal peruano sin sesgos ni costos.
* **ODS 16.6 (Crear instituciones eficaces, responsables y transparentes):** Fomenta interacciones ciudadanas informadas y respetuosas basadas en protocolos policiales vigentes.
* **ODS 16.10 (Garantizar el acceso público a la información):** Facilita la consulta transparente de las fuentes normativas del Estado.

### Track Secundario: *Multimodal AI Applications*
Soporta entradas heterogéneas (audio de voz, texto directo y fotos de documentos oficiales) en una única experiencia unificada sin requerir canalizaciones independientes complejas.

---

## 4. Arquitectura de la Solución

El sistema se estructura bajo una arquitectura **modular y auditable** en tres capas principales:

```
[ Ciudadano (Voz / Texto / Imagen) ]
                │
                ▼
[ Frontend (React + TailwindCSS) ]
                │ (HTTP JSON)
                ▼
[ FastAPI Orchestrator Hub ] ◄─────────────────────────────────┐
     ├──► 1. Gemma 4 (Comprensión, extracción, clasificación) │
     ├──► 2. Bucle de Aclaración (Si faltan datos)            │ JSON
     ├──► 3. RAG / Vertex AI Vector Search (semántica + filtros)│ Contrato
     ├──► 4. Motor Determinístico (Validación de reglas)      │
     └──► 5. Gemma 4 (Generación en lenguaje claro) ──────────┘
                │
                ▼
[ Respuesta Estructurada al Usuario ]
```

### 4.1. Flujo del Sistema (Hub Orquestador FastAPI)
1. **Entrada Multimodal:** El usuario envía su caso por voz, texto o imagen a la web app en React.
2. **Orquestación Central:** FastAPI actúa como el hub exclusivo de comunicación (evitando llamadas cruzadas entre servicios). Existen únicamente **dos fronteras de red**: `Navegador ↔ FastAPI` y `FastAPI ↔ Gemma 4`.
3. **Bucle de Aclaración:** Si en la etapa de comprensión faltan datos esenciales para evaluar el escenario, el orquestador solicita la precisión necesaria al usuario sin avanzar a la búsqueda.
4. **Respuesta final:** La salida se formatea en un contrato JSON estricto devuelto al cliente.

### 4.2. Arquitectura RAG (Garantía de Confianza)
Para eliminar alucinaciones en un dominio sensible como el legal, HablaPE implementa un pipeline RAG (*Retrieval Augmented Generation*) asistido por metadatos:

* **Pipeline Offline (Construcción del Corpus):**
  1. *Ingesta y Parsing:* Normalización de texto de normas oficiales del Estado peruano.
  2. *Chunking Inteligente:* Fragmentos de 500–800 tokens (solapamiento de 100–150), respetando estrictamente la estructura de artículos, párrafos y capítulos.
  3. *Metadatos Estructurados:* Cada fragmento incluye `documento`, `artículo`, `tema`, `entidad`, `fecha_publicacion`, `version`, `fuente_url` y `tipo`.
  4. *Almacenamiento Vectorial:* Indexación en **Vertex AI Vector Search 2.0**.

* **Pipeline Online (Consulta):**
  1. *Búsqueda Semántica Filtrada:* El retriever consulta Vertex AI Vector Search usando filtros para excluir fuentes no oficiales o sintéticas.
  2. *Comprensión de Contexto:* Gemma 4 genera la respuesta utilizando **únicamente** la evidencia oficial recuperada.
  3. *Compuerta "Fuera de Alcance":* Si el retriever no encuentra evidencia relevante sobre el escenario planteado, el sistema activa una compuerta que deniega la generación y explica que la consulta está fuera del alcance oficial.

---

## 5. Uso de Gemma 4: El Componente Central

Gemma 4 (variante multimodal de ~12B) no es un simple envoltorio en HablaPE: es el **cerebro orquestador** que procesa la información en dos momentos cruciales del flujo:

```
                  ┌──────────────────────────────────────────────┐
                  │          ENTRADA MULTIMODAL DEL USUARIO       │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ MOMENTO 1: COMPRENSIÓN (Gemma 4)                                                      │
│ • Procesa Audio / Texto / Imagen directamente.                                         │
│ • Clasifica el escenario del control de identidad.                                     │
│ • Extrae hechos clave y evalúa suficiencia de datos.                                   │
│ • Ejecuta Tool Calling para seleccionar la consulta normativamente adecuada.           │
│ • Retorna un CONTRATO JSON ESTRUCTURADO al orquestador.                                │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PROCESAMIENTO INTERMEDIO                                                               │
│ • Vertex AI Vector Search (Corpus Oficial) + Motor Determinístico (Validación Python)   │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ MOMENTO 2: GENERACIÓN RESTRICTA (Gemma 4)                                              │
│ • Recibe la evidencia legal recuperada + reglas del motor determinístico.             │
│ • Aplica System Prompt de Seguridad (evita asesoría legal y denuncias).                │
│ • Sintetiza en lenguaje claro: Hechos | Explicación | Derechos | Frases Sugeridas.       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Funciones Específicas de Gemma 4:
1. **Comprensión Multimodal Nativa:** Recibe directamente audio, fotos de actas o texto sin recurrir a encadenamientos complejos de modelos secundarios.
2. **Tool Calling y Salida Estructurada:** Genera esquemas JSON validados con Pydantic, garantizando un acoplamiento perfecto con la lógica del backend FastAPI.
3. **Generación con System Prompt de Seguridad:** Transforma artículos jurídicos en explicaciones sencillas en lenguaje ciudadano, manteniendo fidelidad exacta a la fuente.

---

## 6. Motor Determinístico (Reglas y Validaciones)

Para complementar la IA generativa con rigor legal, se integró un **Motor Determinístico (Python puro sin IA)** que ejecuta las siguientes validaciones insalvables:

* **Control de Versión y Vigencia:** Verifica la vigencia de la norma citada (priorizando el Decreto Supremo N° 012-2025-IN sobre su antecesor derogado D.S. N° 026-2017-IN).
* **Validación de Competencia:** Comprueba si el procedimiento corresponde al ámbito policial o a otra entidad (como SUNAT o INDECOPI).
* **Umbral de Evidencia RAG:** Evalúa la puntuación de similitud del contexto recuperado. Si la evidencia es insuficiente, cancela la generación generativa y redirige el flujo.

---

## 7. Principales Retos y Decisiones Técnicas

| Reto Técnico | Decisión / Solución Implementada |
| :--- | :--- |
| **Riesgo de alucinaciones en un dominio legal delicado** | Implementación de RAG restrictivo sobre un corpus 100% oficial + compuerta "fuera de alcance" en el motor determinístico si no se halla respaldo normativo. |
| **Normativa cambiante y derogaciones (Vigencia legal)** | Metadatos de revisión y fuente en Vector Search, validados mediante reglas determinísticas en Python. |
| **Consistencia en el pipeline entre capas** | Contrato Pydantic estable; Gemma propone la ruta, pero el backend valida la decisión y asigna las citas. |
| **Procesamiento de fuentes heterogéneas del usuario** | Aprovechamiento del diseño multimodal nativo de Gemma 4 para recibir audio, fotos de actas o texto en un solo llamado. |
| **Demarcación clara de responsabilidad legal** | Diseño UX/UI que separa explícitamente Hechos, Explicación, Fuentes Oficiales y Limitaciones Legalmente Transparentes. |

---

## 8. Corpus Oficial Incorporado (Dominio MVP)

Para el escenario de **control de identidad policial**, el MVP cuenta con la ingesta y estructuración del siguiente corpus normativo del Estado peruano:

* **Código Procesal Penal — D. Leg. N° 957:** Art. 205 y sus modificatorias directas (D.L. 1574 y Ley 32130).
* **Reglamento Vigente del Control de Identidad Policial:** D.S. N° 012-2025-IN (vigente desde noviembre 2025).
* **Constitución Política del Perú (1993):** Derechos fundamentales de la persona y libertad personal.
* **Ley de la Policía Nacional del Perú:** D. Leg. N° 1267 y Ley Orgánica de la PNP.
* **Código de Conducta y Manual de DD.HH. de la PNP:** Normas de trato respetuoso y uso prudente de la fuerza.
* **Manual de Procedimientos Operativos Policiales (COMOPPOL)**.
* **TUO de la Ley del Procedimiento Administrativo General (Ley 27444)** e **Informe Defensorial N.° 266**.

---

## 9. Stack Tecnológico

* **Modelo IA Central:** Gemma 4 12B multimodal en un endpoint personalizado de Vertex AI.
* **Backend:** Python + FastAPI (Pydantic, Uvicorn).
* **Vector Store & RAG:** Vertex AI Vector Search 2.0 con `gemini-embedding-001`.
* **Frontend:** React + TailwindCSS (diseño responsivo, fluido e intuitivo).
* **Infraestructura Google Cloud:** Cloud Run (despliegue de servicios), Cloud Storage (documentos oficiales), Secret Manager (gestión de API keys), Cloud Logging (monitoreo).
* **Control de Versiones:** GitHub.

---

## 10. Impacto y Visión de Escala

### Impacto Social Directo
HablaPE empodera al ciudadano peruano ante situaciones cotidianas de vulnerabilidad, reduciendo la asimetría de información y previniendo conflictos mediante la sugerencia de respuestas educadas y legalmente fundamentadas.

### Escalabilidad Multidominio
Aunque el MVP se enfoca en el control de identidad policial, la arquitectura modular en FastAPI + Gemma 4 + RAG está diseñada para escalar a otros trámites y procedimientos gubernamentales agregando nuevos índices normativos:
* **INDECOPI:** Derechos del consumidor y reclamos comerciales.
* **SUNAT / RENIEC:** Trámites de identidad y normativas tributarias básicas.
* **Municipalidades:** Fiscalización, licencias y vía pública.

---

## 11. Cierre

HablaPE demuestra cómo el potencial de **Gemma 4**, combinado con una arquitectura RAG rigurosa y validación determinística, puede transformar el acceso a la justicia y la información pública en el Perú. Un sistema **confiable, transparente y verificable**, siempre respaldado en la norma oficial.
