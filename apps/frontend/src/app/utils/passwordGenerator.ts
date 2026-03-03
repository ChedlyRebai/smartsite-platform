/**
 * Générateur de mots de passe forts et sécurisés
 * Caractéristiques:
 * - Longueur: 12-16 caractères
 * - Au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
 * - Caractères spéciaux étendus pour plus de sécurité
 */

export class PasswordGenerator {
  private static readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  private static readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly NUMBERS = '0123456789';
  private static readonly SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?~'; // Caractères spéciaux étendus
  
  private static readonly ALL_CHARS = 
    this.LOWERCASE + 
    this.UPPERCASE + 
    this.NUMBERS + 
    this.SPECIAL_CHARS;

  /**
   * Génère un mot de passe fort aléatoire
   * @param length Longueur du mot de passe (défaut: 14)
   * @returns Mot de passe sécurisé
   */
  static generateStrongPassword(length: number = 14): string {
    if (length < 8) length = 12; // Forcer une longueur minimale sécurisée
    
    let password = '';
    
    // S'assurer d'avoir au moins un caractère de chaque type
    password += this.getRandomChar(this.UPPERCASE); // 1 majuscule
    password += this.getRandomChar(this.LOWERCASE); // 1 minuscule
    password += this.getRandomChar(this.NUMBERS);   // 1 chiffre
    password += this.getRandomChar(this.SPECIAL_CHARS); // 1 caractère spécial
    
    // Compléter avec des caractères aléatoires
    for (let i = 4; i < length; i++) {
      password += this.getRandomChar(this.ALL_CHARS);
    }
    
    // Mélanger le mot de passe pour éviter un pattern prévisible
    password = this.shuffleString(password);
    
    return password;
  }

  /**
   * Génère plusieurs suggestions de mots de passe
   * @param count Nombre de suggestions
   * @returns Tableau de mots de passe
   */
  static generateSuggestions(count: number = 5): string[] {
    const suggestions: string[] = [];
    for (let i = 0; i < count; i++) {
      // Longueur variable entre 12 et 16 pour plus de variété
      const length = Math.floor(Math.random() * 5) + 12; // 12-16
      suggestions.push(this.generateStrongPassword(length));
    }
    return suggestions;
  }

  /**
   * Évalue la force d'un mot de passe
   * @param password Mot de passe à évaluer
   * @returns Score de 0-4 et description
   */
  static evaluatePasswordStrength(password: string): { 
    score: number; 
    strength: 'Très faible' | 'Faible' | 'Moyen' | 'Fort' | 'Très fort';
    color: string;
    checks: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      number: boolean;
      special: boolean;
      noSpaces: boolean;
    }
  } {
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~]/.test(password),
      noSpaces: !/\s/.test(password),
    };

    let score = Object.values(checks).filter(Boolean).length;
    
    // Bonus pour longueur > 14
    if (password.length >= 16) score += 0.5;
    
    let strength: 'Très faible' | 'Faible' | 'Moyen' | 'Fort' | 'Très fort';
    let color: string;
    
    if (score >= 6) {
      strength = 'Très fort';
      color = 'bg-green-600';
    } else if (score >= 5) {
      strength = 'Fort';
      color = 'bg-green-500';
    } else if (score >= 4) {
      strength = 'Moyen';
      color = 'bg-yellow-500';
    } else if (score >= 3) {
      strength = 'Faible';
      color = 'bg-orange-500';
    } else {
      strength = 'Très faible';
      color = 'bg-red-500';
    }

    return { score, strength, color, checks };
  }

  private static getRandomChar(charSet: string): string {
    const randomIndex = Math.floor(Math.random() * charSet.length);
    return charSet[randomIndex];
  }

  private static shuffleString(str: string): string {
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join('');
  }

  /**
   * Vérifie si un mot de passe est considéré comme fort
   */
  static isStrongPassword(password: string): boolean {
    const evaluation = this.evaluatePasswordStrength(password);
    return evaluation.score >= 5; // Fort ou Très fort
  }
}