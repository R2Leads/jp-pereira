# Imagem do site JP Pereira para qualquer hospedagem com Docker.
#
# O build do Next.js consulta o banco (localizador de lojas), por isso ele
# roda na inicialização do container, quando o PostgreSQL já está no ar.
# O primeiro start leva ~1-2 minutos; os seguintes reaproveitam o cache.

FROM node:22-bookworm-slim

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npm run build && npm run start:prod"]
