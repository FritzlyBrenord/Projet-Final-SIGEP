// import {
//   SelectData,
//   InsertData,
//   UpdateData,
//   DeleteData,
// } from "@/Config/SupabaseData";

// export interface ActiveSession {
//   id: string;
//   email: string;
//   session_token: string;
//   device_info?: string;
//   ip_address?: string;
//   user_agent?: string;
//   login_time: string;
//   last_activity: string;
//   is_active: boolean;
//   login_count?: number;
//   logout_time?: string;
// }

// // Générer un token unique sécurisé
// export const generateSessionToken = (): string => {
//   const timestamp = Date.now();
//   const random = Math.random().toString(36).substring(2, 15);
//   const cryptoRandom =
//     typeof crypto !== "undefined"
//       ? crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
//       : Math.random().toString(36).substring(2, 15);

//   return `sess_${timestamp}_${random}_${cryptoRandom}`;
// };

// // Obtenir les infos du device côté client
// export const getClientDeviceInfo = (): string => {
//   if (typeof window === "undefined") return "Server/Unknown";

//   const userAgent = navigator.userAgent;
//   let osInfo = "Unknown OS";
//   let browserInfo = "Unknown Browser";

//   // Détection OS
//   if (userAgent.includes("Windows")) {
//     osInfo = "Windows";
//     if (userAgent.includes("Windows NT 10.0")) osInfo = "Windows 10/11";
//     else if (userAgent.includes("Windows NT 6.3")) osInfo = "Windows 8.1";
//     else if (userAgent.includes("Windows NT 6.2")) osInfo = "Windows 8";
//     else if (userAgent.includes("Windows NT 6.1")) osInfo = "Windows 7";
//   } else if (userAgent.includes("Mac")) {
//     osInfo = "macOS";
//   } else if (userAgent.includes("Linux")) {
//     osInfo = "Linux";
//   } else if (userAgent.includes("Android")) {
//     osInfo = "Android";
//   } else if (userAgent.includes("iPhone")) {
//     osInfo = "iOS";
//   } else if (userAgent.includes("iPad")) {
//     osInfo = "iPadOS";
//   }

//   // Détection navigateur
//   if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
//     browserInfo = "Chrome";
//   } else if (userAgent.includes("Firefox")) {
//     browserInfo = "Firefox";
//   } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
//     browserInfo = "Safari";
//   } else if (userAgent.includes("Edg")) {
//     browserInfo = "Edge";
//   }

//   return `${osInfo} - ${browserInfo}`;
// };

// // Vérifier si un utilisateur a déjà une session active (SÉCURISÉ)
// export const isUserAlreadyConnected = async (
//   email: string
// ): Promise<{
//   connected: boolean;
//   message: string;
//   session?: ActiveSession;
// }> => {
//   try {
//     const sessions = await SelectData("sessions_actives");

//     if (!sessions || sessions.length === 0) {
//       return {
//         connected: false,
//         message: "Aucune session active trouvée",
//       };
//     }

//     // Chercher les sessions actives pour cet email
//     const userSessions = sessions.filter(
//       (s: ActiveSession) =>
//         s.email === email.toLowerCase() && s.is_active === true
//     );

//     if (userSessions.length === 0) {
//       return {
//         connected: false,
//         message: "Aucune session active pour cet utilisateur",
//       };
//     }

//     const now = new Date();

//     for (const session of userSessions) {
//       const lastActivity = new Date(session.last_activity);
//       const hoursDiff =
//         (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

//       // Session expirée (> 2 heures) - la supprimer automatiquement
//       if (hoursDiff > 2) {
//         console.log(`🗑️ Session expirée supprimée pour: ${email}`);
//         await DeleteData("sessions_actives", session.id);
//         continue;
//       }

//       // Session active trouvée - REFUSER la connexion
//       return {
//         connected: true,
//         message: `🔒 Compte déjà connecté. Une session active existe depuis ${session.device_info}. Veuillez attendre que la session expire ou contactez l'administrateur.`,
//         session,
//       };
//     }

//     return {
//       connected: false,
//       message: "Aucune session active valide",
//     };
//   } catch (error) {
//     console.error("Erreur lors de la vérification de session:", error);
//     return {
//       connected: false,
//       message: "Erreur de vérification de session",
//     };
//   }
// };

// // Obtenir la session d'un utilisateur
// export const getUserSession = async (
//   email: string
// ): Promise<ActiveSession | null> => {
//   try {
//     const sessions = await SelectData("sessions_actives");

//     if (!sessions) return null;

//     const userSession = sessions.find(
//       (s: ActiveSession) =>
//         s.email === email.toLowerCase() && s.is_active === true
//     );
//     return userSession || null;
//   } catch (error) {
//     console.error("Erreur lors de la récupération de session:", error);
//     return null;
//   }
// };

