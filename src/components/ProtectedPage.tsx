"use client";

import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { InactivityWarning } from "@/components/InactivityWarning";
import { usePathname } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const pathname = usePathname();

  // ✅ Hook de gestion de présence avec inactivité de 30 minutes
  const {
    showInactivityWarning,
    timeRemaining,
    extendSession,
    performAutoLogout,
  } = useOnlinePresence({
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
  });

  const isLoginPage = pathname === "/" || pathname === "/login";

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
