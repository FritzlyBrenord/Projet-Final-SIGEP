"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
} from "next/navigation";
import { useContextUtilisateur } from "@/Context/ContextUtilisateur";
import { AlertTriangle, Shield, Loader2 } from "lucide-react";
import Uuid from "@/utils/UUid/Uuid";
import { SUPER_ADMIN_CREDENTIALS } from "@/Config/SuperAdmin/SuperAdmin";
import { useRecentActivities } from "@/Context/RecentActivitiesContext";

// Interface pour les props du composant
interface ProtectedRouteProps {
  children: React.ReactNode;
  showLoader?: boolean;
  requireUuidValidation?: boolean;
}

// Fonction utilitaire pour valider le format UUID
const isValidUuid = (uuid: string): boolean => {
  if (!uuid || typeof uuid !== "string") return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Fonction pour extraire l'UUID du pathname
const extractUuidFromPath = (pathname: string): string | null => {
  const segments = pathname.split("/");
  const dashboardIndex = segments.findIndex((segment) =>
    segment.includes("SIGEP-Tableau-De-Bord")
  );

  if (dashboardIndex !== -1 && segments[dashboardIndex + 1]) {
    const potentialUuid = segments[dashboardIndex + 1];
    return isValidUuid(potentialUuid) ? potentialUuid : null;
  }

  const uuidMatch = pathname.match(
    /\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i
  );
  return uuidMatch ? uuidMatch[1] : null;
};

// Fonction pour vérifier si l'utilisateur est le Super Admin (via session OU localStorage)
const isSuperAdmin = (session: any): boolean => {
  // Vérifier d'abord le localStorage
  if (typeof window !== "undefined") {
    const superAdminSession = localStorage.getItem("superadmin_session");
    if (superAdminSession) {
      try {
        const data = JSON.parse(superAdminSession);
        if (
          data.id === SUPER_ADMIN_CREDENTIALS.id ||
          data.email?.toLowerCase() ===
            SUPER_ADMIN_CREDENTIALS.email.toLowerCase()
        ) {
          return true;
        }
      } catch (e) {
        console.error("Erreur lors de la lecture de superadmin_session:", e);
      }
    }
  }

  // Vérifier ensuite via la session du Context
  if (!session || !session.user) return false;

  const userEmail = session.user.email?.toLowerCase();
  if (userEmail === SUPER_ADMIN_CREDENTIALS.email.toLowerCase()) {
    return true;
  }

  if (session.user.id === SUPER_ADMIN_CREDENTIALS.id) {
    return true;
  }

  return false;
};

// Composant principal ProtectedRoute avec vérification UUID renforcée
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  showLoader = true,
  requireUuidValidation = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { currentSession, loading: contextLoading } = useContextUtilisateur();
  const [uuid] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("uuid") || "";
    }
    return "";
  });
  const [isChecking, setIsChecking] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [waitingForSession, setWaitingForSession] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Nettoyer les timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Vérification de sécurité avec délai de grâce et vérification UUID renforcée
  useEffect(() => {
    const checkAccess = () => {
      setIsChecking(true);
      setSecurityError(null);

      // Si le contexte est encore en cours de chargement
      if (contextLoading) {
        return;
      }

      // ✅ BYPASS COMPLET POUR LE SUPER ADMIN
      if (isSuperAdmin(currentSession)) {
        console.log("🔐 Super Admin détecté - Accès total accordé");
        setAccessGranted(true);
        setIsChecking(false);
        setWaitingForSession(false);

        // Nettoyer les timeouts
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        return;
      }

      // === VÉRIFICATION UUID OBLIGATOIRE (pour les utilisateurs normaux) ===
      if (requireUuidValidation) {
        if (!uuid) {
          setSecurityError("UUID manquant - Accès refusé");
          setTimeout(() => router.replace("/"), 2000);
          return;
        }

        if (!isValidUuid(uuid)) {
          setSecurityError("UUID invalide - Accès refusé");
          setTimeout(() => router.replace("/"), 2000);
          return;
        }

        const urlUuid = extractUuidFromPath(pathname);
        const paramUuid = params?.uuid as string;
        const routeUuid = paramUuid || urlUuid;

        if (routeUuid) {
          if (routeUuid !== uuid) {
            setSecurityError(`UUID non autorisé - Accès refusé`);
            console.warn("UUID Mismatch:", {
              routeUuid,
              localUuid: uuid,
              pathname,
            });
            setTimeout(() => router.replace("/"), 2000);
            return;
          }
        } else {
          setSecurityError("UUID requis dans l'URL - Accès refusé");
          setTimeout(() => router.replace("/"), 2000);
          return;
        }
      }

      // === VÉRIFICATION DE L'AUTHENTIFICATION (pour les utilisateurs normaux) ===
      if (currentSession.isAuthenticated) {
        setAccessGranted(true);
        setIsChecking(false);
        setWaitingForSession(false);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        return;
      }

      if (!currentSession.isAuthenticated && !waitingForSession) {
        setWaitingForSession(true);
        setCountdown(10);

        countdownRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        timeoutRef.current = setTimeout(() => {
          if (
            !currentSession.isAuthenticated &&
            !isSuperAdmin(currentSession)
          ) {
            setSecurityError("Session expirée - Redirection en cours");
            setTimeout(() => router.replace("/"), 1000);
          }
        }, 10000);
      }
    };

    checkAccess();
  }, [
    currentSession,
    contextLoading,
    router,
    pathname,
    params,
    uuid,
    waitingForSession,
    requireUuidValidation,
  ]);

  // Affichage d'erreur de sécurité
  if (securityError) {
    return showLoader ? (
      <SecurityErrorScreen error={securityError} isRedirecting={true} />
    ) : null;
  }

  // Affichage pendant la vérification
  if (contextLoading || isChecking || waitingForSession) {
    // Ne pas afficher le loader si c'est le Super Admin
    if (isSuperAdmin(currentSession)) {
      return <>{children}</>;
    }
    return showLoader ? (
      <LoadingScreen
        waitingForSession={waitingForSession}
        countdown={countdown}
        isContextLoading={contextLoading}
      />
    ) : null;
  }

  // Si l'accès n'est pas accordé
  if (!accessGranted) {
    return (
      <LoadingScreen
        waitingForSession={false}
        countdown={0}
        isContextLoading={false}
      />
    );
  }

  // Afficher le contenu protégé
  return <>{children}</>;
};

