FROM node:20-bookworm-slim
WORKDIR /app

# Install python and essential system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install npm packages
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Setup Python virtualenv and install python requirements
COPY backend/requirements.txt ./backend/
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r backend/requirements.txt

# Copy all project source code
COPY . .

# Build the Vite client bundle and bundle the server to pure JavaScript (dist/server.mjs)
RUN npm run build && \
    npx esbuild server.ts --bundle --platform=node --format=esm --outfile=dist/server.mjs --packages=external

# Environment variables for Render
ENV PATH="/opt/venv/bin:$PATH"
ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

# Execute pre-compiled vanilla Node.js server (zero runtime TypeScript or tsx dependency)
CMD ["node", "dist/server.mjs"]
