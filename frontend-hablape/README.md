# HablaPE frontend

Aplicación React servida por Express. El navegador nunca llama directamente a
Vertex AI ni necesita credenciales de Google. Las consultas siguen este flujo:

```text
Browser -> POST /api/query (Express) -> POST /v1/orientations (FastAPI)
```

En Cloud Run, Express obtiene un ID token con su cuenta de servicio y llama al
backend privado. La explicación generada y las fuentes aprobadas se mantienen
como campos separados en la respuesta visual.

## Desarrollo local

Primero levanta FastAPI:

```bash
cd ../backend-hablape/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=.
export HABLAPE_ENV=local
export HABLAPE_MODEL_PROVIDER=rules
export HABLAPE_TRACE_PROVIDER=memory
uvicorn app.main:app --reload --port 8000
```

En otra terminal:

```bash
cd frontend-hablape
cp .env.example .env
npm ci
npm run dev
```

El archivo `.env` local contiene:

```dotenv
HABLAPE_BACKEND_URL=http://127.0.0.1:8000
HABLAPE_BACKEND_AUTH=none
```

Abre `http://localhost:3000`. Para una consulta de texto se exige aceptación
explícita del procesamiento temporal. Audio e imagen responden como capacidad
pendiente hasta conectar sus servicios de GCP; no se simulan respuestas legales.

## Variables del frontend en Cloud Run

| Variable | Valor esperado |
| --- | --- |
| `HABLAPE_BACKEND_URL` | URL `run.app` del backend privado, sin ruta final |
| `HABLAPE_BACKEND_AUDIENCE` | La misma URL del backend usada como audiencia del ID token |
| `HABLAPE_BACKEND_AUTH` | `id-token` |
| `HABLAPE_ENABLE_LEGACY_AI` | `false` |
| `PORT` | Inyectada por Cloud Run; el servidor la respeta |

No configures claves de servicio ni `GOOGLE_APPLICATION_CREDENTIALS`. Cloud Run
usa Application Default Credentials de la cuenta de servicio `hablape-web`.

## Validación

```bash
npm test
npm run lint
npm run build
```

La imagen se construye con `frontend-hablape/Dockerfile` y ejecuta como usuario
no privilegiado sobre el puerto definido por Cloud Run.
