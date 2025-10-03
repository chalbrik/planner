# Stage 1: Budowanie aplikacji Angular
FROM node:20 AS build

WORKDIR /app

# Kopiuj package.json i package-lock.json
COPY package*.json ./

# Instaluj dependencies
RUN npm ci

# Kopiuj kod źródłowy
COPY . .

# Buduj aplikację dla produkcji
RUN npm run build

# Stage 2: Serwowanie z nginx
FROM nginx:alpine

# Kopiuj zbudowaną aplikację z poprzedniego stage
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# konfiguracja nginx dla Angular SPA
RUN echo 'server { \
    listen 8080; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
