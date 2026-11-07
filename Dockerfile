FROM node:20-slim AS frontend-builder
WORKDIR /app

# Install python and build essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package definition and install npm dependencies
COPY package*.json ./
RUN npm ci

# Copy requirements and setup python virtual environment
COPY backend/requirements.txt ./backend/
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r backend/requirements.txt

# Copy source code
COPY . .

# Build the Vite frontend application
RUN npm run build

# Make sure virtualenv is first in PATH
ENV PATH="/opt/venv/bin:$PATH"
ENV NODE_ENV=production
ENV PORT=10000

# Render exposes PORT dynamically (defaults to 10000)
EXPOSE 10000

# Start script running full-stack app (FastAPI + Node Express proxy)
CMD ["npx", "tsx", "server.ts"]
