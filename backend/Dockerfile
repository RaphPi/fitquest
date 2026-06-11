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

# Le conteneur ne fait que lancer l'API ; le schéma (db push / migrate deploy)
# et le seed sont gérés par scripts/install.sh et scripts/update.sh.
CMD ["node", "dist/index.js"]
