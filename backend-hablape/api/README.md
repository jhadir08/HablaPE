# HablaPE API

Backend FastAPI para conversación y orientación procedimental trazable. En
producción, Speech-to-Text V2 convierte la voz en texto editable y Gemma elige
entre una respuesta directa y una respuesta respaldada por Vertex AI Vector
Search.

## Flujo

1. Valida consentimiento, MIME type, duración y tamaño sin persistir archivos.
2. `/v1/transcriptions` convierte el audio binario en texto mediante Cloud
   Speech-to-Text V2; la persona revisa la transcripción antes de consultar.
3. Para inglés, quechua o aimara, Cloud Translation normaliza el texto al
   español; Gemma puede interpretar una imagen si el contenedor lo permite.
4. Gemma propone `direct`, `rag` o `blocked`; una compuerta conservadora obliga
   a usar RAG cuando se solicitan reglas, facultades, procedimientos o plazos.
5. En `direct`, Gemma conversa sin presentar afirmaciones como normas vigentes.
6. En `rag`, Vector Search recupera solo chunks oficiales y no sintéticos.
7. Gemma explica la evidencia; el backend, no el modelo, asigna los `chunk_id`.
8. Traduce la explicación y las acciones al idioma elegido, pero conserva sin
   traducir los fragmentos, títulos y localizadores de las fuentes oficiales.
9. Registra solo metadatos de la ejecución, nunca el relato ni el archivo.

La respuesta expone `answer_mode=direct_gemma|rag_gemma|blocked`, por lo que el
frontend puede diferenciar una conversación general de una orientación con
fuentes oficiales.

## Ejecutar

Desde `api/`:

```powershell
python -m pip install -r requirements.txt
$env:PYTHONPATH = (Get-Location).Path
uvicorn app.main:app --reload
```

Documentación interactiva: `http://localhost:8000/docs`.

## Probar

```powershell
$env:PYTHONPATH = (Get-Location).Path
python -m unittest discover -s tests -v
```

Las pruebas del soporte multilingue simulan el cliente de Cloud Translation:
no necesitan credenciales, no realizan llamadas externas y no generan costos.

El endpoint de orientaciones acepta el campo opcional `idioma` con uno de estos
códigos: `es` (español), `en` (inglés), `qu` (quechua) o `ay` (aimara). Las
fuentes oficiales se conservan en español aunque la explicación y las acciones
se traduzcan.

## Endpoints

- `GET /health/live`
- `GET /health/ready`
- `GET /v1/capabilities`
- `GET /v1/sources`
- `POST /v1/transcriptions`
- `POST /v1/orientations`
- `POST /v1/complaints/draft`

Ejemplo:

```powershell
$body = @{
  text = "Un policía me pidió mi DNI y no explicó el motivo."
  idioma = "es" # es, en, qu o ay
  consent_to_process = $true
  is_synthetic = $true
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8000/v1/orientations `
  -ContentType application/json `
  -Body $body
```

## GCP

En Cloud Run se usa una cuenta de servicio administrada por el usuario y
Application Default Credentials. No se configura
`GOOGLE_APPLICATION_CREDENTIALS` ni se suben llaves JSON.

Cloud Translation no requiere una variable adicional: usa
`GOOGLE_CLOUD_PROJECT`, ADC y la ubicación global del servicio. La API debe
estar habilitada y la cuenta del backend necesita `roles/cloudtranslate.user`.

Variables de producción:

- `HABLAPE_ENV=production`
- `HABLAPE_MODEL_PROVIDER=rules|vertex|agent` (`agent` en Cloud Run)
- `HABLAPE_TRACE_PROVIDER=memory|firestore`
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION`
- `HABLAPE_VERTEX_ENDPOINT`
- `HABLAPE_GEMMA_ENDPOINT_ID`
- `HABLAPE_GEMMA_REQUEST_SCHEMA=prompt|vllm`
- `HABLAPE_GEMMA_MEDIA_SCHEMA=auto|gemma4|inline_data`
- `HABLAPE_GEMMA_TIMEOUT_SECONDS=30`
- `HABLAPE_GEMMA_MAX_OUTPUT_TOKENS=768`
- `HABLAPE_VECTOR_COLLECTION_ID`
- `HABLAPE_RAG_TOP_K`
- `HABLAPE_SPEECH_LOCATION=us`
- `HABLAPE_SPEECH_MODEL=chirp_3`
- `HABLAPE_SPEECH_LANGUAGE_CODES=es-US`
- `HABLAPE_CORS_ORIGINS`

Construir desde la raíz:

```powershell
docker build -f api/Dockerfile -t hablape-api .
```

El esquema de imagen de un endpoint personalizado de Vertex depende del
contenedor de predicción. El audio no usa ese contrato: se procesa por
Speech-to-Text V2 y `/v1/orientations` rechaza audio sin transcribir.

