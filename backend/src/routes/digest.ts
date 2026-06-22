import path from 'path';
import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { sendMail } from '../lib/mailer';
import { buildEmailHtml } from '../lib/emailTemplate';

const LOGO_PATH = path.join(__dirname, '../../assets/icon-192.png');

const router = Router();

// POST /api/v1/digest/test — envoie un email de test à l'utilisateur connecté
router.post('/test', requireAuth, async (req: AuthRequest, res) => {
  try {
    await sendMail(
      req.userId!,
      'FitQuest — Test SMTP',
      buildEmailHtml(`
        <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#94a3b8;text-align:center">
          Votre configuration SMTP fonctionne correctement.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#94a3b8;text-align:center">
          Vous recevrez vos r&eacute;sum&eacute;s de progression &agrave; cette adresse.
        </p>
      `),
      [{ filename: 'icon.png', path: LOGO_PATH, cid: 'fitquest-logo' }],
    );
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(400).json({ error: message });
  }
});

export default router;
