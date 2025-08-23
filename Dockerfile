# Multi-stage build para otimização
FROM node:18-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Stage de desenvolvimento (opcional)
FROM base AS development
RUN npm ci
COPY . .
RUN npm run build

# Stage de produção
FROM base AS production

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copiar código fonte
COPY --chown=nestjs:nodejs . .

# Build da aplicação
RUN npm run build

# Remover dependências de desenvolvimento
RUN npm prune --production

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Comando de inicialização
CMD ["node", "dist/main.js"]


