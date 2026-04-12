# SolvencyProof Backend - Railway Deployment
# This Dockerfile builds the backend API server with Algorand integration

FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy root package files
COPY package.json package-lock.json* ./

# Copy backend package
COPY backend/backend/package.json ./backend/backend/

# Install backend dependencies
WORKDIR /app/backend/backend
RUN npm install --production

# Copy backend source code
COPY backend/backend ./

# Create data directories
RUN mkdir -p ../../data/yellow_sessions ../../data/output ../../data/inclusion_proofs

# Copy data files
COPY backend/data ../../data/

# Copy circuits build artifacts (pre-compiled locally)
COPY backend/circuits/build ../../circuits/build/

# Verify circuit artifacts exist
RUN test -f ../../circuits/build/solvency_final.zkey && \
    test -f ../../circuits/build/solvency_js/solvency.wasm && \
    test -f ../../circuits/build/verification_key.json || \
    echo "WARNING: ZK circuit artifacts not found - proof generation will not work"

# Expose port
EXPOSE 3001

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://0.0.0.0:${PORT}/health || exit 1

# Start the backend API server
CMD ["npm", "start"]
