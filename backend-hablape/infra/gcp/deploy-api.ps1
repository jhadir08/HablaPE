[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^[a-z][a-z0-9-]{4,28}[a-z0-9]$')]
    [string]$ProjectId,

    [ValidatePattern('^[a-z]+-[a-z0-9]+[0-9]$')]
    [string]$Region = 'us-central1',

    [string]$Repository = 'hablape',
    [string]$Service = 'hablape-api',
    [string]$RuntimeServiceAccount = 'hablape-api',

    [switch]$AllowUnauthenticated
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    throw 'Google Cloud CLI no está instalado o no está en PATH.'
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$image = "$Region-docker.pkg.dev/$ProjectId/$Repository/api"
$runtimeEmail = "$RuntimeServiceAccount@$ProjectId.iam.gserviceaccount.com"

gcloud builds submit $repoRoot `
    --tag $image `
    --project $ProjectId `
    --quiet

$accessFlag = if ($AllowUnauthenticated) {
    '--allow-unauthenticated'
} else {
    '--no-allow-unauthenticated'
}

gcloud run deploy $Service `
    --image $image `
    --region $Region `
    --project $ProjectId `
    --service-account $runtimeEmail `
    --port 8080 `
    --cpu 1 `
    --memory 1Gi `
    --concurrency 40 `
    --min-instances 0 `
    --max-instances 5 `
    --timeout 30 `
    --set-env-vars="HABLAPE_ENV=production,HABLAPE_MODEL_PROVIDER=rules,HABLAPE_TRACE_PROVIDER=memory,GOOGLE_CLOUD_PROJECT=$ProjectId,GOOGLE_CLOUD_LOCATION=$Region" `
    $accessFlag `
    --quiet

gcloud run services describe $Service `
    --region $Region `
    --project $ProjectId `
    --format='value(status.url)'

