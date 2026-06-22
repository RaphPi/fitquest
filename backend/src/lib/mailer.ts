import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import { prisma } from './prisma';
import { decrypt } from './crypto';

/**
 * Envoie un email via les paramètres SMTP de l'utilisateur.
 * Lève une erreur explicite si la config est incomplète.
 */
export async function sendMail(
  userId: string,
  subject: string,
  html: string,
  attachments?: Mail.Attachment[],
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      smtpHost: true,
      smtpPort: true,
      smtpUser: true,
      smtpPass: true,
      smtpSecure: true,
    },
  });

  if (!user) throw new Error('Utilisateur introuvable');
  if (!user.email) throw new Error('Aucune adresse email configurée');
  if (!user.smtpHost) throw new Error('Hôte SMTP manquant — configurez-le dans Paramètres > Compte');
  if (!user.smtpPass) throw new Error('Mot de passe SMTP manquant — configurez-le dans Paramètres > Compte');

  const password = decrypt(user.smtpPass);

  const transporter = nodemailer.createTransport({
    host: user.smtpHost,
    port: user.smtpPort ?? 587,
    secure: user.smtpSecure ?? false,
    auth: {
      user: user.smtpUser ?? undefined,
      pass: password,
    },
  });

  await transporter.sendMail({
    from: user.smtpUser ?? user.email,
    to: user.email,
    subject,
    html,
    attachments,
  });
}
