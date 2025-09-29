import CryptoJS from 'crypto-js';

// Récupère la clé secrète depuis les variables d'environnement
const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || '';

// Vérifier que la clé existe
if (!SECRET_KEY) {
  console.warn('⚠️ ATTENTION: NEXT_PUBLIC_ENCRYPTION_KEY non définie !');
}

/**
 * Chiffre un mot de passe avec AES-256
 * @param password - Le mot de passe en clair
 * @returns Le mot de passe chiffré
 */
export const encryptPassword = (password: string): string => {
  try {
    if (!password) {
      throw new Error('Mot de passe vide');
    }

    if (!SECRET_KEY) {
      throw new Error('Clé de chiffrement non configurée');
    }

    const encrypted = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
    console.log('🔒 Mot de passe chiffré');
    return encrypted;
  } catch (error) {
    console.error('❌ Erreur lors du chiffrement:', error);
    throw new Error('Erreur lors du chiffrement du mot de passe');
  }
};

/**
 * Déchiffre un mot de passe
 * @param encryptedPassword - Le mot de passe chiffré
 * @returns Le mot de passe en clair
 */
export const decryptPassword = (encryptedPassword: string): string => {
  try {
    if (!encryptedPassword) {
      throw new Error('Mot de passe chiffré vide');
    }

    if (!SECRET_KEY) {
      throw new Error('Clé de chiffrement non configurée');
    }

    const decrypted = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
    const password = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!password) {
      throw new Error('Déchiffrement invalide - mot de passe vide');
    }
    
    console.log('🔓 Mot de passe déchiffré');
    return password;
  } catch (error) {
    console.error('❌ Erreur lors du déchiffrement:', error);
    throw new Error('Erreur lors du déchiffrement du mot de passe');
  }
};

/**
 * Vérifie si un mot de passe est déjà chiffré
 * @param password - Le mot de passe à vérifier
 * @returns true si chiffré, false sinon
 */
export const isEncrypted = (password: string): boolean => {
  try {
    if (!password || !SECRET_KEY) {
      return false;
    }

    // Tente de déchiffrer pour voir si c'est un mot de passe chiffré valide
    const decrypted = CryptoJS.AES.decrypt(password, SECRET_KEY);
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    return result.length > 0;
  } catch {
    return false;
  }
};