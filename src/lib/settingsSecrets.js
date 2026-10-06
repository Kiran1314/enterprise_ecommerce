import crypto from 'node:crypto';

function getEncryptionKey() {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('SETTINGS_ENCRYPTION_KEY or SESSION_SECRET must be set in production.');
  }
  return crypto.createHash('sha256').update(secret || 'development-only-settings-secret').digest();
}

export function encryptSetting(value) {
  if (!value) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `enc:v1:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSetting(value) {
  if (!value) return '';
  if (!value.startsWith('enc:v1:')) return value;
  const [, , iv, authTag, encrypted] = value.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]).toString('utf8');
}