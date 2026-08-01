#!/usr/bin/env bash
set -euo pipefail

: "${GOOGLE_CLOUD_PROJECT:?Exporta GOOGLE_CLOUD_PROJECT antes de ejecutar.}"

REGION="${GOOGLE_CLOUD_LOCATION:-us-central1}"
REPOSITORY="${HABLAPE_ARTIFACT_REPOSITORY:-hablape}"
BACKEND_SERVICE="${HABLAPE_BACKEND_SERVICE:-hablape-api}"
FRONTEND_SERVICE="${HABLAPE_FRONTEND_SERVICE:-hablape-web}"
BACKEND_SA_NAME="${HABLAPE_BACKEND_SERVICE_ACCOUNT:-hablape-api}"
FRONTEND_SA_NAME="${HABLAPE_FRONTEND_SERVICE_ACCOUNT:-hablape-web}"
MODEL_PROVIDER="${HABLAPE_MODEL_PROVIDER:-agent}"
TRACE_PROVIDER="${HABLAPE_TRACE_PROVIDER:-memory}"
GEMMA_REQUEST_SCHEMA="${HABLAPE_GEMMA_REQUEST_SCHEMA:-prompt}"
GEMMA_MEDIA_SCHEMA="${HABLAPE_GEMMA_MEDIA_SCHEMA:-auto}"
VECTOR_COLLECTION_ID="${HABLAPE_VECTOR_COLLECTION_ID:-hablape-corpus}"
RAG_TOP_K="${HABLAPE_RAG_TOP_K:-6}"

PROJECT_ID="$GOOGLE_CLOUD_PROJECT"
BACKEND_SA="${BACKEND_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
FRONTEND_SA="${FRONTEND_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}"
BACKEND_IMAGE="${REGISTRY}/api"
FRONTEND_IMAGE="${REGISTRY}/web"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
REPO_ROOT="$(cd -- "${BACKEND_ROOT}/.." && pwd)"
FRONTEND_ROOT="${REPO_ROOT}/frontend-hablape"

for command in gcloud git; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Falta el comando requerido: $command" >&2
    exit 1
  fi
done

gcloud config set project "$PROJECT_ID" >/dev/null
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iamcredentials.googleapis.com \
  aiplatform.googleapis.com \
  vectorsearch.googleapis.com \
  translate.googleapis.com \
  --project "$PROJECT_ID"

if ! gcloud artifacts repositories describe "$REPOSITORY" \
  --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPOSITORY" \
    --repository-format docker \
    --location "$REGION" \
    --project "$PROJECT_ID"
fi

if ! gcloud iam service-accounts describe "$BACKEND_SA" \
  --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$BACKEND_SA_NAME" \
    --display-name "HablaPE backend runtime" \
    --project "$PROJECT_ID"
fi

if ! gcloud iam service-accounts describe "$FRONTEND_SA" \
  --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$FRONTEND_SA_NAME" \
    --display-name "HablaPE frontend runtime" \
    --project "$PROJECT_ID"
fi

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member "serviceAccount:${BACKEND_SA}" \
  --role roles/aiplatform.user \
  --condition=None \
  --quiet >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member "serviceAccount:${BACKEND_SA}" \
  --role roles/vectorsearch.viewer \
  --condition=None \
  --quiet >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member "serviceAccount:${BACKEND_SA}" \
  --role roles/cloudtranslate.user \
  --condition=None \
  --quiet >/dev/null

gcloud builds submit "$BACKEND_ROOT" \
  --config "$BACKEND_ROOT/cloudbuild.api.yaml" \
  --substitutions "_IMAGE=${BACKEND_IMAGE}" \
  --project "$PROJECT_ID"

BACKEND_ENV=(
  "HABLAPE_ENV=production"
  "HABLAPE_MODEL_PROVIDER=${MODEL_PROVIDER}"
  "HABLAPE_TRACE_PROVIDER=${TRACE_PROVIDER}"
  "GOOGLE_CLOUD_PROJECT=${PROJECT_ID}"
  "GOOGLE_CLOUD_LOCATION=${REGION}"
  "GOOGLE_GENAI_USE_VERTEXAI=true"
)

if [[ "$MODEL_PROVIDER" == "agent" || "$MODEL_PROVIDER" == "vertex" ]]; then
  : "${HABLAPE_GEMMA_ENDPOINT_ID:?Para usar Gemma exporta HABLAPE_GEMMA_ENDPOINT_ID.}"
fi

if [[ "$MODEL_PROVIDER" == "agent" ]]; then
  BACKEND_ENV+=(
    "HABLAPE_GEMMA_ENDPOINT_ID=${HABLAPE_GEMMA_ENDPOINT_ID}"
    "HABLAPE_GEMMA_REQUEST_SCHEMA=${GEMMA_REQUEST_SCHEMA}"
    "HABLAPE_GEMMA_MEDIA_SCHEMA=${GEMMA_MEDIA_SCHEMA}"
    "HABLAPE_VECTOR_COLLECTION_ID=${VECTOR_COLLECTION_ID}"
    "HABLAPE_RAG_TOP_K=${RAG_TOP_K}"
  )
elif [[ "$MODEL_PROVIDER" == "vertex" ]]; then
  VERTEX_ENDPOINT="https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/endpoints/${HABLAPE_GEMMA_ENDPOINT_ID}:predict"
  BACKEND_ENV+=("HABLAPE_VERTEX_ENDPOINT=${VERTEX_ENDPOINT}")
fi

BACKEND_ENV_CSV="$(IFS=,; echo "${BACKEND_ENV[*]}")"

gcloud run deploy "$BACKEND_SERVICE" \
  --image "$BACKEND_IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --service-account "$BACKEND_SA" \
  --port 8080 \
  --cpu 2 \
  --memory 2Gi \
  --concurrency 40 \
  --min-instances 0 \
  --max-instances 5 \
  --timeout 120 \
  --set-env-vars "$BACKEND_ENV_CSV" \
  --no-allow-unauthenticated \
  --quiet

BACKEND_URL="$(gcloud run services describe "$BACKEND_SERVICE" \
  --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)')"

gcloud run services add-iam-policy-binding "$BACKEND_SERVICE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --member "serviceAccount:${FRONTEND_SA}" \
  --role roles/run.invoker \
  --quiet >/dev/null

gcloud builds submit "$FRONTEND_ROOT" \
  --tag "$FRONTEND_IMAGE" \
  --project "$PROJECT_ID"

gcloud run deploy "$FRONTEND_SERVICE" \
  --image "$FRONTEND_IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --service-account "$FRONTEND_SA" \
  --port 8080 \
  --cpu 1 \
  --memory 512Mi \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 5 \
  --timeout 60 \
  --set-env-vars "HABLAPE_BACKEND_URL=${BACKEND_URL},HABLAPE_BACKEND_AUDIENCE=${BACKEND_URL},HABLAPE_BACKEND_AUTH=id-token" \
  --allow-unauthenticated \
  --quiet

FRONTEND_URL="$(gcloud run services describe "$FRONTEND_SERVICE" \
  --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)')"

echo
echo "Backend privado:  ${BACKEND_URL}"
echo "Frontend público: ${FRONTEND_URL}"
echo "Prueba de salud:   ${FRONTEND_URL}/api/health"
