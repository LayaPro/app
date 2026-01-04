# Step 1: Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files and install deps
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the frontend code
COPY . .

# Build with Vite, TS compilation included
RUN npm run build

# Step 2: Serve stage
FROM nginx:stable-alpine

# Copy built frontend from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
