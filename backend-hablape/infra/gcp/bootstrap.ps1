[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^[a-z][a-z0-9-]{4,28}[a-z0-9]$')]
    [string]$ProjectId,

    [ValidatePattern('^[a-z]+-[a-z0-9]+[0-9]$')]
    [string]$Region = 'us-central1',

    [ValidatePattern('^[a-z][a-z0-9-]{2,62}$')]
    [string]$Repository = 'hablape',

    [ValidatePattern('^[a-z][a-z0-9-]{2,28}[a-z0-9]$')]
    [string]$RuntimeServiceAccount = 'hablape-api'
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    throw 'Google Cloud CLI no está instalado o no está en PATH.'
}

$activeAccount = gcloud auth list --filter=status:ACTIVE --format='value(account)'
if (-not $activeAccount) {
    throw 'No hay una sesión activa. Ejecuta: gcloud auth login'
}

$project = gcloud projects describe $ProjectId --format=json 2>$null |
    ConvertFrom-Json
if (-not $project) {
    throw "No se puede acceder al proyecto '$ProjectId'."
}

$runtimeEmail = "$RuntimeServiceAccount@$ProjectId.iam.gserviceaccount.com"
$services = @(
    'run.googleapis.com',
    'artifactregistry.googleapis.com',
    'cloudbuild.googleapis.com',
    'iam.googleapis.com',
    'iamcredentials.googleapis.com',
    'logging.googleapis.com',
    'serviceusage.googleapis.com'
)

if ($PSCmdlet.ShouldProcess($ProjectId, 'Configurar proyecto y habilitar APIs base')) {
    gcloud config set project $ProjectId
    gcloud config set run/region $Region
    gcloud services enable $services --project $ProjectId
}

$serviceAccountExists = $true
gcloud iam service-accounts describe $runtimeEmail --project $ProjectId --quiet 2>$null
if ($LASTEXITCODE -ne 0) {
    $serviceAccountExists = $false
}

if (
    -not $serviceAccountExists -and
    $PSCmdlet.ShouldProcess($runtimeEmail, 'Crear cuenta de servicio de ejecución')
) {
    gcloud iam service-accounts create $RuntimeServiceAccount `
        --display-name='HablaPE API runtime' `
        --project $ProjectId
}

$repositoryExists = $true
gcloud artifacts repositories describe $Repository `
    --location $Region `
    --project $ProjectId `
    --quiet 2>$null
if ($LASTEXITCODE -ne 0) {
    $repositoryExists = $false
}

if (
    -not $repositoryExists -and
    $PSCmdlet.ShouldProcess($Repository, 'Crear Artifact Registry Docker')
) {
    gcloud artifacts repositories create $Repository `
        --repository-format=docker `
        --location $Region `
        --description='Imágenes de HablaPE' `
        --project $ProjectId
}

if ($PSCmdlet.ShouldProcess($runtimeEmail, 'Conceder escritura de logs')) {
    gcloud projects add-iam-policy-binding $ProjectId `
        --member="serviceAccount:$runtimeEmail" `
        --role='roles/logging.logWriter' `
        --condition=None `
        --quiet
}

[pscustomobject]@{
    ProjectId = $ProjectId
    Region = $Region
    ActiveAccount = $activeAccount
    RuntimeServiceAccount = $runtimeEmail
    ArtifactRepository = $Repository
    Next = 'Ejecutar deploy-api.ps1 después de probar la API local.'
} | Format-List
