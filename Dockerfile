# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy only what's needed to run
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./
COPY public ./public

# EasyPanel injects PORT at runtime; fallback is 3000
EXPOSE 3000

CMD ["node", "server.js"]
