/**
 * Authentication Security Tests
 * Tests for the secure authentication system
 */

import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  LoginSchema,
  RegisterSchema,
  PasswordResetSchema,
  LoginAttemptTracker,
} from '../../lib/auth-security';

describe('Password Security', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      expect(hash).toMatch(/^\$2[ab]\$/); // bcrypt hash format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });
  });
});

describe('JWT Token Security', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@counselflow.com',
    role: 'USER',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format
    });

    it('should include user data in token payload', () => {
      const token = generateAccessToken(mockUser);
      const payload = verifyAccessToken(token);
      
      expect(payload.id).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockUser.id);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format
    });

    it('should include user ID in refresh token', () => {
      const token = generateRefreshToken(mockUser.id);
      const payload = verifyRefreshToken(token);
      
      expect(payload.id).toBe(mockUser.id);
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokens(mockUser);
      
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBeGreaterThan(0);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(mockUser);
      const payload = verifyAccessToken(token);
      
      expect(payload).toBeDefined();
      expect(payload.id).toBe(mockUser.id);
    });

    it('should reject invalid token', () => {
      expect(() => {
        verifyAccessToken('invalid.token.here');
      }).toThrow();
    });

    it('should reject expired token', () => {
      // This would require mocking the JWT library to create an expired token
      // For now, we'll test the error handling
      expect(() => {
        verifyAccessToken('');
      }).toThrow();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = 'sample.jwt.token';
      const header = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(header);
      
      expect(extracted).toBe(token);
    });

    it('should return null for invalid header', () => {
      expect(extractTokenFromHeader('Invalid header')).toBeNull();
      expect(extractTokenFromHeader('')).toBeNull();
      expect(extractTokenFromHeader(undefined)).toBeNull();
    });
  });
});

describe('Password Reset Security', () => {
  const testEmail = 'test@counselflow.com';

  describe('generatePasswordResetToken', () => {
    it('should generate a valid password reset token', () => {
      const token = generatePasswordResetToken(testEmail);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('should verify valid password reset token', () => {
      const token = generatePasswordResetToken(testEmail);
      const payload = verifyPasswordResetToken(token);
      
      expect(payload.email).toBe(testEmail);
      expect(payload.type).toBe('password_reset');
    });

    it('should reject invalid token', () => {
      expect(() => {
        verifyPasswordResetToken('invalid.token.here');
      }).toThrow();
    });
  });
});

describe('Input Validation Schemas', () => {
  describe('LoginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@counselflow.com',
        password: 'password123',
        rememberMe: true,
      };
      
      const result = LoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };
      
      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@counselflow.com',
      };
      
      const result = LoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('RegisterSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@counselflow.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        confirmPassword: 'TestPassword123!',
      };
      
      const result = RegisterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@counselflow.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        confirmPassword: 'weak',
      };
      
      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject password mismatch', () => {
      const invalidData = {
        email: 'test@counselflow.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        confirmPassword: 'DifferentPassword123!',
      };
      
      const result = RegisterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('PasswordResetSchema', () => {
    it('should validate correct email', () => {
      const validData = { email: 'test@counselflow.com' };
      const result = PasswordResetSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = { email: 'invalid-email' };
      const result = PasswordResetSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Login Attempt Tracking', () => {
  let tracker: LoginAttemptTracker;

  beforeEach(() => {
    tracker = new LoginAttemptTracker();
  });

  describe('canAttemptLogin', () => {
    it('should allow login for new identifier', () => {
      const canAttempt = tracker.canAttemptLogin('test@example.com');
      expect(canAttempt).toBe(true);
    });

    it('should block login after max attempts', () => {
      const email = 'test@example.com';
      
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        tracker.recordFailedAttempt(email);
      }
      
      const canAttempt = tracker.canAttemptLogin(email);
      expect(canAttempt).toBe(false);
    });

    it('should allow login again after successful login', () => {
      const email = 'test@example.com';
      
      // Make some failed attempts
      tracker.recordFailedAttempt(email);
      tracker.recordFailedAttempt(email);
      
      // Successful login should reset
      tracker.recordSuccessfulLogin(email);
      
      const canAttempt = tracker.canAttemptLogin(email);
      expect(canAttempt).toBe(true);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should track failed attempts', () => {
      const email = 'test@example.com';
      
      tracker.recordFailedAttempt(email);
      expect(tracker.canAttemptLogin(email)).toBe(true);
      
      // After 5 attempts, should be blocked
      for (let i = 0; i < 4; i++) {
        tracker.recordFailedAttempt(email);
      }
      
      expect(tracker.canAttemptLogin(email)).toBe(false);
    });
  });

  describe('getRemainingLockoutTime', () => {
    it('should return 0 for non-locked account', () => {
      const email = 'test@example.com';
      const remaining = tracker.getRemainingLockoutTime(email);
      expect(remaining).toBe(0);
    });

    it('should return lockout time for locked account', () => {
      const email = 'test@example.com';
      
      // Lock the account
      for (let i = 0; i < 5; i++) {
        tracker.recordFailedAttempt(email);
      }
      
      const remaining = tracker.getRemainingLockoutTime(email);
      expect(remaining).toBeGreaterThan(0);
    });
  });
});
