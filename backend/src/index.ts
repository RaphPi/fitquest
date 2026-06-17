import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// API REST versionnée
app.use('/api/v1', apiRouter);

// Gestionnaire d'erreurs Express (attrape les erreurs passées via next(err))
// Doit être APRÈS les routes et AVANT le 404
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[FitQuest API] Error:', err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// 404 JSON
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Express 4 + Node 20 : une rejection non gérée crashe le process par défaut.
// Ce handler log l'erreur et maintient le process en vie.
process.on('unhandledRejection', (reason) => {
  console.error('[FitQuest API] UnhandledRejection:', reason);
});

app.listen(PORT, () => {
  console.log(`🗡️  FitQuest API en écoute sur http://localhost:${PORT}/api/v1`);
});
