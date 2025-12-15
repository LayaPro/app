FROM node:24

# Copy full repository so file: dependencies resolve (e.g. ../../packages/shared)
WORKDIR /workspace
# Copy only the service and the shared package so a trimmed EB bundle works.
# The deployment bundle MUST include `api/services` and `packages/shared`.
COPY api/services /workspace/api/services
COPY packages/shared /workspace/packages/shared

# Install dependencies for the service from within its folder
WORKDIR /workspace/api/services
# Always use `npm ci` in deployment for reproducible installs.
# Ensure package-lock.json is present; dependencies will be installed from npm registry.
RUN npm ci

# Build TypeScript
RUN npm run build

# Expose the port your service listens on
EXPOSE 4000

# Start the compiled server
CMD ["node", "dist/server.js"]