// // Obtenir la session par token
// export const getSessionByToken = async (
//   sessionToken: string
// ): Promise<ActiveSession | null> => {
//   try {
//     const sessions = await SelectData("sessions_actives");

//     if (!sessions) return null;

//     const session = sessions.find(
//       (s: ActiveSession) =>
//         s.session_token === sessionToken && s.is_active === true
//     );
//     return session || null;
//   } catch (error) {
//     console.error("Erreur récupération session par token:", error);
//     return null;
//   }
// };

// // Obtenir la session actuelle
// export const getCurrentUserSession =
//   async (): Promise<ActiveSession | null> => {
//     try {
//       if (typeof window === "undefined") return null;

//       const sessionToken = localStorage.getItem("session_token");
//       const userEmail = localStorage.getItem("user_email");

//       if (!sessionToken || !userEmail) {
//         return null;
//       }

//       const sessions = await SelectData("sessions_actives");
//       const session = sessions?.find(
//         (s: ActiveSession) =>
//           s.session_token === sessionToken &&
//           s.email === userEmail &&
//           s.is_active === true
//       );

//       return session || null;
//     } catch (error) {
//       console.error("Erreur récupération session actuelle:", error);
//       return null;
//     }
//   };

// // Créer une nouvelle session avec sécurité
// export const createSecureSession = async (
//   email: string
// ): Promise<{
//   success: boolean;
//   sessionToken?: string;
//   message: string;
// }> => {
//   try {
//     if (typeof window === "undefined") {
//       return {
//         success: false,
//         message: "Session doit être créée côté client",
//       };
//     }

//     // ✅ VÉRIFICATION DE SÉCURITÉ : Refuser si déjà connecté
//     const sessionCheck = await isUserAlreadyConnected(email);
//     if (sessionCheck.connected) {
//       return {
//         success: false,
//         message: sessionCheck.message,
//       };
//     }

//     const baseUrl = window.location.origin;
//     const sessionToken = generateSessionToken();
//     const deviceInfo = getClientDeviceInfo();

//     const sessionData = {
//       email: email.toLowerCase(),
//       session_token: sessionToken,
//       device_info: deviceInfo,
//       login_time: new Date().toISOString(),
//       last_activity: new Date().toISOString(),
//     };

//     const res = await fetch(`${baseUrl}/api/sessions/create`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(sessionData),
//     });

//     if (!res.ok) {
//       if (res.status === 409) {
//         const errorData = await res.json();
//         return {
//           success: false,
//           message:
//             errorData.message ||
//             "❌ Une session active existe déjà sur un autre appareil. Connexion refusée pour des raisons de sécurité.",
//         };
//       }

//       return {
//         success: false,
//         message: `❌ Erreur serveur: ${res.status}`,
//       };
//     }

//     const result = await res.json();

//     if (result.success) {
//       // Stocker le token en localStorage
//       localStorage.setItem("session_token", sessionToken);
//       localStorage.setItem("user_email", email.toLowerCase());
//       sessionStorage.setItem("current_session", sessionToken);

//       return {
//         success: true,
//         sessionToken,
//         message: "✅ Session créée avec succès",
//       };
//     } else {
//       return {
//         success: false,
//         message: result.message || "❌ Échec de la création de session",
//       };
//     }
//   } catch (err) {
//     console.error("💥 Erreur création session sécurisée:", err);
//     return {
//       success: false,
//       message: "❌ Erreur réseau lors de la création de session",
//     };
//   }
// };

// // Mettre à jour l'activité de la session
// export const updateSessionActivity = async (
//   sessionToken: string
// ): Promise<boolean> => {
//   try {
//     const sessions = await SelectData("sessions_actives");
//     const session = sessions?.find(
//       (s: ActiveSession) =>
//         s.session_token === sessionToken && s.is_active === true
//     );

//     if (!session) {
//       return false;
//     }

//     const result = await UpdateData("sessions_actives", session.id, {
//       last_activity: new Date().toISOString(),
//     });

//     return result === true;
//   } catch (error) {
//     console.error("Erreur mise à jour activité session:", error);
//     return false;
//   }
// };

// // Vérifier la validité de la session actuelle
// export const isCurrentSessionValid = async (): Promise<{
//   valid: boolean;
//   session?: ActiveSession;
//   message: string;
// }> => {
//   try {
//     if (typeof window === "undefined") {
//       return {
//         valid: false,
//         message: "Environnement serveur",
//       };
//     }

//     const sessionToken = localStorage.getItem("session_token");
//     const userEmail = localStorage.getItem("user_email");

