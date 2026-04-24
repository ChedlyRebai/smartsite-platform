# ---- Stage 1 : Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copier uniquement les fichiers de dépendances pour optimiser le cache Docker
COPY package.json package-lock.json ./
RUN npm ci

# Copier le reste du code source
COPY . .

# Compiler le projet NestJS
RUN npm run build

# ---- Stage 2 : Production ----
FROM node:20-alpine AS production

WORKDIR /app

# Copier uniquement les fichiers de dépendances de production
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copier les artefacts compilés depuis le stage builder
COPY --from=builder /app/dist ./dist

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "dist/src/main"]
