import { Router } from 'express';
import { prisma } from '../lib/prisma';

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

// Les domaines suivants seront montés dans les sprints suivants :
//   router.use('/auth', authRouter);          // S2
//   router.use('/exercises', exerciseRouter);  // S4
//   router.use('/programs', programRouter);    // S5
//   ...

export default router;
