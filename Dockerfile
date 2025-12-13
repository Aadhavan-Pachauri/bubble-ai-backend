# Multi-stage Dockerfile for Bubble AI Backend
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build || true

FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/api ./api
COPY --from=builder /app/*.js ./
COPY --from=builder /app/*.json ./

# Install curl for health checks
RUN apk add --no-cache curl

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000 9090

# Start application
CMD ["node", "api/index.js"]
