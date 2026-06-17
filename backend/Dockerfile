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

# L'entrypoint applique le schéma Prisma (db push) avant de démarrer l'API.
# Le seed reste géré par install.sh / update.sh (idempotent, données initiales).
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
