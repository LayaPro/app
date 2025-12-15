FROM node:24

# Copy full repository so file: dependencies resolve (e.g. ../../packages/shared)
WORKDIR /workspace/api/services
# Copy only the service and the shared package so a trimmed EB bundle works.
# The deployment bundle MUST include `api/services` and `packages/shared`.
COPY api/services/package.json api/services/package-lock.json ./

RUN npm ci

COPY api/services ./

# Build TypeScript
RUN npm run build

# Expose the port your service listens on
EXPOSE 4000

# Start the compiled server
CMD ["node", "dist/server.js"]
