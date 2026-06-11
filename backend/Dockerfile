# FitQuest backend — production image
FROM node:20-alpine

# Prisma a besoin d'openssl sur alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Pas de NODE_ENV=production ici : ça ferait sauter les devDependencies
# (@types/*, typescript, ts-node) nécessaires au build ET au seed (ts-node).
# NODE_ENV de prod est fourni au runtime par docker-compose (env_file .env).
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
COPY .puppeteerrc.cjs ./
RUN npm install --include=dev

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

# Au démarrage : applique les migrations (no-op tant qu'aucune n'existe) puis lance l'API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
