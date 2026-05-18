import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Utilitaires de test pour le frontend ─────────────────────────────────────

/**
 * Utilitaires de formatage et validation
 */
export const formatUtils = {
  /**
   * Formate un nombre en devise
   * @param {number} amount - Montant à formater
   * @param {string} currency - Code devise (default: 'TND')
   * @returns {string} Montant formaté
   */
  formatCurrency: (amount, currency = 'TND') => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0.00 TND';
    return `${amount.toFixed(2)} ${currency}`;
  },

  /**
   * Formate une date
   * @param {string|Date} date - Date à formater
   * @returns {string} Date formatée
   */
  formatDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Date invalide';
    return d.toLocaleDateString('fr-FR');
  },

  /**
   * Valide un email
   * @param {string} email - Email à valider
   * @returns {boolean} True si valide
   */
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Valide un numéro de téléphone tunisien
   * @param {string} phone - Numéro à valider
   * @returns {boolean} True si valide
   */
  validateTunisianPhone: (phone) => {
    const cleaned = phone.replace(/\s/g, '');
    // International format: +216XXXXXXXX or 216XXXXXXXX (11 digits total)
    const intlRegex = /^(\+216|216)[2-9]\d{7}$/;
    // Local format: 8 digits starting with 2-9
    const localRegex = /^[2-9]\d{7}$/;
    return intlRegex.test(cleaned) || localRegex.test(cleaned);
  }
};

/**
 * Utilitaires de calcul pour les matériaux
 */
export const calculationUtils = {
  /**
   * Calcule le coût total d'un matériau
   * @param {number} quantity - Quantité
   * @param {number} unitPrice - Prix unitaire
   * @returns {number} Coût total
   */
  calculateTotalCost: (quantity, unitPrice) => {
    if (typeof quantity !== 'number' || typeof unitPrice !== 'number') return 0;
    return quantity * unitPrice;
  },

  /**
   * Calcule le pourcentage de stock restant
   * @param {number} currentStock - Stock actuel
   * @param {number} maxStock - Stock maximum
   * @returns {number} Pourcentage (0-100)
   */
  calculateStockPercentage: (currentStock, maxStock) => {
    if (maxStock === 0) return 0;
    return Math.min(100, Math.max(0, (currentStock / maxStock) * 100));
  },

  /**
   * Détermine le niveau d'alerte stock
   * @param {number} currentStock - Stock actuel
   * @param {number} threshold - Seuil d'alerte
   * @returns {string} Niveau d'alerte
   */
  getStockAlertLevel: (currentStock, threshold) => {
    if (currentStock <= 0) return 'critical';
    if (currentStock <= threshold) return 'warning';
    if (currentStock <= threshold * 2) return 'low';
    return 'normal';
  }
};

/**
 * Utilitaires de gestion d'état
 */
export const stateUtils = {
  /**
   * Crée un état initial pour un formulaire
   * @param {Object} fields - Champs du formulaire
   * @returns {Object} État initial
   */
  createInitialFormState: (fields) => {
    const state = {};
    Object.keys(fields).forEach(key => {
      const val = fields[key].defaultValue;
      state[key] = (val !== undefined && val !== null) ? val : '';
    });
    return state;
  },

  /**
   * Valide un formulaire
   * @param {Object} values - Valeurs du formulaire
   * @param {Object} rules - Règles de validation
   * @returns {Object} Erreurs de validation
   */
  validateForm: (values, rules) => {
    const errors = {};
    Object.keys(rules).forEach(field => {
      const rule = rules[field];
      const value = values[field];

      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[field] = `${field} est requis`;
      } else if (rule.minLength && value.length < rule.minLength) {
        errors[field] = `${field} doit contenir au moins ${rule.minLength} caractères`;
      } else if (rule.maxLength && value.length > rule.maxLength) {
        errors[field] = `${field} ne peut pas dépasser ${rule.maxLength} caractères`;
      } else if (rule.pattern && !rule.pattern.test(value)) {
        errors[field] = rule.message || `${field} n'est pas valide`;
      }
    });
    return errors;
  }
};

// ─── Tests des utilitaires ─────────────────────────────────────────────────────

