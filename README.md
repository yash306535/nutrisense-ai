# NutriSense — AI-Powered Food & Health App

A complete, production-quality nutrition tracking application powered by LLaMA3 70B AI via NVIDIA API.

## Features

| Feature | Description |
|---------|-------------|
| 🤖 AI Meal Analyzer | Describe any meal → instant nutrition breakdown |
| 📊 Health Dashboard | Calorie rings, macro charts, 7-day trends |
| 💬 NutriBot Chat | Personalized AI dietitian chatbot |
| 📅 Smart Meal Planner | AI-generated N-day meal plans |
| 📷 Food Scanner | Barcode scanner + OCR label reader |
| ⚠️ Allergy Guard | AI allergen detection with alternatives |
| 🎯 Goal Engine | BMR/TDEE calculation + personalized targets |
| 🍳 Recipe Explorer | AI recipes + Healthify feature |
| 📈 Habit Insights | 30-day AI pattern analysis |
| 🏆 Gamification | XP, levels, badges, streaks, confetti |
| 👥 Social Feed | Share meals, like, follow, group challenges |
| 🔔 Smart Reminders | Cron-based meal reminders + weekly summaries |

## Tech Stack

**Frontend:** React 18 + Vite + Tailwind CSS + Zustand + React Query + Recharts + Framer Motion  
**Backend:** Node.js 20 + Express + MongoDB + Redis + JWT  
**AI:** NVIDIA API (meta/llama3-70b-instruct)  
**DevOps:** Docker Compose + Google Cloud Run

---

## Quick Start (Docker)

```bash
git clone <repo>
cd nutrisense

# Copy and configure environment
cp .env.example .env
# Edit .env with your values

# Start everything
docker-compose up --build

# App available at:
# Frontend: http://localhost:5173
# API:      http://localhost:5000
# Health:   http://localhost:5000/health
```

## Local Development

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Redis (local or Redis Cloud)

### Server Setup

```bash
cd server
npm install

# Copy env
cp ../.env.example .env
# Configure .env

npm run dev
# Server starts on http://localhost:5000
```

### Client Setup

```bash
cd client
npm install
npm run dev
# Client starts on http://localhost:5173
```

---

## Google Cloud Run Deployment

