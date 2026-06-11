# FitQuest backend — production image
FROM node:20-alpine

# Prisma a besoin d'openssl sur alpine
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
COPY .puppeteerrc.cjs ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

# Au démarrage : applique les migrations puis lance l'API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
