import path from 'path';
import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { sendMail } from '../lib/mailer';

const LOGO_PATH = path.join(__dirname, '../../assets/icon-192.png');

const router = Router();

// POST /api/v1/digest/test — envoie un email de test à l'utilisateur connecté
router.post('/test', requireAuth, async (req: AuthRequest, res) => {
  try {
    await sendMail(
      req.userId!,
      'FitQuest — Test SMTP',
      `<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f1a;padding:32px 0">
        <tr><td align="center">
          <table width="520" cellpadding="0" cellspacing="0" style="background:#141627;border-radius:12px;padding:32px;font-family:sans-serif;color:#e2e8f0">
            <tr><td style="text-align:center;padding-bottom:24px">
              <img src="cid:fitquest-logo" width="56" height="56" alt="FitQuest" style="display:inline-block"/>
              <h1 style="margin:8px 0 0;font-size:22px;letter-spacing:2px;text-transform:uppercase;color:#a78bfa">FitQuest</h1>
            </td></tr>
            <tr><td style="text-align:center">
              <p style="font-size:15px;line-height:1.6;color:#94a3b8">
                Votre configuration SMTP fonctionne correctement.<br>
                Vous recevrez vos résumés de progression à cette adresse.
              </p>
              <p style="font-size:13px;color:#64748b;margin-top:24px">
                Fréquence configurable dans <strong>Paramètres › Compte</strong>.
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>`,
      [{ filename: 'icon.png', path: LOGO_PATH, cid: 'fitquest-logo' }],
    );
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(400).json({ error: message });
  }
});

export default router;
