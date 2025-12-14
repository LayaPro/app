FROM node:24

# Copy full repository so file: dependencies resolve (e.g. ../../packages/shared)
WORKDIR /workspace
COPY . /workspace

# Install dependencies for the service from within its folder
WORKDIR /workspace/api/services
# Always use `npm ci` in deployment for reproducible installs.
# Ensure package-lock.json and any file: package targets (e.g. packages/shared) are present in the image.
RUN npm ci

# Build TypeScript
RUN npm run build

# Expose the port your service listens on
EXPOSE 4000

# Start the compiled server
CMD ["node", "dist/server.js"]