### Prerequisites
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [Docker](https://docs.docker.com/get-docker/)
- GCP project with billing enabled
- MongoDB Atlas cluster (free tier works)
- Redis Cloud instance (free tier works)

### Option 1: Automated Script

```bash
# Set up external databases first:
# 1. Create MongoDB Atlas cluster → get connection URI
# 2. Create Redis Cloud instance → get connection URL

# Deploy everything in one command
chmod +x deploy-cloudrun.sh
./deploy-cloudrun.sh YOUR_GCP_PROJECT_ID us-central1
```

### Option 2: Cloud Build CI/CD

```bash
# Connect your GitHub repo to Cloud Build
gcloud builds triggers create github \
  --repo-name=nutrisense \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml

# Push to main to trigger deployment
git push origin main
```

### Manual Step-by-Step

```bash
PROJECT_ID="your-project-id"
REGION="us-central1"

# 1. Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com

# 2. Create secrets
echo -n "mongodb+srv://..." | gcloud secrets create nutrisense-mongo-uri --data-file=-
echo -n "redis://..." | gcloud secrets create nutrisense-redis-url --data-file=-
echo -n "your-jwt-access-secret" | gcloud secrets create nutrisense-jwt-access --data-file=-
echo -n "your-jwt-refresh-secret" | gcloud secrets create nutrisense-jwt-refresh --data-file=-
echo -n "nvapi-..." | gcloud secrets create nutrisense-nvidia-key --data-file=-

# 3. Build and push server
docker build -t gcr.io/$PROJECT_ID/nutrisense-server ./server
docker push gcr.io/$PROJECT_ID/nutrisense-server

# 4. Deploy API server
gcloud run deploy nutrisense-api \
  --image=gcr.io/$PROJECT_ID/nutrisense-server \
  --region=$REGION \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --set-secrets="MONGODB_URI=nutrisense-mongo-uri:latest,REDIS_URL=nutrisense-redis-url:latest,JWT_ACCESS_SECRET=nutrisense-jwt-access:latest,JWT_REFRESH_SECRET=nutrisense-jwt-refresh:latest,NVIDIA_API_KEY=nutrisense-nvidia-key:latest" \
  --set-env-vars="NODE_ENV=production"

# 5. Get server URL
SERVER_URL=$(gcloud run services describe nutrisense-api --region=$REGION --format="value(status.url)")

# 6. Build client with API URL
docker build --build-arg VITE_API_URL=$SERVER_URL/api -t gcr.io/$PROJECT_ID/nutrisense-client ./client
docker push gcr.io/$PROJECT_ID/nutrisense-client

# 7. Deploy client
gcloud run deploy nutrisense-web \
  --image=gcr.io/$PROJECT_ID/nutrisense-client \
  --region=$REGION \
  --allow-unauthenticated \
  --port=80 \
  --memory=256Mi
```

---

## Architecture

```
                    ┌─────────────────────────────┐
                    │        Google Cloud Run       │
                    │                               │
  Browser ────────► │  nutrisense-web (nginx/React) │
                    │           │                   │
                    │           ▼                   │
                    │  nutrisense-api (Node.js)     │
                    │      │         │              │
                    └──────┼─────────┼──────────────┘
                           │         │
                    ┌──────┘    ┌────┘
                    ▼           ▼
             MongoDB Atlas   Redis Cloud    NVIDIA API
             (Primary DB)    (Cache/JWT)   (LLaMA3 70B)
```

### Cloud Run Features Used
- **Scale to zero** — no cost when idle
- **Automatic HTTPS** — free TLS certificates
- **Secret Manager** — secure env vars
- **Container instances** — stateless, horizontally scalable
- **Health checks** — `/health` endpoint monitored

---

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/meals/today` | Today's logged meals |
| POST | `/api/meals` | Log a meal |
| GET | `/api/meals/progress/weekly` | 7-day progress |
| POST | `/api/ai/analyze-meal` | AI meal analysis |
| POST | `/api/ai/chat` | NutriBot chat |
| POST | `/api/ai/meal-plan` | Generate meal plan |
| POST | `/api/ai/check-allergens` | Allergen check |
| POST | `/api/ai/insights` | 30-day habit insights |
| POST | `/api/goals/setup` | Set up nutrition goal |
| GET | `/api/recipes/search` | Search/generate recipes |
| GET | `/api/social/feed` | Social feed |
| GET | `/api/social/leaderboard` | XP leaderboard |
| GET | `/health` | Health check |

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `JWT_ACCESS_SECRET` | JWT signing secret (min 32 chars) | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) | ✅ |
| `NVIDIA_API_KEY` | NVIDIA API key for LLaMA3 | ✅ |
| `CLIENT_URL` | Frontend URL (for CORS) | ✅ |
| `PORT` | Server port (Cloud Run sets this to 8080) | ❌ |

---

## Image Uploads

Currently uses local filesystem (`/uploads`). To scale horizontally:

1. Add [Google Cloud Storage](https://cloud.google.com/storage) bucket
2. Replace `multer.diskStorage` with `@google-cloud/storage` in `upload.middleware.js`
3. Return GCS public URLs instead of `/uploads/filename`

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong random JWT secrets (`openssl rand -hex 64`)
- [ ] Enable MongoDB Atlas IP whitelist for Cloud Run
- [ ] Set `CLIENT_URL` to actual frontend domain
- [ ] Enable Cloud Run request logging
- [ ] Set up Cloud Monitoring alerts for error rates
- [ ] Configure custom domain via Cloud Run domain mapping
