# Stage 1: Budowanie aplikacji Angular
FROM node:20 AS build

WORKDIR /app

# Kopiuj package.json i package-lock.json
COPY package*.json ./

# Instaluj dependencies
RUN npm ci

# Kopiuj kod źródłowy
COPY . .

# Usuń lokalne node_modules jeśli zostały skopiowane
RUN rm -rf node_modules && npm ci

# Buduj aplikację dla produkcji
RUN npm run build

# Stage 2: Serwowanie z nginx
FROM nginx:alpine

# Kopiuj zbudowaną aplikację z poprzedniego stage
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
