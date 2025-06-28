import { PasswordUtils } from '../src/utils/password';

describe('PasswordUtils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123';
      const hashedPassword = await PasswordUtils.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(password.length);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'samepassword';
      const hash1 = await PasswordUtils.hashPassword(password);
      const hash2 = await PasswordUtils.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'correctpassword';
      const hashedPassword = await PasswordUtils.hashPassword(password);

      const isValid = await PasswordUtils.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'correctpassword';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await PasswordUtils.hashPassword(password);

      const isValid = await PasswordUtils.verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = await PasswordUtils.hashPassword(password);

      const isValid = await PasswordUtils.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });
  });
});