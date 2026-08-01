# HablaPE API

Backend FastAPI para orientación procedimental trazable. La primera versión
implementa texto y borradores; audio y extracción documental se habilitarán
cuando estén configurados los servicios de GCP.

## Flujo

1. Valida consentimiento y tamaño de entrada.
2. Detecta posibles datos personales sin persistir el relato.
3. Clasifica el escenario con reglas conservadoras.
4. Recupera únicamente chunks aprobados del corpus.
5. Adjunta citas, plazos y acciones desde reglas deterministas.
6. Redacta la explicación mediante reglas locales o un endpoint Vertex.
7. Ejecuta validadores de alcance, citas y vigencia.
8. Registra solo metadatos de la ejecución, nunca el relato.

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

## Endpoints

- `GET /health/live`
- `GET /health/ready`
- `GET /v1/capabilities`
- `GET /v1/sources`
- `POST /v1/orientations`
- `POST /v1/complaints/draft`

Ejemplo:

```powershell
$body = @{
  text = "Un policía me pidió mi DNI y no explicó el motivo."
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

Variables de producción:

- `HABLAPE_ENV=production`
- `HABLAPE_MODEL_PROVIDER=rules|vertex`
- `HABLAPE_TRACE_PROVIDER=memory|firestore`
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION`
- `HABLAPE_VERTEX_ENDPOINT`
- `HABLAPE_CORS_ORIGINS`

Construir desde la raíz:

```powershell
docker build -f api/Dockerfile -t hablape-api .
```

