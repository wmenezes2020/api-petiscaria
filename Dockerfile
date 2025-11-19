# ------------------------------------------------------------
# Base image with system dependencies
# ------------------------------------------------------------
ARG NODE_VERSION=20.11.1
FROM node:${NODE_VERSION}-alpine AS base

ENV NODE_ENV=development

RUN apk add --no-cache python3 make g++
WORKDIR /app

# ------------------------------------------------------------
# Dependencies layer (installs all deps including dev)
# ------------------------------------------------------------
FROM base AS deps
COPY package*.json ./
RUN npm ci --include=dev

# ------------------------------------------------------------
# Builder layer (compiles the NestJS app)
# ------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ------------------------------------------------------------
# Production runner (only runtime deps + compiled dist)
# ------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache tini \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nestjs -G nodejs

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/healthcheck.js ./healthcheck.js

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
