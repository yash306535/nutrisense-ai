#!/usr/bin/env bash
# NutriSense — Manual Google Cloud Run Deployment Script
# Usage: ./deploy-cloudrun.sh <GCP_PROJECT_ID> <REGION>
# Example: ./deploy-cloudrun.sh my-project us-central1

set -euo pipefail

PROJECT_ID="${1:-$(gcloud config get-value project)}"
REGION="${2:-us-central1}"
SERVER_IMAGE="gcr.io/${PROJECT_ID}/nutrisense-server:latest"
CLIENT_IMAGE="gcr.io/${PROJECT_ID}/nutrisense-client:latest"

echo "🚀 Deploying NutriSense to Google Cloud Run"
echo "   Project: ${PROJECT_ID}"
echo "   Region:  ${REGION}"

# ── Authenticate ──────────────────────────────────────────────────────────
gcloud auth configure-docker --quiet

# ── Enable required APIs ──────────────────────────────────────────────────
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  --project="${PROJECT_ID}" --quiet

# ── Create Secrets (skip if they already exist) ───────────────────────────
create_secret() {
  local name=$1
  local value=$2
  if gcloud secrets describe "${name}" --project="${PROJECT_ID}" &>/dev/null; then
    echo "   Secret ${name} already exists, skipping"
  else
    echo -n "${value}" | gcloud secrets create "${name}" \
      --data-file=- \
      --replication-policy=automatic \
      --project="${PROJECT_ID}"
    echo "   ✓ Created secret: ${name}"
  fi
}

echo "📦 Creating secrets in Secret Manager..."
# Load from .env file if it exists
if [ -f ".env" ]; then
  source .env
fi

create_secret "nutrisense-mongo-uri" "${MONGODB_URI:-mongodb://localhost:27017/nutrisense}"
create_secret "nutrisense-redis-url" "${REDIS_URL:-redis://localhost:6379}"
create_secret "nutrisense-jwt-access" "${JWT_ACCESS_SECRET:-changeme-access}"
create_secret "nutrisense-jwt-refresh" "${JWT_REFRESH_SECRET:-changeme-refresh}"
create_secret "nutrisense-nvidia-key" "${NVIDIA_API_KEY:-}"

# ── Build & Push Server ───────────────────────────────────────────────────
echo "🐳 Building server image..."
docker build -t "${SERVER_IMAGE}" ./server
docker push "${SERVER_IMAGE}"

# ── Deploy Server ─────────────────────────────────────────────────────────
echo "☁️  Deploying API server to Cloud Run..."
SERVER_URL=$(gcloud run deploy nutrisense-api \
  --image="${SERVER_IMAGE}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=100 \
  --set-env-vars="NODE_ENV=production,CLIENT_URL=https://nutrisense-web-${PROJECT_ID}.run.app" \
  --set-secrets="MONGODB_URI=nutrisense-mongo-uri:latest,REDIS_URL=nutrisense-redis-url:latest,JWT_ACCESS_SECRET=nutrisense-jwt-access:latest,JWT_REFRESH_SECRET=nutrisense-jwt-refresh:latest,NVIDIA_API_KEY=nutrisense-nvidia-key:latest" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)" \
  --quiet)

echo "   ✓ Server deployed: ${SERVER_URL}"

# ── Build & Push Client ───────────────────────────────────────────────────
echo "🐳 Building client image..."
docker build \
  --build-arg "VITE_API_URL=${SERVER_URL}/api" \
  -t "${CLIENT_IMAGE}" \
  ./client
docker push "${CLIENT_IMAGE}"

# ── Deploy Client ─────────────────────────────────────────────────────────
echo "☁️  Deploying web client to Cloud Run..."
CLIENT_URL=$(gcloud run deploy nutrisense-web \
  --image="${CLIENT_IMAGE}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=80 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --project="${PROJECT_ID}" \
  --format="value(status.url)" \
  --quiet)

# ── Update server with client URL ─────────────────────────────────────────
gcloud run services update nutrisense-api \
  --region="${REGION}" \
  --update-env-vars="CLIENT_URL=${CLIENT_URL}" \
  --project="${PROJECT_ID}" \
  --quiet

echo ""
echo "✅ Deployment complete!"
echo ""
echo "   🌐 Web App:  ${CLIENT_URL}"
echo "   🔌 API:      ${SERVER_URL}"
echo "   📊 Health:   ${SERVER_URL}/health"
echo ""
echo "Note: MongoDB and Redis must be externally hosted (use MongoDB Atlas + Redis Cloud)"
echo "      Update the nutrisense-mongo-uri and nutrisense-redis-url secrets accordingly."
