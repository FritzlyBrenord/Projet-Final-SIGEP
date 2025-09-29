// @/types/uuidManager.ts
// Système unifié de gestion des UUIDs avec localStorage

// Clés pour localStorage
const STORAGE_KEYS = {
  CURRENT_UUID: 'sigep_current_uuid',
  VALID_UUIDS: 'sigep_valid_uuids',
  LAST_GENERATED: 'sigep_last_generated'
} as const;

/**
 * Génère un UUID v4 valide
 */
export const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Valide le format d'un UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Récupère les UUIDs valides depuis localStorage
 */
const getValidUUIDs = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VALID_UUIDS);
    if (stored) {
      const uuids = JSON.parse(stored);
      return new Set(Array.isArray(uuids) ? uuids : []);
    }
  } catch (error) {
    console.error('Erreur lecture localStorage:', error);
  }
  return new Set();
};

/**
 * Sauvegarde les UUIDs valides dans localStorage
 */
const saveValidUUIDs = (uuids: Set<string>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.VALID_UUIDS, JSON.stringify(Array.from(uuids)));
  } catch (error) {
    console.error('Erreur sauvegarde localStorage:', error);
  }
};

/**
 * Ajoute un UUID à la liste des UUIDs valides
 */
export const addValidUUID = (uuid: string): void => {
  if (!isValidUUID(uuid)) {
    console.warn(`Tentative d'ajout d'un UUID invalide: ${uuid}`);
    return;
  }

  const validUUIDs = getValidUUIDs();
  validUUIDs.add(uuid);
  saveValidUUIDs(validUUIDs);
  
  // Stocker comme UUID courant
  localStorage.setItem(STORAGE_KEYS.CURRENT_UUID, uuid);
  localStorage.setItem(STORAGE_KEYS.LAST_GENERATED, Date.now().toString());
  
  console.log(`UUID ajouté et défini comme courant: ${uuid}`);
};

/**
 * Vérifie si un UUID est autorisé (existe dans localStorage)
 */
export const isUUIDAuthorized = (uuid: string): boolean => {
  if (!isValidUUID(uuid)) {
    return false;
  }
  
  const validUUIDs = getValidUUIDs();
  const isAuthorized = validUUIDs.has(uuid);
  
  if (isAuthorized) {
    console.log(`UUID autorisé: ${uuid}`);
  } else {
    console.warn(`UUID non autorisé: ${uuid}`);
  }
  
  return isAuthorized;
};

/**
 * Récupère l'UUID courant depuis localStorage
 */
export const getCurrentUUID = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_UUID);
  } catch (error) {
    console.error('Erreur lecture UUID courant:', error);
    return null;
  }
};

/**
 * Supprime un UUID spécifique
 */
export const removeValidUUID = (uuid: string): void => {
  const validUUIDs = getValidUUIDs();
  validUUIDs.delete(uuid);
  saveValidUUIDs(validUUIDs);
  
  // Si c'était l'UUID courant, le supprimer aussi
  const currentUUID = getCurrentUUID();
  if (currentUUID === uuid) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_UUID);
  }
  
  console.log(`UUID supprimé: ${uuid}`);
};

/**
 * Nettoie tous les UUIDs et données de session
 */
export const clearAllValidUUIDs = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.VALID_UUIDS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_UUID);
    localStorage.removeItem(STORAGE_KEYS.LAST_GENERATED);
    console.log("Tous les UUIDs ont été supprimés du localStorage");
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
  }
};

/**
 * Génère un nouvel UUID, l'ajoute automatiquement et le retourne
 * Utilisé lors de la connexion réussie
 */
export const generateAndAddUUID = (): string => {
  const uuid = generateUUID();
  addValidUUID(uuid);
  return uuid;
};

/**
 * Vérifie et nettoie l'UUID pour ProtectedRoute
 * Retourne true si l'UUID est valide et le nettoie du localStorage
 */
export const validateAndCleanUUID = (uuid: string): boolean => {
  if (!isUUIDAuthorized(uuid)) {
    return false;
  }
  
  // UUID valide, nettoyer le localStorage pour sécurité
  clearAllValidUUIDs();
  console.log(`UUID validé et localStorage nettoyé pour: ${uuid}`);
  
  return true;
};

/**
 * Vérifie si l'UUID correspond à celui stocké lors de la connexion
 * Sans nettoyer (pour les vérifications intermédiaires)
 */
export const isCurrentSessionUUID = (uuid: string): boolean => {
  const currentUUID = getCurrentUUID();
  return currentUUID === uuid && isValidUUID(uuid);
};

/**
 * Utilitaire pour obtenir des informations de debug
 */
export const getSecurityInfo = () => {
  const validUUIDs = getValidUUIDs();
  const currentUUID = getCurrentUUID();
  const lastGenerated = localStorage.getItem(STORAGE_KEYS.LAST_GENERATED);
  
  return {
    validUUIDCount: validUUIDs.size,
    validUUIDs: Array.from(validUUIDs),
    currentUUID,
    lastGenerated: lastGenerated ? new Date(parseInt(lastGenerated)) : null,
    hasActiveSession: !!currentUUID
  };
};

/**
 * Nettoie les UUIDs expirés (optionnel - si vous voulez une expiration)
 */
export const cleanExpiredUUIDs = (maxAgeMs: number = 24 * 60 * 60 * 1000): void => {
  const lastGenerated = localStorage.getItem(STORAGE_KEYS.LAST_GENERATED);
  
  if (lastGenerated) {
    const age = Date.now() - parseInt(lastGenerated);
    if (age > maxAgeMs) {
      clearAllValidUUIDs();
      console.log('UUIDs expirés nettoyés');
    }
  }
};

