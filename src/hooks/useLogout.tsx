// "use client";

// import { useState, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import { deleteCurrentSession } from "@/components/SessionManager";
// import { useContextUtilisateur } from "@/Context/ContextUtilisateur";

// export const useLogout = () => {
//   const [isLoggingOut, setIsLoggingOut] = useState(false);
//   const { Logout } = useContextUtilisateur();
//   const router = useRouter();

//   // 🔹 DÉCONNEXION SIMPLE AVEC CONFIRMATION
//   const handleLogout = useCallback(async () => {
//     if (isLoggingOut) return;

//     // Demander confirmation à l'utilisateur
//     const userConfirmed = window.confirm(
//       "Êtes-vous sûr de vouloir vous déconnecter ?"
//     );

//     // Si l'utilisateur annule, on ne fait rien
//     if (!userConfirmed) {
//       return;
//     }

//     try {
//       setIsLoggingOut(true);

//       // Supprimer la session de la base de données
//       await deleteCurrentSession();

//       // Nettoyer le stockage local
//       localStorage.removeItem("session_token");
//       localStorage.removeItem("user_email");
//       localStorage.removeItem("superadmin_session");

//       // Nettoyer le sessionStorage
//       sessionStorage.clear();

//       // Supprimer les cookies
//       document.cookie =
//         "superadmin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
//       document.cookie =
//         "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

//       // Rediriger vers la page d'accueil
//       router.push("/");
//     } catch (error) {
//       console.error("❌ Erreur lors de la déconnexion:", error);

//       // Forcer le nettoyage même en cas d'erreur
//       localStorage.clear();
//       sessionStorage.clear();
//       router.push("/");
//     } finally {
//       setIsLoggingOut(false);
//     }
//   }, [isLoggingOut, router]);

//   // 🔸 DÉCONNEXION AVEC RAISON ET CONFIRMATION
//   const logoutWithReason = useCallback(
//     async (reason: string = "user_initiated", customMessage?: string) => {
//       if (isLoggingOut) return;

//       // Message de confirmation personnalisable
//       const defaultMessage = "Êtes-vous sûr de vouloir vous déconnecter ?";
//       const confirmationMessage = customMessage || defaultMessage;

//       const userConfirmed = window.confirm(confirmationMessage);

//       if (!userConfirmed) {
//         return;
//       }

//       try {
//         setIsLoggingOut(true);

//         await deleteCurrentSession();
//         localStorage.removeItem("session_token");
//         localStorage.removeItem("user_email");
//         localStorage.removeItem("superadmin_session");
//         await Logout();
//         sessionStorage.clear();

//         document.cookie =
//           "superadmin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
//         document.cookie =
//           "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

//         // Redirection avec raison
//         router.push(`/?reason=${reason}`);
//       } catch (error) {
//         console.error("❌ Erreur lors de la déconnexion:", error);
//         localStorage.clear();
//         sessionStorage.clear();
//         router.push(`/?reason=security_error`);
//       } finally {
//         setIsLoggingOut(false);
//       }
//     },
//     [Logout, isLoggingOut, router]
//   );

//   // 🔴 DÉCONNEXION FORCÉE (pour admins) AVEC CONFIRMATION
//   const forceLogout = useCallback(
//     async (email?: string, userName?: string) => {
//       if (isLoggingOut) return;

//       // Message de confirmation plus fort pour la déconnexion forcée
//       const message = email
//         ? `Êtes-vous sûr de vouloir déconnecter l'utilisateur ${
//             userName || email
//           } ? Cette action est immédiate.`
//         : "Êtes-vous sûr de vouloir forcer la déconnexion ?";

//       const userConfirmed = window.confirm(message);

//       if (!userConfirmed) {
//         return;
//       }

//       try {
//         setIsLoggingOut(true);

//         // Si un email est spécifié, supprimer toutes les sessions de cet utilisateur
//         if (email) {
//           const baseUrl = window.location.origin;
//           await fetch(
//             `${baseUrl}/api/sessions/delete?email=${encodeURIComponent(email)}`,
//             {
//               method: "DELETE",
//             }
//           );
//         }

//         // Déconnexion normale
//         await handleLogout();
//       } catch (error) {
//         console.error("❌ Erreur lors de la déconnexion forcée:", error);
//         await handleLogout();
//       } finally {
//         setIsLoggingOut(false);
//       }
//     },
//     [isLoggingOut, handleLogout]
//   );

//   // 🚨 DÉCONNEXION SANS CONFIRMATION (pour les cas automatiques)
//   const logoutWithoutConfirmation = useCallback(
//     async (reason?: string) => {
//       try {
//         setIsLoggingOut(true);

//         await deleteCurrentSession();
//         localStorage.removeItem("session_token");
//         localStorage.removeItem("user_email");
//         localStorage.removeItem("superadmin_session");
//         sessionStorage.clear();

//         document.cookie =
//           "superadmin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
//         document.cookie =
//           "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

//         const redirectUrl = reason ? `/?reason=${reason}` : "/";
//         router.push(redirectUrl);
//       } catch (error) {
//         console.error("❌ Erreur lors de la déconnexion automatique:", error);
//         localStorage.clear();
//         sessionStorage.clear();
//         router.push("/");
//       } finally {
//         setIsLoggingOut(false);
//       }
//     },
//     [router]
//   );

//   return {
//     // Déconnexions avec confirmation
//     handleLogout, // ✅ Avec confirmation standard
//     logoutWithReason, // ✅ Avec confirmation + raison
//     forceLogout, // ✅ Avec confirmation forte

//     // Déconnexion sans confirmation (pour usage interne)
//     logoutWithoutConfirmation, // 🚨 Sans confirmation

//     // État
//     isLoggingOut,
//   };
// };
