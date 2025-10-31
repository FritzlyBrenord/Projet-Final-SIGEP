// src/components/InactivityWarning.tsx
"use client";

import { AlertTriangle, Clock } from "lucide-react";

interface InactivityWarningProps {
  timeRemaining: number;
  onStayConnected: () => void;
  onLogout: () => void;
}

export function InactivityWarning({
  timeRemaining,
  onStayConnected,
  onLogout,
}: InactivityWarningProps) {
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          ⏰ Inactivité détectée
        </h2>

        <p className="text-gray-600 text-center mb-6">
          Vous serez déconnecté automatiquement dans :
        </p>

        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-3">
            <Clock className="w-6 h-6 text-orange-600" />
            <div className="text-4xl font-bold text-orange-600">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-colors"
          >
            Se déconnecter
          </button>
          <button
            onClick={onStayConnected}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
          >
            Rester connecté
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          💡 30 minutes d'inactivité = déconnexion automatique
        </p>
      </div>
    </div>
  );
}
