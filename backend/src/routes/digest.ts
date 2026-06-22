import path from 'path';
import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { sendMail } from '../lib/mailer';
import { getDigestData, type ActiveFrequency } from '../lib/digestData';
import { buildDigestHtml } from '../lib/digestTemplate';

const LOGO_PATH = path.join(__dirname, '../../assets/icon-192.png');
const LOGO_ATTACHMENT = [{ filename: 'icon.png', path: LOGO_PATH, cid: 'fitquest-logo' }];

const router = Router();

// POST /api/v1/digest/test — envoie un email digest réel (WEEKLY) à l'utilisateur connecté
router.post('/test', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await getDigestData(req.userId!, 'WEEKLY');
    const html = buildDigestHtml(data);
    await sendMail(req.userId!, 'FitQuest — Votre résumé hebdomadaire', html, LOGO_ATTACHMENT);
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(400).json({ error: message });
  }
});

// POST /api/v1/digest/send — envoie immédiatement un rapport pour la fréquence choisie
router.post('/send', requireAuth, async (req: AuthRequest, res) => {
  try {
    const rawFreq = req.body?.freq as string | undefined;
    const freq: ActiveFrequency =
      rawFreq === 'DAILY' || rawFreq === 'WEEKLY' || rawFreq === 'MONTHLY'
        ? rawFreq
        : 'WEEKLY';
    const subjects: Record<ActiveFrequency, string> = {
      DAILY:   'FitQuest — Votre rapport quotidien',
      WEEKLY:  'FitQuest — Votre rapport hebdomadaire',
      MONTHLY: 'FitQuest — Votre rapport mensuel',
    };
    const data = await getDigestData(req.userId!, freq);
    const html = buildDigestHtml(data);
    await sendMail(req.userId!, subjects[freq], html, LOGO_ATTACHMENT);
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(400).json({ error: message });
  }
});

// POST /api/v1/digest/preview — renvoie le HTML digest sans envoyer d'email
router.post('/preview', requireAuth, async (req: AuthRequest, res) => {
  try {
    const rawFreq = req.body?.freq as string | undefined;
    const freq: ActiveFrequency =
      rawFreq === 'DAILY' || rawFreq === 'WEEKLY' || rawFreq === 'MONTHLY'
        ? rawFreq
        : 'WEEKLY';
    const data = await getDigestData(req.userId!, freq);
    const html = buildDigestHtml(data);
    res.json({ html });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(400).json({ error: message });
  }
});

export default router;
