FROM node:20-bookworm-slim
WORKDIR /app

# Install python and essential packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install npm dependencies (including dev dependencies for build)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Setup Python virtualenv and install python requirements
COPY backend/requirements.txt ./backend/
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r backend/requirements.txt

# Copy all source code
COPY . .

# Build frontend production bundle
RUN npm run build

# Make sure virtual environment python is in path
ENV PATH="/opt/venv/bin:$PATH"
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

# Execute server using local node binary and tsx
CMD ["node", "./node_modules/tsx/dist/cli.mjs", "server.ts"]
