"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  Camera,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Shield,
} from "lucide-react";
import { useContextUtilisateur } from "@/Context/ContextUtilisateur";
import { SignIn } from "@/Config/SupabaseData";
interface ProfilModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onPhotoUpdate?: (photoUrl: string) => void;
}

const ProfilModal: React.FC<ProfilModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onPhotoUpdate,
}) => {
  const {
    currentSession,
    UpdateUtilisateur,
    SaveProfilPhoto,
    GetProfilPhoto,
    loading,
  } = useContextUtilisateur();

  // États pour la photo de profil
  const [profilePhoto, setProfilePhoto] = useState<string>("/avatar.png");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États pour la modification de l'email
  const [currentEmailInput, setCurrentEmailInput] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  // États pour la modification du mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // États pour afficher/masquer les mots de passe
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const themeClasses = {
    text: isDarkMode ? "text-gray-100" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    input: isDarkMode
      ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    hover: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50",
    modalBg: isDarkMode ? "bg-gray-900" : "bg-white",
  };

  // Charger la photo de profil au montage
  useEffect(() => {
    if (currentSession?.user?.id) {
      const savedPhoto = GetProfilPhoto(currentSession.user.id);
      if (savedPhoto) {
        setProfilePhoto(savedPhoto);
      }
    }
  }, [currentSession, GetProfilPhoto]);

  // Réinitialiser les états à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setCurrentEmailInput("");
      setNewEmail("");
      setEmailError("");
      setEmailSuccess("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setPasswordSuccess("");
      setPhotoPreview(null);
    }
  }, [isOpen]);

  if (!isOpen || !currentSession?.user) return null;

  const userInfo = {
    nom: currentSession.employer?.nom || "",
    prenom: currentSession.employer?.prenom || "",
    email: currentSession.user.email || "",
    role: currentSession.role || "Utilisateur",
    departement: currentSession.employer?.departement || "",
    fonction: currentSession.employer?.fonction || "",
  };

  // Gestion de la photo de profil
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image valide");
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("L'image doit faire moins de 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhotoPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (photoPreview && currentSession.user.id) {
      SaveProfilPhoto(currentSession.user.id, photoPreview);
      setProfilePhoto(photoPreview);
      setPhotoPreview(null);
      if (onPhotoUpdate) {
        onPhotoUpdate(photoPreview);
      }
      alert("Photo de profil mise à jour avec succès!");
    }
  };

  const handleCancelPhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Validation de l'email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Modification de l'email
  const handleEmailChange = async () => {
    setEmailError("");
    setEmailSuccess("");

    // Vérifier que l'email actuel correspond
    if (currentEmailInput.toLowerCase() !== userInfo.email.toLowerCase()) {
      setEmailError("L'email actuel ne correspond pas");
      return;
    }

    // Valider le format du nouvel email
    if (!validateEmail(newEmail)) {
      setEmailError("Format d'email invalide");
      return;
    }

    // Vérifier que le nouvel email est différent
    if (newEmail.toLowerCase() === userInfo.email.toLowerCase()) {
      setEmailError("Le nouvel email doit être différent de l'actuel");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await UpdateUtilisateur(currentSession.user.id, {
        email_connexion: newEmail,
      });

      if (success) {
        alert("Email modifié avec succès! Veuillez vous reconnecter.");
        setEmailSuccess(
          "Email modifié avec succès! Veuillez vous reconnecter."
        );
        setCurrentEmailInput("");
        setNewEmail("");
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setEmailError("Erreur lors de la modification de l'email");
      }
    } catch (error: any) {
      setEmailError(error.message || "Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation du mot de passe
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // Modification du mot de passe
  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    // Validations
    if (!currentPassword) {
      setPasswordError("Veuillez saisir votre mot de passe actuel");
      return;
    }

    if (!validatePassword(newPassword)) {
      setPasswordError(
        "Le nouveau mot de passe doit contenir au moins 6 caractères"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "Le nouveau mot de passe doit être différent de l'actuel"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const loginResult = await SignIn(userInfo.email, currentPassword);

      if (!loginResult.success) {
        setPasswordError("Le mot de passe actuel est incorrect");
        setIsSubmitting(false);
        return;
      }

      // Modifier le mot de passe
      const success = await UpdateUtilisateur(currentSession.user.id, {
        password_connexion: newPassword,
      });

      if (success) {
        alert("Mot de passe modifié avec succès! Veuillez vous reconnecter.");
        setPasswordSuccess(
          "Mot de passe modifié avec succès! Veuillez vous reconnecter."
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setPasswordSuccess("");
        }, 3000);
      } else {
        setPasswordError("Erreur lors de la modification du mot de passe");
      }
    } catch (error: any) {
      setPasswordError(error.message || "Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div
        className={`${themeClasses.modalBg} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${themeClasses.border} sticky top-0 ${themeClasses.modalBg} z-10`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
                Mon Profil
              </h2>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                Gérez vos informations personnelles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${themeClasses.hover}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Section Photo de Profil */}
          <div
            className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-6`}
          >
            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
              Photo de profil
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={photoPreview || profilePhoto}
                  alt="Profil"
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/30"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                  title="Changer la photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${themeClasses.textSecondary} mb-3`}>
                  JPG, PNG ou GIF - Max 2MB <br />
                  <br />
                  {userInfo.email}
                </p>
                {photoPreview && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePhoto}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Sauvegarder
                    </button>
                    <button
                      onClick={handleCancelPhoto}
                      className={`px-4 py-2 rounded-lg border ${themeClasses.border} ${themeClasses.hover} transition-colors`}
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Informations Personnelles (Lecture seule) */}
          <div
            className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-6`}
          >
            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
              Informations personnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Nom
                </label>
                <div
                  className={`px-4 py-3 rounded-lg ${themeClasses.input} opacity-75`}
                >
                  {userInfo.nom}
                </div>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Prénom
                </label>
                <div
                  className={`px-4 py-3 rounded-lg ${themeClasses.input} opacity-75`}
                >
                  {userInfo.prenom}
                </div>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Rôle
                </label>
                <div
                  className={`px-4 py-3 rounded-lg ${themeClasses.input} opacity-75 flex items-center gap-2`}
                >
                  <Shield className="w-4 h-4 text-blue-500" />
                  {userInfo.role}
                </div>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Département
                </label>
                <div
                  className={`px-4 py-3 rounded-lg ${themeClasses.input} opacity-75`}
                >
                  {userInfo.departement}
                </div>
              </div>
              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Fonction
                </label>
                <div
                  className={`px-4 py-3 rounded-lg ${themeClasses.input} opacity-75`}
                >
                  {userInfo.fonction}
                </div>
              </div>
            </div>
          </div>

          {/* Section Modification Email */}
          <div
            className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-6`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-blue-500" />
              <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                Modifier l'email
              </h3>
            </div>

            {emailSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg dark:bg-green-900 dark:border-green-700 dark:text-green-300 flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>{emailSuccess}</span>
              </div>
            )}

            {emailError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{emailError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Email actuel
                </label>
                <input
                  type="email"
                  value={currentEmailInput}
                  onChange={(e) => setCurrentEmailInput(e.target.value)}
                  placeholder={userInfo.email}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Nouvel email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nouveau.email@exemple.com"
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                />
              </div>
              <button
                onClick={handleEmailChange}
                disabled={
                  isSubmitting || loading || !currentEmailInput || !newEmail
                }
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>Modification en cours...</>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Modifier l'email
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section Modification Mot de Passe */}
          <div
            className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-6`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-blue-500" />
              <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                Modifier le mot de passe
              </h3>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg dark:bg-green-900 dark:border-green-700 dark:text-green-300 flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className={`text-xs mt-1 ${themeClasses.textSecondary}`}>
                  Minimum 6 caractères
                </p>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}
                >
                  Confirmer le nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${themeClasses.input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={handlePasswordChange}
                disabled={
                  isSubmitting ||
                  loading ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>Modification en cours...</>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Modifier le mot de passe
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${themeClasses.border} flex justify-end`}>
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-lg border ${themeClasses.border} ${themeClasses.hover} transition-colors font-medium`}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilModal;
