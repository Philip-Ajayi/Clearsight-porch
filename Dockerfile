# Stage 1: Build Fastify Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 2: Build Next.js Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p /app/frontend/public
RUN npm run build

# Stage 3: Production Unified Runtime Container
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache nginx bash curl

# Deploy Backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev
WORKDIR /app

# Deploy Next.js Standalone
COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend/
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# Nginx & Startup Orchestration
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY start.sh ./start.sh
RUN chmod +x start.sh

EXPOSE 8080
CMD ["./start.sh"]