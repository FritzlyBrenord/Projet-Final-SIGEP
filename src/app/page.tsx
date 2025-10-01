"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  GraduationCap,
  BookOpen,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useContextUtilisateur } from "@/Context/ContextUtilisateur";
import Uuid from "@/utils/UUid/Uuid";
// Import du Super Admin
import {
  SUPER_ADMIN_CREDENTIALS,
  SUPER_ADMIN_USER_PROFILE,
} from "@/Config/SuperAdmin/SuperAdmin";
import { useRecentActivities } from "@/Context/RecentActivitiesContext";

interface LoginFormData {
  email: string;
  password: string;
}

interface SecurityAlert {
  type: "warning" | "error" | "info";
  message: string;
}

function SIGEPLoginPageContent() {
  const router = useRouter();
  const { uuid, rafrechieUUID } = Uuid();
  const { addActivity } = useRecentActivities();
  const searchParams = useSearchParams();
  const {
    Login,
    Logout,
    currentSession,
    loading: contextLoading,
    error: contextError,
  } = useContextUtilisateur();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");
  const [securityAlert, setSecurityAlert] = useState<SecurityAlert | null>(
    null
  );
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState<number>(0);
  const [isAccountBlocked, setIsAccountBlocked] = useState<boolean>(false);

  // Gérer les alertes de sécurité basées sur les paramètres URL
  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason) {
      const alerts: Record<string, SecurityAlert> = {
        url_tampered: {
          type: "error",
          message:
            "URL modifiée détectée. Veuillez vous reconnecter pour des raisons de sécurité.",
        },
        session_expired: {
          type: "warning",
          message: "Votre session a expiré. Veuillez vous reconnecter.",
        },
        account_blocked: {
          type: "error",
          message: "Votre compte est bloqué. Contactez l'administrateur.",
        },
        insufficient_permissions: {
          type: "warning",
          message:
            "Accès non autorisé. Reconnectez-vous avec les bons privilèges.",
        },
        security_error: {
          type: "error",
          message: "Erreur de sécurité détectée. Reconnexion requise.",
        },
      };

      const alert = alerts[reason];
      if (alert) {
        setSecurityAlert(alert);
        if (reason === "account_blocked") {
          setIsAccountBlocked(true);
        }
      }
    }
  }, [searchParams]);

  // Gestion du blocage temporaire après plusieurs tentatives
  useEffect(() => {
    if (attemptCount >= 5) {
      setIsBlocked(true);
      setBlockTimeRemaining(300); // 5 minutes

      const interval = setInterval(() => {
        setBlockTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setAttemptCount(0);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [attemptCount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (loginError) setLoginError("");
    if (securityAlert) setSecurityAlert(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isBlocked && !isAccountBlocked) {
      handleSubmit();
    }
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      setLoginError("L'email est requis");
      return false;
    }

    if (!formData.email.includes("@")) {
      setLoginError("Format d'email invalide");
      return false;
    }

    if (!formData.password.trim()) {
      setLoginError("Le mot de passe est requis");
      return false;
    }

    if (formData.password.length < 6) {
      setLoginError("Le mot de passe doit contenir au moins 6 caractères");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    Logout();
    if (isBlocked) {
      setLoginError(
        `Trop de tentatives. Réessayez dans ${Math.ceil(
          blockTimeRemaining / 60
        )} minute(s).`
      );
      return;
    }

    if (isAccountBlocked) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoginError("");

    try {
      // VÉRIFICATION DU SUPER ADMIN SYSTÈME
      if (
        formData.email.trim().toLowerCase() ===
          SUPER_ADMIN_CREDENTIALS.email.toLowerCase() &&
        formData.password === SUPER_ADMIN_CREDENTIALS.password
      ) {
        console.log("🔐 Connexion Super Admin Système détectée");

        // Stocker les informations du Super Admin dans localStorage
        localStorage.setItem(
          "superadmin_session",
          JSON.stringify({
            id: SUPER_ADMIN_CREDENTIALS.id,
            email: SUPER_ADMIN_CREDENTIALS.email,
            role: "Super Administrateur",
            timestamp: new Date().toISOString(),
          })
        );

        // Connexion réussie pour Super Admin
        setAttemptCount(0);

        // Rediriger
        setTimeout(() => {
          const redirectPath = `/SIGEP-Tableau-De-Bord/${uuid}`;
          router.replace(redirectPath);
          addActivity({
            action: "connexion",
            module: "Authentification",
            title: "Connexion Super Admin",
            details: "L'utilisateur Super Admin s'est connecté avec succès.",
          });
        }, 500);

        setIsLoading(false);
        return;
      }

      // CONNEXION NORMALE POUR LES AUTRES UTILISATEURS
      const result = await Login(formData.email.trim(), formData.password);

      if (result.success && result.user) {
        setAttemptCount(0);
        const redirectPath = `/SIGEP-Tableau-De-Bord/${uuid}`;
        setTimeout(() => {
          router.replace(redirectPath);
          addActivity({
            action: "connexion",
            module: "Authentification",
            title: "Connexion réussie",
            details: `L'utilisateur  s'est connecté avec succès.`,
          });
        }, 500);
      } else {
        const messageBlocked =
          result.message?.toLowerCase().includes("bloqué") ||
          result.message?.toLowerCase().includes("blocked") ||
          result.message?.toLowerCase().includes("banned");

        if (messageBlocked) {
          setIsAccountBlocked(true);
          setLoginError(result.message);
          setSecurityAlert({
            type: "error",
            message: "Votre compte est bloqué. Contactez l'administrateur.",
          });
        } else {
          setAttemptCount((prev) => prev + 1);
          setLoginError(result.message || "Email ou mot de passe incorrect");
        }
      }
    } catch (error: any) {
      console.error("Erreur lors de la connexion:", error);
      setAttemptCount((prev) => prev + 1);
      setLoginError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getAlertStyles = (type: SecurityAlert["type"]) => {
    switch (type) {
      case "error":
        return "bg-red-100 border-red-400 text-red-800";
      case "warning":
        return "bg-yellow-100 border-yellow-400 text-yellow-800";
      case "info":
      default:
        return "bg-blue-100 border-blue-400 text-blue-800";
    }
  };

  const getAlertIcon = (type: SecurityAlert["type"]) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="w-5 h-5" />;
      case "warning":
        return <Shield className="w-5 h-5" />;
      case "info":
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const shouldDisableFields = isBlocked || isAccountBlocked;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background avec overlay */}
      <div className="absolute inset-0">
        <img
          src="/bg2.jpg"
          alt="École - Institution Mixte Faustin Premier"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-indigo-900/60 to-purple-900/70"></div>

        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        ></div>

        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Effets lumineux */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl mb-4 ring-4 ring-white/20">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            SIGEP
          </h1>
          <h2 className="text-lg font-semibold text-blue-200 mb-1 drop-shadow-md">
            Institution Mixte Faustin Premier
          </h2>
          <p className="text-gray-200 text-sm drop-shadow-md">
            Système Intégré de Gestion Éducative et Pédagogique
          </p>
        </div>

        {/* Alertes de sécurité */}
        {securityAlert && (
          <div
            className={`mb-6 p-4 rounded-lg border-l-4 ${getAlertStyles(
              securityAlert.type
            )} backdrop-blur-sm`}
          >
            <div className="flex items-center">
              {getAlertIcon(securityAlert.type)}
              <p className="ml-3 text-sm font-medium">
                {securityAlert.message}
              </p>
            </div>
          </div>
        )}

        {/* Formulaire de connexion */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-800">Connexion</h3>
          </div>

          {/* Indicateur de tentatives */}
          {attemptCount > 0 && !isAccountBlocked && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Tentatives de connexion: {attemptCount}/5
                {attemptCount >= 3 && " ⚠️ Attention!"}
              </p>
            </div>
          )}

          {/* Blocage temporaire */}
          {isBlocked && !isAccountBlocked && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Compte temporairement bloqué
                  </p>
                  <p className="text-xs text-red-600">
                    Temps restant: {formatTime(blockTimeRemaining)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Alerte compte bloqué */}
          {isAccountBlocked && (
            <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-bold text-red-900">
                    Compte bloqué
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Votre compte a été bloqué par l'administrateur. Veuillez
                    contacter le support technique pour plus d'informations.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Champ Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Adresse e-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail
                    className={`h-5 w-5 ${
                      shouldDisableFields ? "text-gray-300" : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={shouldDisableFields}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                  placeholder="votre-email@exemple.com"
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock
                    className={`h-5 w-5 ${
                      shouldDisableFields ? "text-gray-300" : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={shouldDisableFields}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={shouldDisableFields}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {(loginError || contextError) && !isAccountBlocked && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p className="text-sm">{loginError || contextError}</p>
              </div>
            )}

            {/* Liens d'aide */}
            {!isAccountBlocked && (
              <div className="flex items-center justify-between text-sm">
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Mot de passe oublié ?
                </a>
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || shouldDisableFields}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg disabled:from-gray-400 disabled:to-gray-500"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Connexion en cours...
                </div>
              ) : isAccountBlocked ? (
                "Compte bloqué"
              ) : isBlocked ? (
                "Bloqué temporairement"
              ) : (
                "Se connecter"
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-300 drop-shadow-md">
          <p>© {new Date().getFullYear()} Institution Mixte Faustin Premier</p>
          <p>Système SIGEP - Tous droits réservés</p>
        </div>
      </div>
    </div>
  );
}

export default function SIGEPLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      }
    >
      <SIGEPLoginPageContent />
    </Suspense>
  );
}
