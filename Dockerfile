# ── Stage 1: install server dependencies ─────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# ── Stage 2: build the CRM dashboard (React + Vite) ─────────────────────────
FROM node:22-alpine AS dashboard-builder

WORKDIR /app/dashboard

# Vite bakes these into the JS bundle at build time (not runtime), so they
# must be passed as build args, not regular container env vars.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

COPY dashboard/package.json dashboard/package-lock.json ./
RUN npm ci

COPY dashboard/ ./
RUN npm run build

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy only what's needed to run
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./
COPY public ./public
COPY --from=dashboard-builder /app/public/dashboard ./public/dashboard

# EasyPanel injects PORT at runtime; fallback is 3000
EXPOSE 3000

CMD ["node", "server.js"]
