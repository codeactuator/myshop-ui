# Stage 1: Dependency resolution and static bundling
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps && npm install ajv@^8 ajv-keywords --legacy-peer-deps
COPY . .

# FIXED: Explicitly sets max memory allocation flags to prevent SIGKILL failures
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# Stage 2: Production grade Nginx with dynamic proxy binding
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Create a custom Nginx config to handle React Router (SPA) 404s
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["sh", "-c", "sed -i 's/listen 80;/listen '\"$PORT\"';/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
