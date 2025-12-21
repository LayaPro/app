FROM node:24

WORKDIR /app

# Copy shared package
COPY packages/shared ./packages/shared

# Build shared package
WORKDIR /app/packages/shared
COPY packages/shared/package.json ./
RUN npm install
COPY packages/shared ./
RUN npm run build

# Copy api/services
WORKDIR /app/api/services
COPY api/services/package.json api/services/package-lock.json ./
RUN npm ci

# Copy source files and build
COPY api/services ./
RUN npm run build

# Expose port and run
EXPOSE 4000
CMD ["node", "dist/server.js"]
