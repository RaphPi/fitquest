import { Router } from 'express';
import { prisma } from '../lib/prisma';
import authRouter from './auth';
import exerciseRouter from './exercises';
import programRouter from './programs';
import workoutRouter from './workouts';

// Routeur racine de l'API versionnée : /api/v1/...
const router = Router();

router.get('/health', async (_req, res) => {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }
  res.json({
    status: 'ok',
    service: 'fitquest-api',
    version: 'v1',
    db,
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRouter);
router.use('/exercises', exerciseRouter);
router.use('/programs', programRouter);
router.use('/workouts', workoutRouter);

export default router;
