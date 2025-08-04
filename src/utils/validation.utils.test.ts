import { validatePassword, validateEmail } from './validation.utils';

describe('Validation Utils', () => {
  describe('validatePassword', () => {
    it('should return true for valid passwords', () => {
      expect(validatePassword('ValidPass123!')).toBe(true);
      expect(validatePassword('StrongP@ss1')).toBe(true);
      expect(validatePassword('Test1234!')).toBe(true);
    });

    it('should return false for invalid passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('NoNumbers!')).toBe(false);
      expect(validatePassword('NoSpecial123')).toBe(false);
      expect(validatePassword('noupppercase123!')).toBe(false);
      expect(validatePassword('NOLOWERCASE123!')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validatePassword('')).toBe(false);
      expect(validatePassword('a'.repeat(100) + 'A1!')).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@email.com')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
      expect(validateEmail('test@domain')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(' test@email.com ')).toBe(false);
      expect(validateEmail('test@email..com')).toBe(false);
    });
  });
});