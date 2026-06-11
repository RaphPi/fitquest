import 'dotenv/config';
import express from 'express';
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

// 404 JSON
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🗡️  FitQuest API en écoute sur http://localhost:${PORT}/api/v1`);
});
