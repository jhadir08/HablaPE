# RAG estructural de HablaPE en Google Cloud

Este módulo copia los PDF compartidos en Drive a Cloud Storage, usa Document AI
Layout Parser para recuperar la estructura visual, genera chunks jurídicos
trazables, los indexa en Vertex AI Vector Search 2.0 y expone un grafo acotado
de LangGraph/LangChain para recuperación y explicación con Gemma.

## Decisión de chunking

No se usa un separador de caracteres único. El orden es:

1. título exacto detectado por Layout Parser (sin corregirlo con un LLM);
2. jerarquía exacta `LIBRO > TÍTULO > SECCIÓN > CAPÍTULO > ARTÍCULO`;
3. encabezados numerados para informes, por ejemplo `3.2 Resultados`;
4. párrafos completos hasta 800 tokens aproximados;
5. solo un párrafo excesivo se divide por límites de oración.

Cada chunk lleva título, ruta de encabezados, páginas, localizador, URL de
origen, URI de GCS, hash del PDF, hash del contenido, estado de revisión y las
banderas `is_official` e `is_synthetic`. La repetición de la ruta jerárquica
aporta contexto sin mezclar el texto de artículos distintos.

## Arquitectura

```text
Google Drive compartido
  -> Cloud Storage (PDF + manifest + SHA-256)
  -> Document AI Layout Parser batch
  -> AdaptiveLegalChunker (determinista)
  -> JSONL versionable en Cloud Storage
  -> gemini-embedding-001
  -> Vertex AI Vector Search 2.0
  -> LangGraph: comprender -> decidir direct/RAG -> recuperar si aplica
                -> explicar con Gemma -> adjuntar citas deterministas
```

Gemma puede conversar directamente cuando la pregunta no necesita respaldo
jurídico. Si sí lo necesita, el agente recupera chunks oficiales y el backend
adjunta sus IDs; Gemma no selecciona citas. Los plazos, competencia, vigencia y
canales continúan bajo validadores deterministas.

## Preparar Workbench

En una terminal del Workbench:

```bash
cd rag
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Configure las variables del `.env` en la sesión (este módulo no incorpora un
cargador que pueda esconder errores de configuración). El service account del
Workbench necesita lectura de la carpeta de Drive y estos permisos mínimos:

- `roles/storage.objectAdmin` sobre el bucket del corpus;
- `roles/documentai.apiUser` sobre el procesador;
- `roles/aiplatform.user` para embeddings, Vector Search y el endpoint Gemma.

Copie `source_registry.example.json` como `source_registry.json` y registre cada
`drive_file_id` con su recorrido y URL oficial después de revisión humana. Los
archivos ausentes del registro se conservan como `is_official=false` y el agente
no los recupera. Subir un PDF a Drive no lo convierte en fuente oficial.

Habilite las APIs:

```bash
gcloud services enable \
  drive.googleapis.com storage.googleapis.com documentai.googleapis.com \
  aiplatform.googleapis.com vectorsearch.googleapis.com
```

Cree un Layout Parser en ubicación `us` o `eu`. Para producción use primero la
versión estable configurada en `.env`; pruebe una versión Gemini Preview solo
después de decidir residencia de datos y costo. Para los PDF largos se usa
`batchProcess`, no el límite online de 15 páginas.

La colección de Vector Search 2.0 debe existir y aceptar los metadatos listados
en `CorpusChunk.langchain_metadata()`. Después ejecute:

```bash
PYTHONPATH=. python -m hablape_rag.pipeline --output output/chunks.jsonl
PYTHONPATH=. python -m hablape_rag.pipeline --index-existing output/chunks.jsonl
```

La primera orden permite inspeccionar y aprobar los chunks antes de indexar.
La segunda no repite ni cobra nuevamente el procesamiento de Document AI.
No marque `is_official=true` por el nombre del archivo: esa clasificación debe
venir de un manifiesto jurídico revisado contra la URL oficial vigente.

## Usar el grafo

```python
from hablape_rag.agent import build_hablape_graph
from hablape_rag.gemma_endpoint import GemmaVertexEndpoint
from hablape_rag.vector_store import build_vector_store

store = build_vector_store(
    project_id=PROJECT_ID,
    location=LOCATION,
    collection_id=COLLECTION_ID,
)
model = GemmaVertexEndpoint(
    project_id=PROJECT_ID,
    location=LOCATION,
    endpoint_id=GEMMA_ENDPOINT_ID,
    request_schema="vllm",  # use "prompt" si así fue desplegado el contenedor
)
graph = build_hablape_graph(vector_store=store, model=model)
result = graph.invoke({
    "question": "¿Cuándo puede la Policía pedirme el DNI?",
    "media": [],
})
print(result["answer"])
```

El adaptador admite `inputs` para vLLM o `prompt` para el contenedor ya probado.
Para imagen/audio ofrece `auto`, `gemma4` e `inline_data`; `auto` reintenta el
segundo formato únicamente si el primero recibe HTTP 400.
Vertex no impone un esquema universal a contenedores personalizados: confirme
el contrato del handler desplegado y ejecute el smoke test antes de publicar.

## Pruebas locales

```bash
PYTHONPATH=. pytest -q
```

Las pruebas no llaman a GCP; verifican preservación del título, artículo,
encabezado numerado y agrupación por párrafos.

## Recuperar una salida batch ya procesada

Si una versión anterior produjo `0 chunks` porque los JSON de Document AI no
incluyeron `uri`, no repita el procesamiento. El recuperador cruza el Drive file
ID preservado en el nombre del JSON con el manifiesto de ingesta:

```bash
PYTHONPATH=. python recover_existing.py
```
