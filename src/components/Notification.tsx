import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type NotificationType = "success" | "error" | "info";

interface NotificationData {
  id: string;
  message: string;
  type: NotificationType;
}

let notifications: NotificationData[] = [];
let updateFunction: ((notifs: NotificationData[]) => void) | null = null;

// Container Component
function NotificationContainer() {
  const [notifs, setNotifs] = useState<NotificationData[]>([]);

  useEffect(() => {
    updateFunction = setNotifs;
    // Synchroniser avec le tableau global au montage
    setNotifs([...notifications]);

    return () => {
      updateFunction = null;
    };
  }, []);

  const remove = (id: string) => {
    notifications = notifications.filter((n) => n.id !== id);
    if (updateFunction) updateFunction([...notifications]);
  };

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-100",
          border: "border-green-200",
          text: "text-green-800",
          icon: <CheckCircle className="text-green-600" size={20} />,
        };
      case "error":
        return {
          bg: "bg-red-100",
          border: "border-red-200",
          text: "text-red-800",
          icon: <AlertCircle className="text-red-600" size={20} />,
        };
      case "info":
        return {
          bg: "bg-blue-100",
          border: "border-blue-200",
          text: "text-blue-800",
          icon: <Info className="text-blue-600" size={20} />,
        };
    }
  };

  return (
    <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-3">
      {notifs.map((notif) => {
        const styles = getStyles(notif.type);
        return (
          <div
            key={notif.id}
            className={`${styles.bg} ${styles.border} ${styles.text} border rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in`}
          >
            {styles.icon}
            <p className="flex-1 font-medium">{notif.message}</p>
            <button
              onClick={() => remove(notif.id)}
              className="hover:opacity-70"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Initialiser le container UNE SEULE FOIS
let containerInitialized = false;

if (typeof window !== "undefined" && !containerInitialized) {
  containerInitialized = true;

  // Vérifier si le container existe déjà
  let container = document.getElementById("notification-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(<NotificationContainer />);
  }
}

// FONCTION NOTIFY CORRIGÉE
export const notify = (
  type: NotificationType = "info",
  message: string,
  duration: number = 5000 // Augmenté à 5s pour mieux voir
) => {
  console.log("🔔 notify appelé:", type, message);

  const id = `notif-${Date.now()}-${Math.random()}`;
  const notification: NotificationData = { id, type, message };

  // Ajouter à la liste globale
  notifications.push(notification);

  // Limiter à 5 notifications maximum
  if (notifications.length > 5) {
    notifications = notifications.slice(-5);
  }

  console.log("📋 Notifications après ajout:", notifications);

  // Mettre à jour l'interface si le composant est monté
  if (updateFunction) {
    console.log("🔄 Mise à jour de l'interface");
    updateFunction([...notifications]);
  } else {
    console.log("❌ updateFunction pas encore disponible");
    // Fallback: afficher une alerte si le système de notifications n'est pas prêt
    alert(`[${type.toUpperCase()}] ${message}`);
  }

  // Auto-suppression après délai
  if (duration > 0) {
    setTimeout(() => {
      notifications = notifications.filter((n) => n.id !== id);
      if (updateFunction) {
        updateFunction([...notifications]);
      }
    }, duration);
  }
};

// Export pour les tests
export const _testReset = () => {
  notifications = [];
  if (updateFunction) updateFunction([]);
};