// Composant d'écran de chargement
interface LoadingScreenProps {
  waitingForSession: boolean;
  countdown: number;
  isContextLoading: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  waitingForSession,
  countdown,
  isContextLoading,
}) => {
  const getStatusMessage = () => {
    if (isContextLoading) {
      return {
        title: "Vérification de la session",
        subtitle: "Contrôle d'accès en cours...",
      };
    }

    if (waitingForSession) {
      return {
        title: "Vérification de la session",
        subtitle: `Recherche de session active... (${countdown}s)`,
      };
    }

    return {
      title: "Vérification de la session",
      subtitle: "Contrôle d'accès en cours...",
    };
  };

  const { title, subtitle } = getStatusMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-top-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <Shield className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
        <p className="text-gray-400">{subtitle}</p>
        <div className="flex items-center justify-center mt-4 space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm text-gray-500">SIGEP Security</span>
        </div>
      </div>
    </div>
  );
};

// Nouveau composant pour les erreurs de sécurité
interface SecurityErrorScreenProps {
  error: string;
  isRedirecting: boolean;
}

const SecurityErrorScreen: React.FC<SecurityErrorScreenProps> = ({
  error,
  isRedirecting,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-gray-900">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-red-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Accès Refusé</h2>
        <p className="text-red-300 mb-4">{error}</p>
        {isRedirecting && (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
            <span className="text-sm text-red-400">
              Redirection en cours...
            </span>
          </div>
        )}
        <div className="mt-6 text-xs text-gray-500">
          SIGEP Security - Contrôle d'accès
        </div>
      </div>
    </div>
  );
};

// Hook personnalisé amélioré pour utiliser la protection des routes
export const useRouteProtection = () => {
  const { currentSession, loading, Logout } = useContextUtilisateur();
  const { uuid } = Uuid();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { addActivity } = useRecentActivities();
  const hasValidSession = (): boolean => {
    // Super Admin bypass
    if (isSuperAdmin(currentSession)) {
      return true;
    }
    return !loading && currentSession.isAuthenticated;
  };

  const hasValidUuid = (): boolean => {
    // Super Admin bypass
    if (isSuperAdmin(currentSession)) {
      return true;
    }
    const storedUuid = localStorage.getItem("uuid") || "";
    return isValidUuid(storedUuid);
  };

  const isFullyAuthorized = (): boolean => {
    // Super Admin bypass
    if (isSuperAdmin(currentSession)) {
      return true;
    }
    return hasValidSession() && hasValidUuid();
  };

  const redirectToHome = () => {
    router.push("/");
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Supprimer la session Super Admin si elle existe
      if (typeof window !== "undefined") {
        localStorage.removeItem("superadmin_session");
      }

      await Logout();
      router.push("/");
      localStorage.setItem("activeMenu", "Tableau de Bord");

      addActivity({
        action: "deconnexion",
        module: "Authentification",
        title: "Déconnexion réussie",
        details: `L'utilisateur s'est déconnecté avec succès.`,
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    isAuthenticated:
      currentSession.isAuthenticated || isSuperAdmin(currentSession),
    isSuperAdmin: isSuperAdmin(currentSession),
    isLoading: loading,
    hasValidSession,
    hasValidUuid,
    isFullyAuthorized,
    redirectToHome,
    handleLogout,
    isLoggingOut,
  };
};

export default ProtectedRoute;
