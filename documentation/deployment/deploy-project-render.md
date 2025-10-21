# Deploying React (Frontend) & Node (Backend) on Render

This guide explains how to deploy a React (frontend) + Node/Express (backend) app on [Render](https://render.com).

---

## 1. Recommended Repo Layout
```
your-repo/
  client/         # React (Vite or CRA)
    package.json
  server/         # Node/Express API
    package.json
    src/
```

---

## 2. Key Environment Variables
- **Frontend:**  
  `VITE_API_URL=https://<your-backend-on-render>.onrender.com`
- **Backend:**  
  - `PORT=10000` (Render injects this automatically)  
  - Any other secrets (DB connection strings, JWT secret, etc.)

---

## 3. Render Services Setup
You will create **two services**:

### A. Backend → Web Service
- Type: **Web Service**
- Root directory: `server`
- Build command:  
  `npm ci && npm run build` (or just `npm ci` if no build step)
- Start command:  
  `node dist/index.js` (or `npm start`)
- Health check path: `/healthz`

### B. Frontend → Static Site
- Type: **Static Site**
- Root directory: `client`
- Build command (Vite example):  
  `npm ci && npm run build`
- Publish directory: `dist`
- Add SPA rewrite rule:  
  `/*` → `/index.html` (Status: 200)

---

## 4. Example `render.yaml`
```yaml
services:
  - type: web
    name: ulink-backend
    env: node
    rootDir: server
    buildCommand: "npm ci && npm run build"
    startCommand: "node dist/index.js"
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
    healthCheckPath: /healthz

  - type: static
    name: ulink-frontend
    rootDir: client
    buildCommand: "npm ci && npm run build"
    staticPublishPath: "dist"
    routes:
      - type: rewrite
        source: "/*"
        destination: "/index.html"
    envVars:
      - key: VITE_API_URL
        fromService:
          type: web
          name: ulink-backend
          property: url
```

---

## 5. Backend CORS Setup
```js
import cors from "cors";
import express from "express";

const app = express();

const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());

app.get("/healthz", (req, res) => res.sendStatus(200));

app.listen(process.env.PORT || 10000, () => {
  console.log(`API on ${process.env.PORT || 10000}`);
});
```

Backend env var:  
`FRONTEND_URL=https://ulink-frontend.onrender.com`

---

## 6. Frontend API Usage
```ts
// client/src/lib/api.ts
export const API_BASE = import.meta.env.VITE_API_URL;

export async function getPing() {
  const res = await fetch(`${API_BASE}/api/ping`);
  if (!res.ok) throw new Error("API error");
  return res.text();
}
```

---

## 7. Node Version
In both `client/package.json` and `server/package.json`:
```json
{
  "engines": { "node": ">=18 <23" }
}
```

---

## 8. Common Gotchas
- **CORS errors** → check `FRONTEND_URL` env var
- **404 on client-side routes** → add SPA rewrite rule
- **Wrong API base** → ensure `VITE_API_URL` is set before build
- **Free plans** → expect cold starts
- **Uploads** → use S3/R2, not local disk (unless using Persistent Disk)
- **WebSockets** → supported natively

---

## 9. Deployment Steps
1. Push code to GitHub.
2. On Render:  
   - Create **Web Service** (backend, `server/`).  
   - Create **Static Site** (frontend, `client/`).  
3. Set environment variables.  
4. Deploy & test:
   - Backend → `https://ulink-backend.onrender.com/healthz`  
   - Frontend → `https://ulink-frontend.onrender.com`

---

## 10. Optional Improvements
- **Cron jobs:** via Render Cron Job service
- **Rate limiting:** `express-rate-limit`
- **Request logging:** `morgan` or `pino`
- **CDN:** Render Static Sites already use CDN
