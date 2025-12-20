FROM node:24

WORKDIR /app

# Copy shared package
COPY packages/shared ./packages/shared

# Copy api/services files
COPY api/services/package.json api/services/package-lock.json ./api/services/
WORKDIR /app/api/services
RUN npm ci

# Copy source files
COPY api/services ./

# Build
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/server.js"]
