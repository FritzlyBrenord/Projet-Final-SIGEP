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

// Initialiser le container
if (typeof window !== "undefined") {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<NotificationContainer />);
}

// LA SEULE FONCTION À UTILISER
export const notify = (
  type: NotificationType = "info",
  message: string,
  duration: number = 3000
) => {
  const id = `notif-${Date.now()}-${Math.random()}`;
  const notification: NotificationData = { id, type, message };

  notifications.push(notification);
  if (notifications.length > 5) {
    notifications = notifications.slice(-5);
  }

  if (updateFunction) {
    updateFunction([...notifications]);
  }

  if (duration > 0) {
    setTimeout(() => {
      notifications = notifications.filter((n) => n.id !== id);
      if (updateFunction) updateFunction([...notifications]);
    }, duration);
  }
};
