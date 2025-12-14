# Use official Node.js 24 image
FROM node:24

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose the port your service listens on
EXPOSE 4000

# Start the service
CMD ["node", "src/server.js"]
