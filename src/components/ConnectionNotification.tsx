import { useState, useEffect } from "react";

// HOOK AMÉLIORÉ pour obtenir le vrai statut de connexion (à exporter)
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Fonction pour tester la vraie connexion
    const checkRealConnection = async () => {
      // D'abord vérifier navigator.onLine
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }

      // Ensuite faire un vrai test réseau
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes max

        const response = await fetch("https://www.google.com/favicon.ico", {
          mode: "no-cors",
          cache: "no-cache",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        setIsOnline(true);
      } catch (error) {
        // Si le fetch échoue, pas de connexion
        setIsOnline(false);
      }
    };

    // Gestionnaires d'événements
    const handleOnline = () => {
      // Quand le navigateur dit qu'on est online, vérifier vraiment
      checkRealConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Écouter les changements
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Vérification périodique toutes les 10 secondes
    const interval = setInterval(checkRealConnection, 10000);

    // Vérification initiale
    checkRealConnection();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  return isOnline;
};

// COMPOSANT DE NOTIFICATION (à exporter)
export const ConnectionNotification = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [message, setMessage] = useState("");
  const [connectionSpeed, setConnectionSpeed] = useState<
    "good" | "slow" | "offline"
  >("good");

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const checkConnection = async () => {
      if (!navigator.onLine) {
        setMessage("Pas de connexion Internet");
        setConnectionSpeed("offline");
        setShowNotification(true);
        setIsOnline(false);
      } else {
        try {
          const startTime = Date.now();

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          await fetch("https://www.google.com/favicon.ico", {
            mode: "no-cors",
            cache: "no-cache",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          const endTime = Date.now();
          const duration = endTime - startTime;

          if (duration > 3000) {
            setMessage("Connexion Internet très lente");
            setConnectionSpeed("slow");
            setShowNotification(true);
            setIsOnline(true);
          } else if (duration > 1000) {
            setMessage("Connexion Internet lente");
            setConnectionSpeed("slow");
            setShowNotification(true);
            setIsOnline(true);
          } else {
            setConnectionSpeed("good");
            setShowNotification(false);
            setIsOnline(true);
          }
        } catch (error) {
          setMessage("Problème de connexion Internet");
          setConnectionSpeed("offline");
          setShowNotification(true);
          setIsOnline(false);
        }
      }
    };

    const handleOffline = () => {
      setMessage("Pas de connexion Internet");
      setConnectionSpeed("offline");
      setShowNotification(true);
      setIsOnline(false);
    };

    const handleOnline = () => {
      setShowNotification(false);
      setIsOnline(true);
      setTimeout(checkConnection, 500);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(checkConnection, 30000);

    checkConnection();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (!showNotification) return null;

  const getStyles = () => {
    switch (connectionSpeed) {
      case "offline":
        return {
          bg: "bg-red-300",
          border: "border-red-400",
          text: "text-red-900",
          icon: "🔴",
          iconBg: "bg-red-400",
        };
      case "slow":
        return {
          bg: "bg-yellow-200",
          border: "border-yellow-300",
          text: "text-yellow-900",
          icon: "⚠️",
          iconBg: "bg-yellow-300",
        };
      default:
        return {
          bg: "bg-blue-200",
          border: "border-blue-300",
          text: "text-blue-900",
          icon: "✓",
          iconBg: "bg-blue-300",
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 animate-slide-down">
      <div
        className={`${styles.bg} ${styles.border} border-2 rounded-xl shadow-lg max-w-md w-full flex items-center justify-between p-4 transition-all duration-300`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`${styles.iconBg} rounded-full w-10 h-10 flex items-center justify-center text-xl`}
          >
            {styles.icon}
          </div>
          <div>
            <p className={`font-bold ${styles.text}`}>{message}</p>
            <p className={`text-sm ${styles.text} opacity-75`}>
              {isOnline
                ? "Certaines fonctionnalités peuvent être ralenties"
                : "Vérifiez votre connexion"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNotification(false)}
          className={`${styles.text} hover:bg-black hover:bg-opacity-10 rounded-full p-2 transition-colors ml-2`}
          aria-label="Fermer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

// EXEMPLE D'UTILISATION
/**
 * Dans votre page Next.js :
 *
 * import { ConnectionNotification, useConnectionStatus } from '@/components/ConnectionNotification';
 *
 * export default function MaPage() {
 *   const isOnline = useConnectionStatus(); // Teste vraiment la connexion
 *
 *   console.log("Connexion:", isOnline); // Pour débugger
 *
 *   return (
 *     <>
 *       <ConnectionNotification />
 *
 *       {isOnline ? (
 *         <p>✅ Vous êtes en ligne</p>
 *       ) : (
 *         <p>❌ Vous êtes hors ligne</p>
 *       )}
 *     </>
 *   );
 * }
 *
 * POUR TESTER :
 * 1. Ouvrir DevTools (F12)
 * 2. Aller dans Network
 * 3. Changer "No throttling" en "Offline"
 * 4. Attendre 10 secondes max
 * 5. isOnline devrait passer à false
 */
