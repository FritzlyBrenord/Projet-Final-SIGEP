// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [cookieExists, setCookieExists] = useState(false);
  const [cookieValue, setCookieValue] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  // Vérifier le cookie au chargement
  useEffect(() => {
    checkCookie();

    // Compter les refreshs
    const count = Number(sessionStorage.getItem("refreshCount") || 0) + 1;
    setRefreshCount(count);
    sessionStorage.setItem("refreshCount", count.toString());
  }, []);

  // Vérifier si le cookie existe
  const checkCookie = () => {
    const cookies = document.cookie.split(";");
    const testCookie = cookies.find((c) =>
      c.trim().startsWith("test_session=")
    );

    if (testCookie) {
      const value = testCookie.split("=")[1];
      setCookieExists(true);
      setCookieValue(value);
    } else {
      setCookieExists(false);
      setCookieValue("");
    }
  };

  // Créer un cookie de SESSION
  const createCookie = () => {
    const value = `session_${Date.now()}`;
    // ✅ Cookie de SESSION (pas de max-age ni expires)
    document.cookie = `test_session=${value}; path=/; samesite=strict; secure`;
    checkCookie();
    console.log("✅ Cookie de session créé:", value);
  };

  // Supprimer le cookie
  const deleteCookie = () => {
    document.cookie = "test_session=; path=/; max-age=0";
    checkCookie();
    console.log("🗑️ Cookie supprimé");
  };

  // Refresh la page
  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Titre */}
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🍪 Test Cookie de Session
          </h1>
          <p className="text-gray-600 mb-8">
            Testez le comportement d'un cookie de session
          </p>

          {/* Compteur de refresh */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Nombre de refresh</p>
                <p className="text-4xl font-bold text-blue-600">
                  {refreshCount}
                </p>
              </div>
              <div className="text-6xl">🔄</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              (Compteur stocké en sessionStorage)
            </p>
          </div>

          {/* Statut du cookie */}
          <div
            className={`border-2 rounded-xl p-6 mb-6 transition-all ${
              cookieExists
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="text-3xl">{cookieExists ? "✅" : "❌"}</span>
              Statut du Cookie
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                <span className="font-medium text-gray-700">État :</span>
                <span
                  className={`font-bold ${
                    cookieExists ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {cookieExists ? "ACTIF" : "ABSENT"}
                </span>
              </div>

              {cookieExists && (
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Valeur :</p>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                    {cookieValue}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            <button
              onClick={createCookie}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
            >
              <span className="text-2xl">✅</span>
              Créer Cookie de Session
            </button>

            <button
              onClick={deleteCookie}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
            >
              <span className="text-2xl">🗑️</span>
              Supprimer Cookie
            </button>

            <button
              onClick={refreshPage}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
            >
              <span className="text-2xl">🔄</span>
              Rafraîchir la Page (F5)
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Instructions de Test
            </h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>Cliquez sur "Créer Cookie de Session"</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                <span>Cliquez sur "Rafraîchir la Page" plusieurs fois</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span>
                <span>Le cookie reste actif après chaque refresh ✅</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">4.</span>
                <span className="font-bold text-red-600">
                  Fermez COMPLÈTEMENT le navigateur (tous les onglets)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">5.</span>
                <span>Rouvrez le navigateur et revenez sur cette page</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">6.</span>
                <span className="font-bold text-green-600">
                  Le cookie a disparu ! ❌
                </span>
              </li>
            </ol>
          </div>

          {/* Note technique */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-600">
              <span className="font-bold">💡 Note technique :</span> Un cookie
              de session est créé SANS les attributs{" "}
              <code className="bg-gray-200 px-1 rounded">max-age</code> ou{" "}
              <code className="bg-gray-200 px-1 rounded">expires</code>. Il
              persiste pendant toute la session du navigateur mais disparaît à
              la fermeture complète du navigateur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
