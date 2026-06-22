import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

// Chiffrement symétrique AES-256-GCM des secrets (mots de passe SMTP).
// La clé n'est jamais stockée en base : seul `SMTP_ENC_KEY` (env) la dérive.
// → un dump BDD seul n'expose aucun mot de passe.
//
// Format de stockage : "ivB64:authTagB64:cipherB64" (un seul champ texte).

const ALGO = 'aes-256-gcm';

// Dérive une clé 32 octets quel que soit le format de SMTP_ENC_KEY
// (hex de 64 car. comme openssl rand -hex 32, passphrase libre, etc.).
function getKey(): Buffer | null {
  const raw = process.env.SMTP_ENC_KEY;
  if (!raw) return null;
  return createHash('sha256').update(raw, 'utf8').digest();
}

// True si le chiffrement est disponible (clé présente).
export function isEncryptionAvailable(): boolean {
  return getKey() !== null;
}

// Chiffre une chaîne en clair. Lève si SMTP_ENC_KEY est absent.
export function encrypt(plain: string): string {
  const key = getKey();
  if (!key) throw new Error('SMTP_ENC_KEY absent — chiffrement indisponible');
  const iv = randomBytes(12); // 96 bits, recommandé pour GCM
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

// Déchiffre une chaîne produite par encrypt(). Lève si clé absente ou données invalides.
export function decrypt(stored: string): string {
  const key = getKey();
  if (!key) throw new Error('SMTP_ENC_KEY absent — déchiffrement indisponible');
  const [ivB64, tagB64, dataB64] = stored.split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Format chiffré invalide');
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
