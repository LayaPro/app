# Stage 1: Build frontend
FROM node:20-alpine AS build
WORKDIR /app

# Copy shared package
COPY ../../packages/shared packages/shared

# Copy frontend source code
COPY . .
WORKDIR /app/admin/admin-app

# Install dependencies and build
RUN npm ci
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/admin/admin-app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
