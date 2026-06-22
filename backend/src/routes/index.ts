import { Router } from 'express';
import { prisma } from '../lib/prisma';
import adminRouter from './admin';
import authRouter from './auth';
import badgeRouter from './badges';
import bodyRouter from './body';
import digestRouter from './digest';
import exerciseRouter from './exercises';
import exportRouter from './export';
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

router.use('/admin', adminRouter);
router.use('/auth', authRouter);
router.use('/digest', digestRouter);
router.use('/badges', badgeRouter);
router.use('/body', bodyRouter);
router.use('/exercises', exerciseRouter);
router.use('/export', exportRouter);
router.use('/programs', programRouter);
router.use('/workouts', workoutRouter);

export default router;
