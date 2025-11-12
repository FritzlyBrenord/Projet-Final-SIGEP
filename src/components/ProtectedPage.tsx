"use client";

import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { InactivityWarning } from "@/components/InactivityWarning";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Uuid from "@/utils/UUid/Uuid";
import Spinner from "@/utils/Spinner/Spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isUuidValid, setIsUuidValid] = useState<boolean | null>(null);

  // ✅ Hook de gestion de présence avec inactivité de 30 minutes
  const {
    showInactivityWarning,
    timeRemaining,
    extendSession,
    performAutoLogout,
  } = useOnlinePresence({
    inactivityTimeout: 30 * 60 * 1000,
  });

  const {
    uuid,
    isUuidValid: checkUuidValidity,
    isInitialized,
    getCurrentUuid,
  } = Uuid();

  const isLoginPage = pathname === "/" || pathname === "/login";

  // ✅ Vérification UUID pour les routes protégées
  useEffect(() => {
    if (isLoginPage) {
      setIsUuidValid(true);
      return;
    }

    const validateUuid = async () => {
      // Attendre que l'UUID soit initialisé
      let attempts = 0;
      while (!isInitialized && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      // Vérifier si l'UUID local est valide
      const localUuidValid = checkUuidValidity();

      if (!localUuidValid) {
        console.error("🚨 UUID local invalide");
        setIsUuidValid(false);
        router.replace("/?reason=security_error");
        return;
      }

      // Vérifier que l'UUID dans l'URL correspond à l'UUID local
      if (pathname.includes("/SIGEP-Tableau-De-Bord/")) {
        const urlUuid = extractUuidFromPathname(pathname);
        const localUuid = getCurrentUuid();

        console.log("🔍 Vérification UUID:", { urlUuid, localUuid });

        if (!urlUuid || urlUuid !== localUuid) {
          console.error("🚨 UUID URL modifié - sécurité compromise");
          setIsUuidValid(false);
          router.replace("/?reason=security_error");
          return;
        }
      }

      setIsUuidValid(true);
    };

    validateUuid();
  }, [
    pathname,
    isLoginPage,
    isInitialized,
    checkUuidValidity,
    router,
    getCurrentUuid,
  ]);

  // Fonction pour extraire l'UUID du pathname
  const extractUuidFromPathname = (path: string): string | null => {
    const match = path.match(/\/SIGEP-Tableau-De-Bord\/([a-f0-9-]{36})/);
    return match ? match[1] : null;
  };

  // Afficher un spinner pendant la vérification UUID
  if (isUuidValid === false || (isUuidValid === null && !isLoginPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600">Vérification de sécurité...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ✅ Avertissement d'inactivité (popup) */}
      {showInactivityWarning && !isLoginPage && (
        <InactivityWarning
          timeRemaining={timeRemaining}
          onStayConnected={extendSession}
          onLogout={performAutoLogout}
        />
      )}

      {/* Contenu de la page */}
      {children}
    </>
  );
}
