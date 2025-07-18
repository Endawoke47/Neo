/**
 * Minimal Security Configuration
 * Zero-error security setup
 */

export const securityConfig = {
  maxFileSize: 10485760, // 10MB
  allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  corsOrigin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
};

export default securityConfig;
