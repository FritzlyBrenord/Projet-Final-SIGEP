import { useState, useEffect } from "react";
import { X, Search, FolderOpen, FileText } from "lucide-react";

interface StudentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  onSearchComplete?: (studentCode: string) => void;
}

export default function StudentSearchModal({
  isOpen,
  onClose,
  isDarkMode = false,
  onSearchComplete,
}: StudentSearchModalProps) {
  const [studentCode, setStudentCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleSearch = async () => {
    if (!studentCode.trim()) return;

    setIsSearching(true);
    setShowAnimation(true);

    // Simulation de la construction du dossier (3 secondes)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setIsSearching(false);
    setShowAnimation(false);

    // Appeler la fonction de callback si fournie
    if (onSearchComplete) {
      onSearchComplete(studentCode);
    }

    // Fermer le modal automatiquement
    setTimeout(() => {
      handleClose();
    }, 100);
  };

  const handleClose = () => {
    setStudentCode("");
    setIsSearching(false);
    setShowAnimation(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={isDarkMode ? "dark" : ""}>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-slide-up">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              disabled={isSearching}
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3">
              <Search className="text-white" size={28} />
              <h2 className="text-2xl font-bold text-white">
                Recherche de Parcours
              </h2>
            </div>
            <p className="text-blue-100 mt-2 text-sm">
              Rechercher le parcours d'un élève
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {!showAnimation ? (
              <>
                {/* Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Code de l'élève
                  </label>
                  <input
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="Entrez le code de l'élève"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={isSearching}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                {/* Button */}
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !studentCode.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Recherche en cours...
                    </>
                  ) : (
                    <>
                      <Search size={20} />
                      Rechercher
                    </>
                  )}
                </button>
              </>
            ) : (
              /* Animation de construction du dossier */
              <div className="py-8 space-y-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <FolderOpen
                      className="text-blue-600 dark:text-blue-400 animate-bounce"
                      size={64}
                    />
                    <FileText
                      className="text-indigo-600 dark:text-indigo-400 absolute top-4 left-8 animate-pulse"
                      size={32}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-center text-gray-700 dark:text-gray-300 font-medium">
                    Construction du dossier en cours...
                  </p>

                  {/* Progress bar animée */}
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 animate-progress rounded-full" />
                  </div>

                  {/* Étapes animées */}
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2 animate-fade-in-delay-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span>Récupération des données...</span>
                    </div>
                    <div className="flex items-center gap-2 animate-fade-in-delay-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span>Compilation du parcours...</span>
                    </div>
                    <div className="flex items-center gap-2 animate-fade-in-delay-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                      <span>Finalisation du dossier...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-progress {
          animation: progress 3s ease-in-out;
        }

        .animate-fade-in-delay-1 {
          animation: fade-in 0.5s ease-out 0.3s both;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 0.5s ease-out 0.8s both;
        }

        .animate-fade-in-delay-3 {
          animation: fade-in 0.5s ease-out 1.3s both;
        }
      `}</style>
    </div>
  );
}
