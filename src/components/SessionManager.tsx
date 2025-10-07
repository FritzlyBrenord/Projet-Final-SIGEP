import {
  SelectData,
  InsertData,
  UpdateData,
  DeleteData,
} from "@/Config/SupabaseData";

export interface ActiveSession {
  id: string;
  email: string;
  session_token: string;
  device_info?: string;
  ip_address?: string;
  login_time: string;
  last_activity: string;
}

// Générer un token unique
export const generateSessionToken = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Obtenir les infos du device
export const getDeviceInfo = (): string => {
  if (typeof window === "undefined") return "Unknown";

  const userAgent = navigator.userAgent;
  let deviceInfo = "Unknown Device";

  if (userAgent.includes("Windows")) deviceInfo = "Windows PC";
  else if (userAgent.includes("Mac")) deviceInfo = "Mac";
  else if (userAgent.includes("Linux")) deviceInfo = "Linux";
  else if (userAgent.includes("Android")) deviceInfo = "Android";
  else if (userAgent.includes("iPhone")) deviceInfo = "iPhone";
  else if (userAgent.includes("iPad")) deviceInfo = "iPad";

  return deviceInfo;
};

// Vérifier si un utilisateur est déjà connecté
export const isUserAlreadyConnected = async (
  email: string
): Promise<boolean> => {
  try {
    const sessions = await SelectData("sessions_actives");

    if (!sessions || sessions.length === 0) {
      return false;
    }

    // Chercher une session pour cet email
    const userSession = sessions.find((s: ActiveSession) => s.email === email);

    if (!userSession) {
      return false;
    }

    // Vérifier si la session n'est pas expirée (> 2 heures)
    const lastActivity = new Date(userSession.last_activity);
    const now = new Date();
    const hoursDiff =
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 2) {
      // Session expirée, la supprimer
      await DeleteData("sessions_actives", userSession.id);
      return false;
    }

    // Session active trouvée
    return true;
  } catch (error) {
    console.error("Erreur lors de la vérification de session:", error);
    return false;
  }
};

// Obtenir la session d'un utilisateur
export const getUserSession = async (
  email: string
): Promise<ActiveSession | null> => {
  try {
    const sessions = await SelectData("sessions_actives");

    if (!sessions) return null;

    const userSession = sessions.find((s: ActiveSession) => s.email === email);
    return userSession || null;
  } catch (error) {
    console.error("Erreur lors de la récupération de session:", error);
    return null;
  }
};

// Créer une nouvelle session
export const createSession = async (email: string): Promise<string | null> => {
  try {
    const sessionToken = generateSessionToken();
    const deviceInfo = getDeviceInfo();

    const sessionData = {
      email,
      session_token: sessionToken,
      device_info: deviceInfo,
      ip_address: "N/A", // Vous pouvez ajouter une API pour obtenir l'IP
      login_time: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    };

    const result = await InsertData("sessions_actives", sessionData);

    if (result === true) {
      // Sauvegarder le token dans localStorage
      localStorage.setItem("session_token", sessionToken);
      return sessionToken;
    }

    return null;
  } catch (error) {
    console.error("Erreur lors de la création de session:", error);
    return null;
  }
};

// Forcer une nouvelle session (supprimer l'ancienne)
export const forceNewSession = async (
  email: string
): Promise<string | null> => {
  try {
    // Supprimer l'ancienne session
    const sessions = await SelectData("sessions_actives");
    const oldSession = sessions?.find((s: ActiveSession) => s.email === email);

    if (oldSession) {
      await DeleteData("sessions_actives", oldSession.id);
    }

    // Créer une nouvelle session
    return await createSession(email);
  } catch (error) {
    console.error("Erreur lors du forçage de session:", error);
    return null;
  }
};

// Mettre à jour l'activité de la session
export const updateSessionActivity = async (
  sessionToken: string
): Promise<boolean> => {
  try {
    const sessions = await SelectData("sessions_actives");
    const session = sessions?.find(
      (s: ActiveSession) => s.session_token === sessionToken
    );

    if (!session) {
      return false;
    }

    const result = await UpdateData("sessions_actives", session.id, {
      last_activity: new Date().toISOString(),
    });

    return result === true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'activité:", error);
    return false;
  }
};

// Vérifier si le token actuel est toujours valide
export const isCurrentSessionValid = async (): Promise<boolean> => {
  try {
    const sessionToken = localStorage.getItem("session_token");

    if (!sessionToken) {
      return false;
    }

    const sessions = await SelectData("sessions_actives");
    const session = sessions?.find(
      (s: ActiveSession) => s.session_token === sessionToken
    );

    return !!session;
  } catch (error) {
    console.error("Erreur lors de la vérification de token:", error);
    return false;
  }
};

// Supprimer la session actuelle
export const deleteCurrentSession = async (): Promise<boolean> => {
  try {
    const sessionToken = localStorage.getItem("session_token");

    if (!sessionToken) {
      return true;
    }

    const sessions = await SelectData("sessions_actives");
    const session = sessions?.find(
      (s: ActiveSession) => s.session_token === sessionToken
    );

    if (session) {
      await DeleteData("sessions_actives", session.id);
    }

    localStorage.removeItem("session_token");
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de session:", error);
    return false;
  }
};

// Nettoyer les sessions expirées (> 2 heures)
export const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    const sessions = await SelectData("sessions_actives");

    if (!sessions) return;

    const now = new Date();

    for (const session of sessions) {
      const lastActivity = new Date(session.last_activity);
      const hoursDiff =
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 2) {
        await DeleteData("sessions_actives", session.id);
        console.log(`Session expirée supprimée pour: ${session.email}`);
      }
    }
  } catch (error) {
    console.error("Erreur lors du nettoyage des sessions:", error);
  }
};
