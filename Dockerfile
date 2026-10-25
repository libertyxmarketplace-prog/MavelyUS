FROM node:22-bookworm-slim

# Install system dependencies needed for runtime (ffmpeg, python3, ca-certificates)
# python-is-python3 provides the `python` binary symlink required by yt-dlp-exec
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python-is-python3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Copy package manifests first for optimal caching
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Set environment
ENV NODE_ENV=production

# Expose healthcheck port for Railway
EXPOSE 8080

# Start the bot
CMD ["node", "run.js"]
