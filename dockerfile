# Etapa 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar resto del proyecto
COPY . .

# Build de Next.js con Turbopack
RUN npm run build

# Etapa 2: Imagen de producción
FROM node:18-alpine
WORKDIR /app

# Copiar solo lo necesario
COPY --from=builder /app ./

# Variables obligatorias para Cloud Run
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Exponer puerto
EXPOSE 8080

# Iniciar servidor Next.js
CMD ["npm", "start"]

