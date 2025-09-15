import React, { useState } from "react";

interface Props {
  isDarkMode: boolean;
}

const Roles = ({ isDarkMode }: Props) => {
  const [users] = useState([
    { id: 1, nom: "Martin", prenom: "Sophie", status: "active", email: "sophie.martin@imfp.com", permissions: { "Élèves": true, "Notes": true } },
  ]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const permissions = [
    "Tableau de Bord",
    "Années scolaires",
    "Élèves",
    "Notes",
    "Professeurs",
    "Employés",
    "Paiements",
    "Rapports",
    "Calendrier",
    "Paramètres",
  ];

  const themeClasses = {
    text: isDarkMode ? "text-gray-100" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    input: isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    border: isDarkMode ? "border-gray-600" : "border-gray-200",
  };

  const handlePermissionToggle = (permission: string) => {
    alert(`Basculer l'autorisation: ${permission}`);
  };

  return (
    <div className="space-y-8">
      <h2 className={`text-2xl font-bold ${themeClasses.text}`}>Gestion des rôles et autorisations</h2>

      <div>
        <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Sélectionner un utilisateur</label>
        <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className={`w-full max-w-md px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}>
          <option value="">-- Choisir un utilisateur --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id.toString()}>
              {user.prenom} {user.nom} ({user.status === "active" ? "Actif" : "Bloqué"})
            </option>
          ))}
        </select>
      </div>

      {selectedUser && (
        <div className={`${themeClasses.cardBg} border ${themeClasses.border} rounded-xl p-8`}>
          <h3 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Autorisations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {permissions.map((permission) => (
              <div key={permission} className={`flex items-center justify-between p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                <span className={`text-sm font-medium ${themeClasses.text}`}>{permission}</span>
                <button onClick={() => handlePermissionToggle(permission)} className={`relative inline-flex h-6 w-11 rounded-full transition-colors bg-gray-300`}>
                  <span className={`inline-block h-4 w-4 mt-1 ml-1 transform rounded-full bg-white transition-transform`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;


