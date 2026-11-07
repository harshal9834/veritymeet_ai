import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '10000', 10);
const FASTAPI_PORT = 8000;
const isProd = process.env.NODE_ENV === 'production';

let pythonProcess: ChildProcess | null = null;

function startPythonBackend() {
  console.log(`[VerityMeet] Starting Python FastAPI backend on port ${FASTAPI_PORT}...`);
  
  // Use python in venv if present, otherwise system python
  let pythonCmd = 'python3';
  if (process.platform === 'win32') {
    pythonCmd = 'python';
  } else if (process.env.VIRTUAL_ENV) {
    pythonCmd = `${process.env.VIRTUAL_ENV}/bin/python`;
  } else {
    // Check if /opt/venv exists
    try {
      pythonCmd = '/opt/venv/bin/python';
    } catch {
      pythonCmd = 'python3';
    }
  }

  pythonProcess = spawn(pythonCmd, ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', String(FASTAPI_PORT)], {
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      PATH: `/opt/venv/bin:${process.env.PATH || ''}`
    }
  });

  pythonProcess.on('error', (err) => {
    console.error(`[VerityMeet] Failed to start Python backend with ${pythonCmd}:`, err);
    // Fallback to standard python3
    if (pythonCmd !== 'python3' && process.platform !== 'win32') {
      console.log('[VerityMeet] Retrying with python3 from PATH...');
      pythonProcess = spawn('python3', ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', String(FASTAPI_PORT)], {
        stdio: 'inherit',
        cwd: __dirname
      });
    }
  });

  pythonProcess.on('exit', (code, signal) => {
    console.log(`[VerityMeet] Python backend exited with code ${code} / signal ${signal}`);
  });

  const cleanup = () => {
    if (pythonProcess) {
      pythonProcess.kill();
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });
}

async function startServer() {
  startPythonBackend();

  const app = express();

  // Proxy /api requests to FastAPI
  const apiProxy = createProxyMiddleware({
    target: `http://127.0.0.1:${FASTAPI_PORT}`,
    changeOrigin: true,
    ws: true,
    pathRewrite: {
      '^/': '/api/'
    },
    on: {
      error: (err: any, req: any, res: any) => {
        console.error('[VerityMeet Proxy Error]:', err?.message);
        if (res && !res.headersSent && typeof res.writeHead === 'function') {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Backend service initializing or unavailable', details: err?.message }));
        }
      }
    }
  });

  app.use('/api', apiProxy);

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VerityMeet AI] Full-stack application running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[VerityMeet Server Error]:', err);
  process.exit(1);
});
