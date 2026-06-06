import * as crypto from 'crypto';

export class EncryptionUtil {
    private static readonly algorithm = 'aes-256-cbc';
    private static readonly secretKey = crypto
        .createHash('sha256')
        .update(String(process.env.ENCRYPTION_SECRET || 'default_secret_key'))
        .digest('base64')
        .substring(0, 32);
    private static readonly ivLength = 16; // For AES, IV is always 16 bytes

    // Encrypt function
    static encrypt(text: string): string {
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return iv.toString('base64') + ':' + encrypted;
    }

    // Decrypt function
    static decrypt(encryptedText: string): string {
        const textParts = encryptedText.split(':');
        if (textParts.length !== 2) {
            throw new Error('Invalid encrypted text format.');
        }
        const iv = Buffer.from(textParts[0], 'base64');
        const encrypted = textParts[1];

        const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