//     if (!sessionToken || !userEmail) {
//       return {
//         valid: false,
//         message: "Token ou email manquant",
//       };
//     }

//     const sessions = await SelectData("sessions_actives");
//     const session = sessions?.find(
//       (s: ActiveSession) =>
//         s.session_token === sessionToken &&
//         s.email === userEmail &&
//         s.is_active === true
//     );

//     if (!session) {
//       return {
//         valid: false,
//         message: "Session non trouvée ou expirée",
//       };
//     }

//     // Vérifier l'expiration (2 heures)
//     const lastActivity = new Date(session.last_activity);
//     const now = new Date();
//     const hoursDiff =
//       (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

//     if (hoursDiff > 2) {
//       // Session expirée - la supprimer
//       await DeleteData("sessions_actives", session.id);
//       localStorage.removeItem("session_token");
//       localStorage.removeItem("user_email");
//       sessionStorage.removeItem("current_session");

//       return {
//         valid: false,
//         message: "Session expirée",
//       };
//     }

//     return {
//       valid: true,
//       session,
//       message: "Session valide",
//     };
//   } catch (error) {
//     console.error("Erreur vérification validité session:", error);
//     return {
//       valid: false,
//       message: "Erreur de vérification",
//     };
//   }
// };

// // Supprimer la session actuelle
// export const deleteCurrentSession = async (): Promise<{
//   success: boolean;
//   message: string;
// }> => {
//   try {
//     if (typeof window === "undefined") {
//       return {
//         success: false,
//         message: "Environnement serveur",
//       };
//     }

//     const sessionToken = localStorage.getItem("session_token");
//     const userEmail = localStorage.getItem("user_email");

//     if (!sessionToken || !userEmail) {
//       return {
//         success: true,
//         message: "Aucune session à supprimer",
//       };
//     }

//     const baseUrl = window.location.origin;
//     const res = await fetch(
//       `${baseUrl}/api/sessions/delete?email=${encodeURIComponent(
//         userEmail
//       )}&session_token=${encodeURIComponent(sessionToken)}`,
//       {
//         method: "DELETE",
//       }
//     );

//     // Nettoyer le stockage local quoi qu'il arrive
//     localStorage.removeItem("session_token");
//     localStorage.removeItem("user_email");
//     sessionStorage.removeItem("current_session");

//     if (res.ok) {
//       return {
//         success: true,
//         message: "✅ Session supprimée avec succès",
//       };
//     } else {
//       return {
//         success: false,
//         message: "❌ Erreur lors de la suppression de la session",
//       };
//     }
//   } catch (error) {
//     console.error("Erreur suppression session:", error);

//     // Nettoyer quand même le stockage local
//     if (typeof window !== "undefined") {
//       localStorage.removeItem("session_token");
//       localStorage.removeItem("user_email");
//       sessionStorage.removeItem("current_session");
//     }

//     return {
//       success: false,
//       message: "❌ Erreur lors de la suppression",
//     };
//   }
// };

// // Nettoyer les sessions expirées
// export const cleanupExpiredSessions = async (): Promise<{
//   cleaned: number;
//   message: string;
// }> => {
//   try {
//     const sessions = await SelectData("sessions_actives");

//     if (!sessions) {
//       return {
//         cleaned: 0,
//         message: "Aucune session à nettoyer",
//       };
//     }

//     const now = new Date();
//     let cleanedCount = 0;

//     for (const session of sessions) {
//       if (session.is_active) {
//         const lastActivity = new Date(session.last_activity);
//         const hoursDiff =
//           (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

//         if (hoursDiff > 2) {
//           await UpdateData("sessions_actives", session.id, {
//             is_active: false,
//             logout_time: new Date().toISOString(),
//             logout_reason: "timeout",
//           });
//           cleanedCount++;
//         }
//       }
//     }

//     return {
//       cleaned: cleanedCount,
//       message: `✅ ${cleanedCount} session(s) expirée(s) nettoyée(s)`,
//     };
//   } catch (error) {
//     console.error("Erreur nettoyage sessions expirées:", error);
//     return {
//       cleaned: 0,
//       message: "❌ Erreur lors du nettoyage des sessions",
//     };
//   }
// };

// // Vérifier si l'utilisateur est connecté
// export const isUserLoggedIn = async (): Promise<{
//   loggedIn: boolean;
//   message: string;
// }> => {
//   try {
//     const sessionCheck = await isCurrentSessionValid();
//     return {
//       loggedIn: sessionCheck.valid,
//       message: sessionCheck.message,
//     };
//   } catch (error) {
//     return {
//       loggedIn: false,
//       message: "Erreur de vérification",
//     };
//   }
// };
