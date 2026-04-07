# ── Stage 1: Dependencies ──────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# ── Stage 2: Production ────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nutrisense -u 1001

# Copy production deps and source
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nutrisense:nodejs . .

# Create uploads directory
RUN mkdir -p uploads logs && chown -R nutrisense:nodejs uploads logs

USER nutrisense

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
