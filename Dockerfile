# Imagen base
FROM node:18-alpine

# Carpeta de trabajo
WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar proyecto
COPY . .

# Construir Next.js
RUN npm run build

# Puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm","start"]