// Types pour une meilleure intégration TypeScript
export interface SecurityInfo {
  validUUIDCount: number;
  validUUIDs: string[];
  currentUUID: string | null;
  lastGenerated: Date | null;
  hasActiveSession: boolean;
}

export interface UUIDValidationResult {
  isValid: boolean;
  uuid: string;
  message?: string;
}

/**
 * Validation complète avec résultat détaillé
 */
export const validateUUIDWithDetails = (uuid: string): UUIDValidationResult => {
  if (!uuid) {
    return {
      isValid: false,
      uuid,
      message: 'UUID manquant'
    };
  }
  
  if (!isValidUUID(uuid)) {
    return {
      isValid: false,
      uuid,
      message: 'Format UUID invalide'
    };
  }
  
  if (!isUUIDAuthorized(uuid)) {
    return {
      isValid: false,
      uuid,
      message: 'UUID non autorisé'
    };
  }
  
  return {
    isValid: true,
    uuid,
    message: 'UUID valide'
  };
};

// ===== WORKFLOWS SPÉCIALISÉS =====

/**
 * Workflow complet pour la page de login
 * Gère la génération d'UUID après une connexion réussie
 */
export const loginWorkflow = {
  /**
   * Nettoie localStorage avant tentative de connexion
   */
  clearBeforeLogin: (): void => {
    clearAllValidUUIDs();
    console.log('localStorage nettoyé avant connexion');
  },

  /**
   * Génère un UUID après connexion réussie et retourne l'URL de redirection
   */
  generateAfterSuccessfulLogin: (): { uuid: string; redirectUrl: string } => {
    const uuid = generateAndAddUUID();
    const redirectUrl = `/SIGEP-Tableau-De-Bord/${uuid}`;
    console.log(`Connexion réussie - UUID généré: ${uuid}`);
    return { uuid, redirectUrl };
  },

  /**
   * Vérifie si l'utilisateur a déjà un UUID valide
   */
  checkExistingSession: (): { hasValidSession: boolean; uuid: string | null; redirectUrl: string | null } => {
    const currentUUID = getCurrentUUID();
    
    if (currentUUID && isValidUUID(currentUUID)) {
      return {
        hasValidSession: true,
        uuid: currentUUID,
        redirectUrl: `/SIGEP-Tableau-De-Bord/${currentUUID}`
      };
    }
    
    return {
      hasValidSession: false,
      uuid: null,
      redirectUrl: null
    };
  },

  /**
   * Gère les alertes de sécurité en nettoyant localStorage
   */
  handleSecurityAlert: (reason: string): void => {
    clearAllValidUUIDs();
    console.log(`Alerte de sécurité - localStorage nettoyé. Raison: ${reason}`);
  }
};

/**
 * Workflow complet pour ProtectedRoute
 * Gère la validation et la sécurisation des routes
 */
export const protectedRouteWorkflow = {
  /**
   * Valide l'UUID d'une route et nettoie localStorage si valide
   */
  validateRouteAccess: (uuid: string): { 
    isValid: boolean; 
    shouldRedirect: boolean; 
    redirectReason?: string;
    message?: string;
  } => {
    // Vérifier le format UUID
    if (!isValidUUID(uuid)) {
      return {
        isValid: false,
        shouldRedirect: true,
        redirectReason: 'url_tampered',
        message: 'Format UUID invalide'
      };
    }

    // Vérifier l'autorisation dans localStorage
    if (!isUUIDAuthorized(uuid)) {
      return {
        isValid: false,
        shouldRedirect: true,
        redirectReason: 'uuid_invalid',
        message: 'UUID non autorisé ou expiré'
      };
    }

    // UUID valide - nettoyer localStorage pour sécurité
    clearAllValidUUIDs();
    console.log(`Route autorisée - UUID validé et localStorage nettoyé: ${uuid}`);

    return {
      isValid: true,
      shouldRedirect: false,
      message: 'Accès autorisé'
    };
  },

  /**
   * Gère la redirection vers une route sécurisée
   */
  redirectToSecureRoute: (): { uuid: string; redirectUrl: string } => {
    const uuid = generateAndAddUUID();
    const redirectUrl = `/SIGEP-Tableau-De-Bord/${uuid}`;
    console.log(`Redirection sécurisée - Nouvel UUID: ${uuid}`);
    return { uuid, redirectUrl };
  },

  /**
   * Gère la redirection vers la racine avec raison
   */
  redirectToHomeWithReason: (reason: string): { redirectUrl: string } => {
    clearAllValidUUIDs();
    const redirectUrl = `/?reason=${reason}`;
    console.log(`Redirection vers racine - Raison: ${reason}`);
    return { redirectUrl };
  },

  /**
   * Vérifie si une route nécessite une validation UUID
   */
  shouldValidateRoute: (pathname: string): boolean => {
    return pathname.startsWith('/SIGEP-Tableau-De-Bord/');
  },

  /**
   * Nettoie localStorage lors de la déconnexion
   */
  handleLogout: (): void => {
    clearAllValidUUIDs();
    console.log('Déconnexion - localStorage nettoyé');
  },

  /**
   * Vérifie l'expiration et nettoie si nécessaire
   */
  checkAndCleanExpired: (maxAgeMs: number = 24 * 60 * 60 * 1000): boolean => {
    const lastGenerated = localStorage.getItem(STORAGE_KEYS.LAST_GENERATED);
    
    if (lastGenerated) {
      const age = Date.now() - parseInt(lastGenerated);
      if (age > maxAgeMs) {
        clearAllValidUUIDs();
        console.log('UUIDs expirés nettoyés');
        return true; // Indique que des UUIDs ont été nettoyés
      }
    }
    
    return false; // Aucun nettoyage nécessaire
  }
};