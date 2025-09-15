import React, { useState } from "react";

interface Props {
  isDarkMode: boolean;
}

const MonCompte = ({ isDarkMode }: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    nom: "Dupont",
    prenom: "Jean",
    email: "admin@imfp.com",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const themeClasses = {
    text: isDarkMode ? "text-gray-100" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    input: isDarkMode
      ? "bg-gray-700 border-gray-600 text-gray-100"
      : "bg-white border-gray-300 text-gray-900",
  };

  const handleProfileUpdate = () => {
    if (
      adminProfile.newPassword &&
      adminProfile.newPassword !== adminProfile.confirmPassword
    ) {
      alert("Les nouveaux mots de passe ne correspondent pas!");
      return;
    }
    alert("Profil mis à jour avec succès!");
  };

  return (
    <div className="space-y-8">
      <h2 className={`text-2xl font-bold ${themeClasses.text}`}>Modifier mon compte</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Nom</label>
          <input
            type="text"
            value={adminProfile.nom}
            onChange={(e) => setAdminProfile({ ...adminProfile, nom: e.target.value })}
            className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Prénom</label>
          <input
            type="text"
            value={adminProfile.prenom}
            onChange={(e) => setAdminProfile({ ...adminProfile, prenom: e.target.value })}
            className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
          />
        </div>

        <div className="md:col-span-2">
          <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Email</label>
          <input
            type="email"
            value={adminProfile.email}
            onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
            className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Mot de passe actuel</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={adminProfile.currentPassword}
              onChange={(e) => setAdminProfile({ ...adminProfile, currentPassword: e.target.value })}
              className={`w-full px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-4 top-3.5 ${themeClasses.textSecondary}`}>
              {showPassword ? "Cacher" : "Voir"}
            </button>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Nouveau mot de passe</label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={adminProfile.newPassword}
              onChange={(e) => setAdminProfile({ ...adminProfile, newPassword: e.target.value })}
              className={`w-full px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
            />
            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className={`absolute right-4 top-3.5 ${themeClasses.textSecondary}`}>
              {showNewPassword ? "Cacher" : "Voir"}
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            value={adminProfile.confirmPassword}
            onChange={(e) => setAdminProfile({ ...adminProfile, confirmPassword: e.target.value })}
            className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
          />
        </div>
      </div>

      <button onClick={handleProfileUpdate} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
        Sauvegarder les modifications
      </button>
    </div>
  );
};

export default MonCompte;


