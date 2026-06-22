import path from 'path';
import cron from 'node-cron';
import { prisma } from './prisma';
import { getDigestData, type ActiveFrequency } from './digestData';
import { buildDigestHtml } from './digestTemplate';
import { sendMail } from './mailer';

const LOGO_PATH = path.join(__dirname, '../../assets/icon-192.png');
const LOGO_ATTACHMENT = [{ filename: 'icon.png', path: LOGO_PATH, cid: 'fitquest-logo' }];

const SUBJECTS: Record<ActiveFrequency, string> = {
  DAILY:   'FitQuest — Votre rapport quotidien',
  WEEKLY:  'FitQuest — Votre rapport hebdomadaire',
  MONTHLY: 'FitQuest — Votre rapport mensuel',
};

async function runDigests(): Promise<void> {
  const now = new Date();
  const dayOfWeek  = now.getDay();   // 0 = dim, 1 = lun
  const dayOfMonth = now.getDate();  // 1–31

  const users = await prisma.user.findMany({
    where: {
      emailDigest: { in: ['DAILY', 'WEEKLY', 'MONTHLY'] },
      email:    { not: null },
      smtpHost: { not: null },
      smtpPass: { not: null },
    },
    select: { id: true, emailDigest: true },
  });

  for (const user of users) {
    const freq = user.emailDigest as ActiveFrequency;

    if (freq === 'WEEKLY'  && dayOfWeek  !== 1) continue;
    if (freq === 'MONTHLY' && dayOfMonth !== 1) continue;

    try {
      const data = await getDigestData(user.id, freq);
      const html = buildDigestHtml(data);
      await sendMail(user.id, SUBJECTS[freq], html, LOGO_ATTACHMENT);
    } catch (err) {
      console.error(
        `[Scheduler] Erreur digest user ${user.id}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

export function startScheduler(): void {
  const hour = Number(process.env.DIGEST_CRON_HOUR ?? 7);
  const schedule = `0 ${hour} * * *`;

  cron.schedule(schedule, () => {
    runDigests().catch((err) => {
      console.error('[Scheduler] Erreur inattendue:', err);
    });
  });

  console.log(`[Scheduler] Digest planifié — ${schedule} UTC`);
}
