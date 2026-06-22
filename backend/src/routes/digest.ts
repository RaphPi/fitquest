import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { sendMail } from '../lib/mailer';

const router = Router();

// POST /api/v1/digest/test — envoie un email de test à l'utilisateur connecté
router.post('/test', requireAuth, async (req: AuthRequest, res) => {
  try {
    await sendMail(
      req.userId!,
      '🗡️ FitQuest — Test SMTP',
      `<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f1a;padding:32px 0">
        <tr><td align="center">
          <table width="520" cellpadding="0" cellspacing="0" style="background:#141627;border-radius:12px;padding:32px;font-family:sans-serif;color:#e2e8f0">
            <tr><td style="text-align:center;padding-bottom:24px">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="56" height="56" role="img" aria-label="FitQuest" style="display:inline-block">
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#a78bfa"/></linearGradient>
                  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset=".5" stop-color="#a78bfa"/><stop offset="1" stop-color="#6366f1"/></linearGradient>
                </defs>
                <path d="M32 4 L56 13 L56 31 C56 47 43 55 32 60 C21 55 8 47 8 31 L8 13 Z" fill="#0d0b1e" stroke="url(#sg)" stroke-width="2.5" stroke-linejoin="round"/>
                <path d="M32 8 L52 16 L52 31 C52 44 41 52 32 57" fill="none" stroke="url(#sg)" stroke-width="0.5" opacity="0.4"/>
                <path d="M32 13 L35.5 38 L32 42 L28.5 38 Z" fill="url(#bg)"/>
                <path d="M32 13 L28.5 38 L32 36 Z" fill="#f1f5f9" opacity="0.6"/>
                <rect x="25" y="37" width="14" height="3.5" rx="1.75" fill="#f59e0b"/>
                <rect x="23.5" y="36.5" width="2" height="4.5" rx="1" fill="#d97706"/>
                <rect x="38.5" y="36.5" width="2" height="4.5" rx="1" fill="#d97706"/>
                <rect x="30" y="40" width="4" height="9" rx="1.5" fill="#92400e"/>
                <rect x="30.5" y="41" width="1.5" height="7" rx=".75" fill="#a16207" opacity="0.6"/>
                <ellipse cx="32" cy="50.5" rx="3.5" ry="2" fill="#f59e0b"/>
                <text x="32" y="51.5" text-anchor="middle" font-family="monospace" font-size="2.5" font-weight="900" fill="#0a0a0f">LVL</text>
              </svg>
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
    );
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(400).json({ error: message });
  }
});

export default router;
