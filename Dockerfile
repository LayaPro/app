# Stage 1: Build frontend
FROM node:20-alpine AS build
WORKDIR /app

# Copy shared package
COPY packages/shared packages/shared

# Copy frontend source
COPY admin/admin-app admin/admin-app

# Build frontend
WORKDIR /app/admin/admin-app
RUN npm ci
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy the built frontend
COPY --from=build /app/admin/admin-app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
