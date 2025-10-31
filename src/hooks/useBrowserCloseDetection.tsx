import { useEffect } from "react";

export const useBrowserSession = () => {
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 🔥 Supprimer le token auth à la fermeture du navigateur
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.clear();

      // Supprimer les cookies de session
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      // Si la page est chargée depuis le cache (rafraîchissement), garder la session
      if (event.persisted) {
        console.log("🔄 Page rafraîchie - Session maintenue");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);
};
