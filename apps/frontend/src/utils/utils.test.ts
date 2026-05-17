import { describe, it, expect } from 'vitest';

// Utility functions to test
export function formatCurrency(amount: number, currency: string = 'TND'): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Tests
describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format number as TND currency', () => {
      const result = formatCurrency(1000);
      expect(result).toContain('1');
      expect(result).toContain('000');
    });

    it('should handle zero amount', () => {
      const result = formatCurrency(0);
      expect(result).toBeDefined();
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-500);
      expect(result).toContain('-');
    });
  });

  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toContain('2024');
      expect(result).toContain('janvier');
    });

    it('should format date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('2024');
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(50, 200)).toBe(25);
      expect(calculatePercentage(75, 100)).toBe(75);
    });

    it('should handle zero total', () => {
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(calculatePercentage(33, 100)).toBe(33);
      expect(calculatePercentage(66, 100)).toBe(66);
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      const result = truncateText(text, 20);
      expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(result).toContain('...');
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe(text);
      expect(result).not.toContain('...');
    });

    it('should handle exact length', () => {
      const text = 'Exactly twenty chars';
      const result = truncateText(text, 20);
      expect(result).toBe(text);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('invalid@domain')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate a string ID', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs of consistent length', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1.length).toBe(id2.length);
    });
  });
});
