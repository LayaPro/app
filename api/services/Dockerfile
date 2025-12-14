# Use official Node.js 24 image
FROM node:24

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose the port your service listens on
EXPOSE 4000

# Start the compiled server
CMD ["node", "dist/server.js"]
