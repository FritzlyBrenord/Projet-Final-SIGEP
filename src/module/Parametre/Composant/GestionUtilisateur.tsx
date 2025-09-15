import React, { useMemo, useState } from "react";

interface Props {
  isDarkMode: boolean;
}

const GestionUtilisateur = ({ isDarkMode }: Props) => {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employees] = useState([
    { id: 1, nom: "Martin", prenom: "Sophie", poste: "Professeur Math" },
    { id: 2, nom: "Bernard", prenom: "Pierre", poste: "Professeur Français" },
  ]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [newUserData, setNewUserData] = useState({ email: "", password: "" });

  const themeClasses = {
    text: isDarkMode ? "text-gray-100" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    input: isDarkMode
      ? "bg-gray-700 border-gray-600 text-gray-100"
      : "bg-white border-gray-300 text-gray-900",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    border: isDarkMode ? "border-gray-600" : "border-gray-200",
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) =>
      `${emp.prenom} ${emp.nom} ${emp.poste}`
        .toLowerCase()
        .includes(employeeSearch.toLowerCase())
    );
  }, [employees, employeeSearch]);

  const generateEmail = (nom: string, prenom: string) => `${prenom.toLowerCase()}.${nom.toLowerCase()}@imfp.com`;
  const generatePassword = () => Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

  const handleEmployeeSelect = (employee: any) => {
    setSelectedEmployee(employee);
    setEmployeeSearch(`${employee.prenom} ${employee.nom} - ${employee.poste}`);
    setNewUserData({ email: generateEmail(employee.nom, employee.prenom), password: generatePassword() });
    setShowEmployeeDropdown(false);
  };

  const handleCreateUser = () => {
    if (!selectedEmployee || !newUserData.email || !newUserData.password) return;
    const newUser = {
      id: users.length + 1,
      nom: selectedEmployee.nom,
      prenom: selectedEmployee.prenom,
      email: newUserData.email,
      status: "active",
      lastLogin: "Jamais connecté",
    };
    setUsers([...users, newUser]);
    setSelectedEmployee(null);
    setEmployeeSearch("");
    setNewUserData({ email: "", password: "" });
    alert(`Utilisateur créé avec succès!\nEmail: ${newUser.email}\nMot de passe: ${newUserData.password}`);
  };

  return (
    <div className="space-y-8">
      <h2 className={`text-2xl font-bold ${themeClasses.text}`}>Gestion des utilisateurs</h2>

      <div className={`${themeClasses.cardBg} p-6 rounded-xl`}>
        <h3 className={`text-lg font-semibold ${themeClasses.text} mb-6`}>Créer un nouvel utilisateur</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Rechercher un employé</label>
            <div className="relative">
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => { setEmployeeSearch(e.target.value); setShowEmployeeDropdown(true); }}
                onFocus={() => setShowEmployeeDropdown(true)}
                placeholder="Tapez pour rechercher..."
                className={`w-full px-4 py-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
              />
              {showEmployeeDropdown && filteredEmployees.length > 0 && (
                <div className={`absolute z-10 w-full mt-1 ${themeClasses.cardBg} border ${themeClasses.border} rounded-lg shadow-lg max-h-60 overflow-y-auto`}>
                  {filteredEmployees.map((emp) => (
                    <button key={emp.id} onClick={() => handleEmployeeSelect(emp)} className={`w-full text-left px-4 py-3 ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-blue-50"}`}>
                      <div className="font-medium">{emp.prenom} {emp.nom}</div>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>{emp.poste}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Email généré</label>
            <input type="email" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`} />
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Mot de passe généré</label>
            <div className="flex gap-2">
              <input type="text" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} className={`flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`} />
              <button onClick={() => setNewUserData({ ...newUserData, password: generatePassword() })} className="px-3 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Générer</button>
            </div>
          </div>
        </div>

        <button onClick={handleCreateUser} disabled={!selectedEmployee || !newUserData.email || !newUserData.password} className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">Créer l'utilisateur</button>
      </div>

      <div>
        <h3 className={`text-lg font-semibold ${themeClasses.text} mb-6`}>Utilisateurs existants</h3>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className={`${themeClasses.cardBg} border ${themeClasses.border} p-6 rounded-xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-semibold ${themeClasses.text}`}>{user.prenom} {user.nom}</div>
                  <div className={`text-sm ${themeClasses.textSecondary}`}>{user.email}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GestionUtilisateur;


