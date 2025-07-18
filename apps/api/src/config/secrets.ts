/**
 * Secrets Management Service
 * Enterprise-grade secret management with rotation and validation
 */

import { z } from 'zod';
import crypto from 'crypto';
import { logger } from './logger';

// Secret validation schema
const secretSchema = z.object({
  value: z.string().min(1),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
  rotationPolicy: z.enum(['manual', 'auto']).default('manual'),
  lastRotated: z.date().optional(),
});

type Secret = z.infer<typeof secretSchema>;

export class SecretsManager {
  private static instance: SecretsManager;
  private secrets: Map<string, Secret> = new Map();
  private encryptionKey: string;

  private constructor() {
    this.encryptionKey = this.generateEncryptionKey();
    this.loadSecrets();
  }

  static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  private generateEncryptionKey(): string {
    return process.env.SECRETS_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipherGCM('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const decipher = crypto.createDecipherGCM('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private loadSecrets(): void {
    try {
      // Load from environment variables with prefix COUNSELFLOW_SECRET_
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('COUNSELFLOW_SECRET_')) {
          const secretName = key.replace('COUNSELFLOW_SECRET_', '').toLowerCase();
          const value = process.env[key]!;
          
          this.setSecret(secretName, value, {
            rotationPolicy: 'manual',
            expiresAt: this.getExpirationDate(secretName)
          });
        }
      });

      logger.info('Secrets loaded successfully', { 
        count: this.secrets.size 
      });
    } catch (error) {
      logger.error('Failed to load secrets', { error });
    }
  }

  private getExpirationDate(secretName: string): Date | undefined {
    // API keys expire in 90 days by default
    if (secretName.includes('api_key')) {
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    }
    // JWT secrets expire in 1 year
    if (secretName.includes('jwt')) {
      return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }
    return undefined;
  }

  setSecret(name: string, value: string, options: Partial<Secret> = {}): void {
    const secret: Secret = {
      value: this.encrypt(value),
      createdAt: new Date(),
      rotationPolicy: options.rotationPolicy || 'manual',
      expiresAt: options.expiresAt,
      lastRotated: options.lastRotated
    };

    this.secrets.set(name, secret);
    
    logger.info('Secret stored', { 
      name, 
      encrypted: true,
      rotationPolicy: secret.rotationPolicy 
    });
  }

  getSecret(name: string): string | null {
    const secret = this.secrets.get(name);
    if (!secret) {
      logger.warn('Secret not found', { name });
      return null;
    }

    // Check expiration
    if (secret.expiresAt && secret.expiresAt < new Date()) {
      logger.warn('Secret expired', { name, expiresAt: secret.expiresAt });
      return null;
    }

    try {
      return this.decrypt(secret.value);
    } catch (error) {
      logger.error('Failed to decrypt secret', { name, error });
      return null;
    }
  }

  rotateSecret(name: string, newValue: string): void {
    const existingSecret = this.secrets.get(name);
    if (!existingSecret) {
      throw new Error(`Secret ${name} not found`);
    }

    this.setSecret(name, newValue, {
      ...existingSecret,
      lastRotated: new Date()
    });

    logger.info('Secret rotated', { name });
  }

  listSecrets(): Array<{ name: string; createdAt: Date; expiresAt?: Date; rotationPolicy: string }> {
    return Array.from(this.secrets.entries()).map(([name, secret]) => ({
      name,
      createdAt: secret.createdAt,
      expiresAt: secret.expiresAt,
      rotationPolicy: secret.rotationPolicy
    }));
  }

  validateSecret(name: string, value: string): boolean {
    const storedValue = this.getSecret(name);
    return storedValue === value;
  }

  checkExpirations(): Array<{ name: string; expiresAt: Date }> {
    const now = new Date();
    const soonExpiring: Array<{ name: string; expiresAt: Date }> = [];

    for (const [name, secret] of this.secrets.entries()) {
      if (secret.expiresAt) {
        const daysUntilExpiration = Math.ceil(
          (secret.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysUntilExpiration <= 7) {
          soonExpiring.push({ name, expiresAt: secret.expiresAt });
        }
      }
    }

    return soonExpiring;
  }
}

// Enhanced file upload validation
export const enhancedFileValidation = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Max 5 files per request
  },
  
  fileFilter: (req: any, file: any, cb: any) => {
    // Allowed file types
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf'
    ];

    const allowedExtensions = /\.(pdf|doc|docx|txt|rtf)$/i;

    // Validate MIME type
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and RTF files are allowed.'));
    }

    // Validate file extension
    if (!allowedExtensions.test(file.originalname)) {
      return cb(new Error('Invalid file extension.'));
    }

    // Additional security checks
    if (file.originalname.includes('..') || file.originalname.includes('/')) {
      return cb(new Error('Invalid filename.'));
    }

    cb(null, true);
  },

  // File content validation
  validateFileContent: async (filePath: string, mimetype: string): Promise<boolean> => {
    try {
      const fs = require('fs').promises;
      const fileBuffer = await fs.readFile(filePath);
      
      // Check file signatures (magic numbers)
      const signatures: Record<string, Buffer[]> = {
        'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
        'application/msword': [Buffer.from([0xD0, 0xCF, 0x11, 0xE0])], // DOC
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
          Buffer.from([0x50, 0x4B, 0x03, 0x04]) // DOCX (ZIP)
        ]
      };

      const expectedSignatures = signatures[mimetype];
      if (expectedSignatures) {
        return expectedSignatures.some(signature => 
          fileBuffer.subarray(0, signature.length).equals(signature)
        );
      }

      return true; // Allow text files without signature check
    } catch (error) {
      logger.error('File content validation failed', { error, filePath });
      return false;
    }
  }
};

// Enhanced input validation
export class InputValidator {
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return { valid: errors.length === 0, errors };
  }

  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .substring(0, 255); // Limit length
  }
}

// Request signing for AI providers
export class RequestSigner {
  private static generateSignature(
    method: string,
    url: string,
    body: string,
    timestamp: string,
    secretKey: string
  ): string {
    const payload = `${method}\n${url}\n${body}\n${timestamp}`;
    return crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');
  }

  static signRequest(
    method: string,
    url: string,
    body: object,
    secretKey: string
  ): { signature: string; timestamp: string; headers: Record<string, string> } {
    const timestamp = Date.now().toString();
    const bodyString = JSON.stringify(body);
    const signature = this.generateSignature(method, url, bodyString, timestamp, secretKey);

    return {
      signature,
      timestamp,
      headers: {
        'X-Signature': signature,
        'X-Timestamp': timestamp,
        'Content-Type': 'application/json'
      }
    };
  }

  static verifySignature(
    method: string,
    url: string,
    body: string,
    signature: string,
    timestamp: string,
    secretKey: string
  ): boolean {
    const expectedSignature = this.generateSignature(method, url, body, timestamp, secretKey);
    
    // Check timestamp (within 5 minutes)
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    if (now - requestTime > maxAge) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

export const secretsManager = SecretsManager.getInstance();