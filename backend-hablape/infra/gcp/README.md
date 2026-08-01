# GCP para HablaPE API

## Lo que necesito del propietario del proyecto

No envíes llaves JSON, tokens ni contraseñas por chat. Para la primera
publicación solo hacen falta decisiones y autenticación interactiva:

1. `PROJECT_ID` de un proyecto con facturación activa.
2. Región inicial. Recomendación operativa: `us-central1` hasta confirmar
   disponibilidad del modelo y cuota; si existe una exigencia de residencia o
   latencia, se evalúa otra región antes de crear datos.
3. Confirmar si el backend será:
   - privado y llamado por otro servicio Cloud Run; o
   - público con una capa adicional de autenticación y rate limiting.
4. Una cuenta humana con permisos para habilitar APIs, crear cuentas de
   servicio, Artifact Registry y Cloud Run.
5. Instalar Google Cloud CLI e iniciar sesión mediante navegador:

   ```powershell
   gcloud auth login
   gcloud auth application-default login
   ```

El despliegue y la aplicación usarán cuentas de servicio administradas por GCP.
No se necesita `GOOGLE_APPLICATION_CREDENTIALS` en Cloud Run.

## Fase 1 — backend textual

Recursos mínimos:

- Cloud Run;
- Artifact Registry;
- Cloud Build;
- una cuenta de servicio `hablape-api`;
- Cloud Logging, incluido con Cloud Run.

La API puede salir a producción en modo determinista sin Vertex, Firestore,
Speech-to-Text, Storage ni Secret Manager.

APIs:

```text
run.googleapis.com
artifactregistry.googleapis.com
cloudbuild.googleapis.com
iam.googleapis.com
iamcredentials.googleapis.com
logging.googleapis.com
serviceusage.googleapis.com
```

## Fase 2 — IA y trazas

Cuando la API textual esté estable:

| Capacidad | Dato o decisión necesaria |
| --- | --- |
| Vertex AI | Modelo, región, endpoint desplegado y cuota GPU/API |
| Firestore | ID de base y ubicación; la ubicación se decide antes de crearla |
| Speech-to-Text v2 | Región y locale probado con audio peruano |
| Cloud Storage | Nombre, ubicación, retención y borrado de audio/imágenes |
| Secret Manager | Solo secretos externos; ADC no necesita secretos |

APIs adicionales:

```text
aiplatform.googleapis.com
firestore.googleapis.com
speech.googleapis.com
storage.googleapis.com
secretmanager.googleapis.com
```

## Permisos

Para ejecutar el bootstrap, la cuenta humana necesita capacidad equivalente a:

- Service Usage Admin;
- Service Account Admin;
- Project IAM Admin;
- Artifact Registry Admin.

Para desplegar, la identidad de CI necesita Cloud Run Developer, Artifact
Registry Writer y Service Account User sobre `hablape-api`. En GitHub se usará
Workload Identity Federation; no se crearán llaves permanentes.

La identidad de ejecución recibirá solo los permisos de los servicios que
realmente estén habilitados. No se utilizará la cuenta de servicio por defecto.

## Orden recomendado

1. Instalar `gcloud` e iniciar sesión.
2. Ejecutar `bootstrap.ps1` con el proyecto y región confirmados.
3. Ejecutar las pruebas locales.
4. Desplegar la API determinista con `deploy-api.ps1`.
5. Probar `/health/ready`, `/v1/sources` y los dos recorridos.
6. Crear WIF para GitHub.
7. Habilitar Firestore, Vertex, voz y archivos por separado.

## Despliegue conjunto frontend + backend

El script `deploy-stack.sh` está pensado para Cloud Shell o Vertex AI
Workbench. Construye dos imágenes y dos servicios:

- `hablape-api`: FastAPI privado;
- `hablape-web`: React/Express público.

La cuenta de servicio del frontend recibe únicamente `roles/run.invoker` sobre
el backend. Express genera un ID token en cada llamada servidor a servidor. El
navegador usa `/api/query` en su mismo origen, por lo que no recibe credenciales
ni necesita conocer la URL privada.

Desde la raíz del repositorio:

```bash
export GOOGLE_CLOUD_PROJECT=project-c8477605-3a1f-4178-a00
export GOOGLE_CLOUD_LOCATION=us-central1

# Para iniciar sin modelo generativo:
export HABLAPE_MODEL_PROVIDER=rules

bash backend-hablape/infra/gcp/deploy-stack.sh
```

Para usar el endpoint Gemma ya desplegado:

```bash
export HABLAPE_MODEL_PROVIDER=vertex
export HABLAPE_GEMMA_ENDPOINT_ID=REEMPLAZAR_CON_ENDPOINT_ID

bash backend-hablape/infra/gcp/deploy-stack.sh
```

El ID de endpoint no es una clave secreta. El backend construye la URL regional
de predicción y se autentica mediante su cuenta de servicio. Esa cuenta necesita
`roles/aiplatform.user`.

Variables opcionales del script:

```text
HABLAPE_ARTIFACT_REPOSITORY=hablape
HABLAPE_BACKEND_SERVICE=hablape-api
HABLAPE_FRONTEND_SERVICE=hablape-web
HABLAPE_BACKEND_SERVICE_ACCOUNT=hablape-api
HABLAPE_FRONTEND_SERVICE_ACCOUNT=hablape-web
HABLAPE_TRACE_PROVIDER=memory|firestore
```

Al terminar, el script imprime las dos URLs. Verifica la conexión usando la URL
pública del frontend:

```bash
FRONTEND_URL="$(gcloud run services describe hablape-web \
  --region "$GOOGLE_CLOUD_LOCATION" \
  --project "$GOOGLE_CLOUD_PROJECT" \
  --format='value(status.url)')"
curl "$FRONTEND_URL/api/health"
```

