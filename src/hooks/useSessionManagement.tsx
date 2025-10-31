// import { useCallback, useRef } from "react";
// import { useRouter } from "next/navigation";

// import {
//   deleteCurrentSession,
//   isCurrentSessionValid,
// } from "@/components/SessionManager";
// import { useBrowserCloseDetection } from "./useBrowserCloseDetection";

// export const useSessionManagement = () => {
//   const router = useRouter();
//   const isCheckingSession = useRef(false);

//   // Fonction pour vérifier si c'est un rafraîchissement
//   const isPageRefresh = useCallback(() => {
//     const wasRefreshed = sessionStorage.getItem("page_refreshed") === "true";
//     sessionStorage.setItem("page_refreshed", "true");
//     return wasRefreshed;
//   }, []);

//   // Fonction pour vérifier si le navigateur a été fermé
//   const wasBrowserClosed = useCallback(() => {
//     const browserClosed = sessionStorage.getItem("browser_closed") === "true";
//     if (browserClosed) {
//       sessionStorage.removeItem("browser_closed");
//       sessionStorage.removeItem("browser_closing");
//       return true;
//     }
//     return false;
//   }, []);

//   // Fonction de déconnexion silencieuse
//   const handleLogout = useCallback(
//     async (reason: string = "session_expired") => {
//       try {
//         await deleteCurrentSession();
//         localStorage.removeItem("session_token");
//         localStorage.removeItem("user_email");
//         sessionStorage.clear();

//         // Redirection silencieuse vers la racine
//         router.replace(`/?reason=${reason}`);
//       } catch (error) {
//         console.error("Erreur lors de la déconnexion:", error);
//         router.replace("/?reason=security_error");
//       }
//     },
//     [router]
//   );

//   // Détection de fermeture du navigateur
//   useBrowserCloseDetection(async () => {
//     await deleteCurrentSession();
//   });

//   // Vérification de session
//   const checkSessionValidity = useCallback(async () => {
//     if (isCheckingSession.current) return;
//     isCheckingSession.current = true;

//     try {
//       // Vérifier si c'est une fermeture du navigateur
//       if (wasBrowserClosed()) {
//         await handleLogout("browser_closed");
//         return;
//       }

//       // Vérifier la validité de la session actuelle
//       const sessionCheck = await isCurrentSessionValid();

//       if (!sessionCheck.valid) {
//         await handleLogout(sessionCheck.reason || "session_expired");
//         return;
//       }

//       // Si c'est un rafraîchissement, l'activité est gérée par le middleware
//       if (isPageRefresh()) {
//         // Rien à faire de spécial
//       }
//     } catch (error) {
//       console.error("💥 Erreur vérification session:", error);
//       await handleLogout("security_error");
//     } finally {
//       isCheckingSession.current = false;
//     }
//   }, [handleLogout, isPageRefresh, wasBrowserClosed]);

//   return {
//     checkSessionValidity,
//     handleLogout,
//   };
// };
