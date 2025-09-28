import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config.js';
import { connectMongo } from './user.mongo.js';
import userRouter from './user.router.js';

const app = express();

// -------- CORS: allow your Vite origins ----------
const allowed = (process.env.CORS_ALLOW_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());

// -------- health first (never blocked) ----------
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// -------- core middleware (MUST be before routes) ----------
app.use(express.json());            // parse JSON bodies
app.use(morgan('dev'));             // log requests

// -------- API routes ----------
app.use('/api/users', userRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler (prevents “connection closed on receive”)
app.use((err, req, res, _next) => {
  console.error('ERROR:', err);
  const code = err.status || 500;
  res.status(code).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 10001;
const HOST = process.env.HOST || '127.0.0.1';

async function start() {
  await connectMongo(process.env.MONGO_URI);
  app.listen(PORT, HOST, () =>
    console.log(`Auth backend listening on http://${HOST}:${PORT}`)
  );
}
start();
