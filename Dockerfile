# syntax=docker/dockerfile:1 # check=skip=SecretsUsedInArgOrEnv,UndefinedVar

FROM node:20-bookworm-slim

# Install system dependencies needed for runtime (ffmpeg, python3, ca-certificates)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests first for optimal caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source code
COPY . .

# Start the bot
CMD ["node", "run.js"]
