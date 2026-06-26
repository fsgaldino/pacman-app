FROM node:20-alpine

WORKDIR /app

# Copia apenas os manifests primeiro (aproveita cache de camadas)
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# Copia o resto do código
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
