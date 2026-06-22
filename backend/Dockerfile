# FitQuest backend — production image
FROM node:20-alpine

# openssl : requis par Prisma sur alpine.
# chromium + polices : requis par Puppeteer (export PDF fiche personnage, S14).
# On utilise le Chromium système (build headless léger d'alpine) plutôt que celui
# téléchargé par Puppeteer — Chromium est une dépendance RUNTIME, un multi-stage ne
# réduirait pas l'image finale ici.
RUN apk add --no-cache \
    openssl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

WORKDIR /app

# Pas de NODE_ENV=production ici : ça ferait sauter les devDependencies
# (@types/*, typescript, ts-node) nécessaires au build ET au seed (ts-node).
# NODE_ENV de prod est fourni au runtime par docker-compose (env_file .env).
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
COPY .puppeteerrc.cjs ./
RUN npm install --include=dev

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

# L'entrypoint applique le schéma Prisma (db push) avant de démarrer l'API.
# Le seed reste géré par install.sh / update.sh (idempotent, données initiales).
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