describe('formatUtils', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatUtils.formatCurrency(123.45)).toBe('123.45 TND');
      expect(formatUtils.formatCurrency(1000)).toBe('1000.00 TND');
    });

    it('should handle zero', () => {
      expect(formatUtils.formatCurrency(0)).toBe('0.00 TND');
    });

    it('should handle invalid inputs', () => {
      expect(formatUtils.formatCurrency(null)).toBe('0.00 TND');
      expect(formatUtils.formatCurrency(undefined)).toBe('0.00 TND');
      expect(formatUtils.formatCurrency('invalid')).toBe('0.00 TND');
    });

    it('should support different currencies', () => {
      expect(formatUtils.formatCurrency(100, 'EUR')).toBe('100.00 EUR');
    });
  });

  describe('formatDate', () => {
    it('should format valid dates', () => {
      const date = new Date('2024-01-15');
      expect(formatUtils.formatDate(date)).toBe('15/01/2024');
    });

    it('should handle invalid dates', () => {
      expect(formatUtils.formatDate('invalid')).toBe('Date invalide');
      expect(formatUtils.formatDate(null)).toBe('');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(formatUtils.validateEmail('test@example.com')).toBe(true);
      expect(formatUtils.validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(formatUtils.validateEmail('invalid-email')).toBe(false);
      expect(formatUtils.validateEmail('test@')).toBe(false);
      expect(formatUtils.validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validateTunisianPhone', () => {
    it('should validate Tunisian phone numbers', () => {
      expect(formatUtils.validateTunisianPhone('21612345678')).toBe(true);
      expect(formatUtils.validateTunisianPhone('+21612345678')).toBe(true);
      expect(formatUtils.validateTunisianPhone('12345678')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(formatUtils.validateTunisianPhone('123')).toBe(false);
      expect(formatUtils.validateTunisianPhone('01234567')).toBe(false);
    });
  });
});

describe('calculationUtils', () => {
  describe('calculateTotalCost', () => {
    it('should calculate total cost correctly', () => {
      expect(calculationUtils.calculateTotalCost(10, 25.5)).toBe(255);
      expect(calculationUtils.calculateTotalCost(0, 100)).toBe(0);
    });

    it('should handle invalid inputs', () => {
      expect(calculationUtils.calculateTotalCost('invalid', 10)).toBe(0);
      expect(calculationUtils.calculateTotalCost(10, null)).toBe(0);
    });
  });

  describe('calculateStockPercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculationUtils.calculateStockPercentage(50, 100)).toBe(50);
      expect(calculationUtils.calculateStockPercentage(75, 100)).toBe(75);
    });

    it('should handle edge cases', () => {
      expect(calculationUtils.calculateStockPercentage(150, 100)).toBe(100);
      expect(calculationUtils.calculateStockPercentage(50, 0)).toBe(0);
    });
  });

  describe('getStockAlertLevel', () => {
    it('should return correct alert levels', () => {
      expect(calculationUtils.getStockAlertLevel(0, 10)).toBe('critical');
      expect(calculationUtils.getStockAlertLevel(5, 10)).toBe('warning');
      expect(calculationUtils.getStockAlertLevel(15, 10)).toBe('low');
      expect(calculationUtils.getStockAlertLevel(25, 10)).toBe('normal');
    });
  });
});

describe('stateUtils', () => {
  describe('createInitialFormState', () => {
    it('should create initial state from field definitions', () => {
      const fields = {
        name: { defaultValue: 'John' },
        email: { defaultValue: '' },
        age: { defaultValue: 0 }
      };
      
      const state = stateUtils.createInitialFormState(fields);
      expect(state).toEqual({
        name: 'John',
        email: '',
        age: 0
      });
    });
  });

  describe('validateForm', () => {
    it('should validate required fields', () => {
      const values = { name: '', email: 'test@example.com' };
      const rules = {
        name: { required: true },
        email: { required: true }
      };
      
      const errors = stateUtils.validateForm(values, rules);
      expect(errors.name).toBe('name est requis');
      expect(errors.email).toBeUndefined();
    });

    it('should validate field lengths', () => {
      const values = { name: 'Jo', description: 'A'.repeat(101) };
      const rules = {
        name: { minLength: 3 },
        description: { maxLength: 100 }
      };
      
      const errors = stateUtils.validateForm(values, rules);
      expect(errors.name).toContain('au moins 3 caractères');
      expect(errors.description).toContain('ne peut pas dépasser 100 caractères');
    });
  });
});