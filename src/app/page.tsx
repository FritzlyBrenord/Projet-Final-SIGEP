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
  Monitor,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useContextUtilisateur } from "@/Context/ContextUtilisateur";
import Uuid from "@/utils/UUid/Uuid";
import { SUPER_ADMIN_CREDENTIALS } from "@/Config/SuperAdmin/SuperAdmin";
import { useRecentActivities } from "@/Context/RecentActivitiesContext";

import { useConnectionStatus } from "@/components/ConnectionNotification";

interface LoginFormData {
  email: string;
  password: string;
}

interface SecurityAlert {
  type: "warning" | "error" | "info" | "success";
  message: string;
}

function LoginPageContent() {
  const router = useRouter();
  const { uuid } = Uuid();
  const { addActivity } = useRecentActivities();
  const searchParams = useSearchParams();
  const {
    Login,
    Logout,
    loading: contextLoading,
    error: contextError,
    BloquerUtilisateurParEmail,
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

  const isOnline = useConnectionStatus();

  // Gérer les alertes de sécurité
  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason) {
      const alerts: Record<string, SecurityAlert> = {
        session_expired: {
          type: "warning",
          message: "Votre session a expiré. Veuillez vous reconnecter.",
        },
        account_blocked: {
          type: "error",
          message: "Votre compte est bloqué. Contactez l'administrateur.",
        },
        security_error: {
          type: "error",
          message: "Erreur de sécurité détectée. Reconnexion requise.",
        },
        browser_closed: {
          type: "info",
          message:
            "Vous avez été déconnecté suite à la fermeture du navigateur.",
        },
        user_logout: {
          type: "success",
          message: "Vous avez été déconnecté avec succès.",
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

  // Gestion du blocage temporaire
  useEffect(() => {
    if (attemptCount >= 5) {
      setIsBlocked(true);
      setBlockTimeRemaining(300); // 5 minutes
      BloquerUtilisateurParEmail(formData.email);
    }
  }, [attemptCount, formData.email, BloquerUtilisateurParEmail]);

  // Compte à rebours du blocage
  useEffect(() => {
    if (isBlocked && blockTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setBlockTimeRemaining((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (isBlocked && blockTimeRemaining === 0) {
      setIsBlocked(false);
      setAttemptCount(0);
    }
  }, [isBlocked, blockTimeRemaining]);

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
    if (e.key === "Enter" && !isBlocked && !isAccountBlocked && isOnline) {
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
    if (!isOnline) {
      setLoginError("❌ Connexion Internet requise pour se connecter");
      return;
    }

    // Déconnexion préalable pour nettoyer toute session existante
    Logout();

    if (isBlocked) {
      setLoginError(
        `❌ Trop de tentatives. Réessayez dans ${Math.ceil(
          blockTimeRemaining / 60
        )} minute(s).`
      );
      return;
    }

    if (isAccountBlocked) {
      setLoginError("❌ Votre compte est bloqué. Contactez l'administrateur.");
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    setLoginError("");

    try {
      const email = formData.email.trim().toLowerCase();

      // ===== SUPER ADMIN =====
      if (
        email === SUPER_ADMIN_CREDENTIALS.email.toLowerCase() &&
        formData.password === SUPER_ADMIN_CREDENTIALS.password
      ) {
        console.log("🔐 Connexion Super Admin détectée");

        // Données de session Super Admin
        const superAdminSessionData = {
          id: SUPER_ADMIN_CREDENTIALS.id,
          email: SUPER_ADMIN_CREDENTIALS.email,
          role: "Super Administrateur",
          timestamp: new Date().toISOString(),
          session_token: `superadmin_${Date.now()}`,
        };

        // ✅ COOKIE DE SESSION SUPER ADMIN (disparaît à la fermeture du navigateur)
        document.cookie = `superadmin_session=${JSON.stringify(
          superAdminSessionData
        )}; path=/; secure; samesite=strict`;
        // ❌ PAS de max-age = cookie de session !

        localStorage.setItem(
          "superadmin_session",
          JSON.stringify(superAdminSessionData)
        );
        setAttemptCount(0);

        console.log("✅ Cookie de session Super Admin créé");

        const redirectPath = `/SIGEP-Tableau-De-Bord/${uuid}`;
        router.replace(redirectPath);

        addActivity({
          action: "connexion",
          module: "Authentification",
          title: "Connexion Super Admin",
          details: "L'utilisateur Super Admin s'est connecté avec succès.",
        });

        setIsLoading(false);
        return;
      }

      // ===== UTILISATEUR NORMAL =====
      console.log("👤 Connexion utilisateur normal...");

      // Authentification Supabase
      const result = await Login(email, formData.password);

      if (!result.success || !result.user) {
        const messageBlocked =
          result.message?.toLowerCase().includes("bloqué") ||
          result.message?.toLowerCase().includes("blocked") ||
          result.message?.toLowerCase().includes("banned");

        if (messageBlocked) {
          setIsAccountBlocked(true);
          setLoginError(
            "❌ Votre compte est bloqué. Contactez l'administrateur."
          );
          setSecurityAlert({
            type: "error",
            message: "Votre compte est bloqué. Contactez l'administrateur.",
          });
        } else {
          setAttemptCount((prev) => prev + 1);
          setLoginError(result.message || "❌ Email ou mot de passe incorrect");
        }
        setIsLoading(false);
        return;
      }

      // ✅ CONNEXION RÉUSSIE - CRÉER COOKIE DE SESSION UTILISATEUR
      const userSessionData = {
        id: result.user.id,
        email: result.user.email_connexion,
        role: result.user.role || "Utilisateur",
        timestamp: new Date().toISOString(),
        session_token: `user_${Date.now()}`,
      };

      // ✅ COOKIE DE SESSION UTILISATEUR NORMAL (disparaît à la fermeture du navigateur)
      document.cookie = `user_session=${JSON.stringify(
        userSessionData
      )}; path=/; secure; samesite=strict`;
      // ❌ PAS de max-age = cookie de session !

      console.log("✅ Cookie de session Utilisateur créé");

      setAttemptCount(0);
      const redirectPath = `/SIGEP-Tableau-De-Bord/${uuid}`;
      router.replace(redirectPath);

      addActivity({
        action: "connexion",
        module: "Authentification",
        title: "Connexion réussie",
        details: `L'utilisateur ${email} s'est connecté avec succès.`,
      });
    } catch (error: any) {
      console.error("❌ Erreur lors de la connexion:", error);
      setAttemptCount((prev) => prev + 1);
      setLoginError("❌ Erreur de connexion. Veuillez réessayer.");
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
        return "bg-blue-100 border-blue-400 text-blue-800";
      case "success":
        return "bg-green-100 border-green-400 text-green-800";
      default:
        return "bg-gray-100 border-gray-400 text-gray-800";
    }
  };

  const getAlertIcon = (type: SecurityAlert["type"]) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="w-5 h-5" />;
      case "warning":
        return <Shield className="w-5 h-5" />;
      case "info":
        return <Monitor className="w-5 h-5" />;
      case "success":
        return <Shield className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const shouldDisableFields = isBlocked || isAccountBlocked || !isOnline;

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
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Effets lumineux */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
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

        {/* Alerte connexion Internet */}
        {!isOnline && (
          <div className="mb-6 p-4 bg-orange-100 border border-orange-400 text-orange-800 rounded-lg backdrop-blur-sm">
            <div className="flex items-center">
              <WifiOff className="w-5 h-5 mr-3" />
              <div>
                <p className="font-medium">Connexion Internet perdue</p>
                <p className="text-sm mt-1">
                  Vous êtes hors ligne. La connexion est impossible sans
                  Internet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de connexion */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-800">
              Connexion Sécurisée
            </h3>
          </div>

          {/* Indicateur de tentatives */}
          {attemptCount > 0 && !isAccountBlocked && isOnline && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Tentatives de connexion: {attemptCount}/5
                {attemptCount >= 3 && " - Attention!"}
              </p>
            </div>
          )}

          {/* Blocage temporaire */}
          {isBlocked && !isAccountBlocked && isOnline && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    🔒 Trop de tentatives. Réessayez dans{" "}
                    {formatTime(blockTimeRemaining)}
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
                    🚫 Compte bloqué
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Votre compte a été bloqué par l'administrateur. Veuillez
                    contacter le support technique.
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
            {(loginError || contextError) && isOnline && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p className="text-sm">{loginError || contextError}</p>
              </div>
            )}

            {/* Liens d'aide */}
            {!isAccountBlocked && isOnline && (
              <div className="flex items-center justify-between text-sm">
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Mot de passe oublié ?
                </a>
                <span
                  className={`font-medium flex items-center ${
                    isOnline ? "text-green-600" : "text-orange-600"
                  }`}
                >
                  {isOnline ? (
                    <Wifi className="w-4 h-4 mr-1" />
                  ) : (
                    <WifiOff className="w-4 h-4 mr-1" />
                  )}
                  {isOnline ? "Internet OK" : "Hors ligne"}
                </span>
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || shouldDisableFields}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg disabled:from-gray-400 disabled:to-gray-500"
            >
              {!isOnline ? (
                <div className="flex items-center justify-center">
                  <WifiOff className="w-5 h-5 mr-2" />
                  Pas de connexion Internet
                </div>
              ) : isLoading ? (
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
                "🚫 Compte bloqué"
              ) : isBlocked ? (
                `🔒 Bloqué (${formatTime(blockTimeRemaining)})`
              ) : (
                "🔐 Se connecter"
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-300 drop-shadow-md">
          <p>© {new Date().getFullYear()} Institution Mixte Faustin Premier</p>
          <p className="mt-1">
            Système SIGEP - Sécurité renforcée - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Chargement de la page de connexion...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
