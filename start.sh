#!/bin/bash
set -e

# Capture Render's dynamic external port (Render injects PORT, default 8080 if local)
RENDER_PORT="${PORT:-8080}"
echo "[ClearSight Porch] Ingress port assigned by host environment: ${RENDER_PORT}"

# Dynamically patch Nginx to listen on Render's assigned port
sed -i "s/listen [0-9]\+;/listen ${RENDER_PORT};/g" /etc/nginx/http.d/default.conf

# Start Fastify Backend on internal port 5001 (isolated from external PORT)
echo "[ClearSight Porch] Launching Fastify Perception Engine on internal port 5001..."
cd /app/backend
PORT=5001 NODE_ENV=production node dist/server.js &

# Start Next.js Frontend Standalone Server on internal port 3000
echo "[ClearSight Porch] Launching Next.js UI on internal port 3000..."
cd /app/frontend
PORT=3000 HOSTNAME="127.0.0.1" node server.js &

# Wait for internal nodes to bind
sleep 3

echo "[ClearSight Porch] Activating Nginx Gateway on port ${RENDER_PORT}..."
exec nginx -g "daemon off;"