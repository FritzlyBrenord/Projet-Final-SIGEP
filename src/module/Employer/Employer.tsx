import React, { useState } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  User,
  Users,
  CheckCircle,
  AlertTriangle,
  Filter,
  Briefcase,
} from "lucide-react";

// Types
interface Employe {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  dateEmbauche: string;
  typeEmploye: TypeEmploye;
  departement: string;
  responsabilites: string;
  diplomes: string;
  statut: "actif" | "inactif";
}

type TypeEmploye =
  | "secretaire"
  | "censeur"
  | "surveillant"
  | "gradient"
  | "econome"
  | "directeur"
  | "directeur_pedagogique";

interface Props {
  isDarkMode?: boolean;
}

const TYPE_EMPLOYE_OPTIONS = [
  { value: "secretaire", label: "Secrétaire" },
  { value: "censeur", label: "Censeur" },
  { value: "surveillant", label: "Surveillant" },
  { value: "gradient", label: "Gradient" },
  { value: "econome", label: "Économe" },
  { value: "directeur", label: "Directeur" },
  { value: "directeur_pedagogique", label: "Directeur Pédagogique" },
];

const GestionEmployer = ({ isDarkMode = false }: Props) => {
  // État des employés
  const [employes, setEmployes] = useState<Employe[]>([
    {
      id: "1",
      code: "EMP001",
      nom: "Dupont",
      prenom: "Jean",
      email: "jean.dupont@institut.edu",
      telephone: "+509 1234-5678",
      adresse: "123 Rue des Écoles, Port-au-Prince",
      dateEmbauche: "2020-09-01",
      typeEmploye: "directeur",
      departement: "Direction Générale",
      responsabilites: "Supervision générale, gestion administrative",
      diplomes: "Master en Administration",
      statut: "actif",
    },
    {
      id: "2",
      code: "EMP002",
      nom: "Martin",
      prenom: "Marie",
      email: "marie.martin@institut.edu",
      telephone: "+509 8765-4321",
      adresse: "456 Avenue de l'Éducation, Port-au-Prince",
      dateEmbauche: "2019-08-15",
      typeEmploye: "secretaire",
      departement: "Administration",
      responsabilites: "Gestion des dossiers, accueil, correspondance",
      diplomes: "Licence en Secrétariat",
      statut: "actif",
    },
    {
      id: "3",
      code: "EMP003",
      nom: "Bernard",
      prenom: "Pierre",
      email: "pierre.bernard@institut.edu",
      telephone: "+509 9876-5432",
      adresse: "789 Boulevard des Sciences, Port-au-Prince",
      dateEmbauche: "2021-01-10",
      typeEmploye: "surveillant",
      departement: "Vie Scolaire",
      responsabilites: "Surveillance des élèves, discipline",
      diplomes: "Baccalauréat",
      statut: "inactif",
    },
    {
      id: "4",
      code: "EMP004",
      nom: "Rousseau",
      prenom: "Sophie",
      email: "sophie.rousseau@institut.edu",
      telephone: "+509 3456-7890",
      adresse: "321 Rue de la Pédagogie, Port-au-Prince",
      dateEmbauche: "2018-03-20",
      typeEmploye: "directeur_pedagogique",
      departement: "Pédagogie",
      responsabilites: "Coordination pédagogique, formation des enseignants",
      diplomes: "Master en Sciences de l'Éducation",
      statut: "actif",
    },
  ]);

  // États d'interface
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    "add" | "edit" | "view" | "delete"
  >("add");
  const [selectedEmploye, setSelectedEmploye] = useState<Employe | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<TypeEmploye | "tous">("tous");

  // État du formulaire
  const [formData, setFormData] = useState<Omit<Employe, "id">>({
    code: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    dateEmbauche: "",
    typeEmploye: "secretaire",
    departement: "",
    responsabilites: "",
    diplomes: "",
    statut: "actif",
  });

  // Styles conditionnels
  const baseClasses = isDarkMode
    ? "min-h-screen bg-gray-900 text-white"
    : "min-h-screen bg-gray-50 text-gray-900";

  const cardClasses = isDarkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";

  const inputClasses = isDarkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400"
    : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

  const buttonPrimaryClasses = isDarkMode
    ? "bg-blue-700 hover:bg-blue-600 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  const buttonSecondaryClasses = isDarkMode
    ? "bg-gray-600 hover:bg-gray-500 text-white"
    : "bg-gray-300 hover:bg-gray-400 text-gray-700";

  const buttonDangerClasses = isDarkMode
    ? "bg-red-700 hover:bg-red-600 text-white"
    : "bg-red-600 hover:bg-red-700 text-white";

  const tableHeaderClasses = isDarkMode
    ? "bg-gray-700 text-gray-300"
    : "bg-gray-50 text-gray-500";

  const tableRowClasses = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";

  const tableBorderClasses = isDarkMode ? "divide-gray-700" : "divide-gray-200";

  // Utilitaires
  const getTypeEmployeLabel = (type: TypeEmploye) => {
    return (
      TYPE_EMPLOYE_OPTIONS.find((option) => option.value === type)?.label ||
      type
    );
  };

  const getTypeEmployeColor = (type: TypeEmploye) => {
    const colors = {
      directeur: isDarkMode
        ? "bg-purple-900 text-purple-300"
        : "bg-purple-100 text-purple-800",
      directeur_pedagogique: isDarkMode
        ? "bg-indigo-900 text-indigo-300"
        : "bg-indigo-100 text-indigo-800",
      censeur: isDarkMode
        ? "bg-orange-900 text-orange-300"
        : "bg-orange-100 text-orange-800",
      econome: isDarkMode
        ? "bg-yellow-900 text-yellow-300"
        : "bg-yellow-100 text-yellow-800",
      secretaire: isDarkMode
        ? "bg-green-900 text-green-300"
        : "bg-green-100 text-green-800",
      surveillant: isDarkMode
        ? "bg-blue-900 text-blue-300"
        : "bg-blue-100 text-blue-800",
      gradient: isDarkMode
        ? "bg-gray-700 text-gray-300"
        : "bg-gray-100 text-gray-800",
    };
    return colors[type];
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      code: "",
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      adresse: "",
      dateEmbauche: "",
      typeEmploye: "secretaire",
      departement: "",
      responsabilites: "",
      diplomes: "",
      statut: "actif",
    });
  };

  // Générer un nouveau code employé
  const generateEmpCode = () => {
    const lastCode = employes.reduce((max, emp) => {
      const num = parseInt(emp.code.slice(-3));
      return num > max ? num : max;
    }, 0);
    return `EMP${String(lastCode + 1).padStart(3, "0")}`;
  };

  // Ouvrir modal
  const openModal = (
    type: "add" | "edit" | "view" | "delete",
    emp: Employe | null = null
  ) => {
    setModalType(type);
    setSelectedEmploye(emp);

    if (type === "add") {
      resetForm();
      setFormData((prev) => ({ ...prev, code: generateEmpCode() }));
    } else if (type === "edit" && emp) {
      setFormData({ ...emp });
    }

    setShowModal(true);
  };

  // Fermer modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedEmploye(null);
    resetForm();
  };

  // Soumettre le formulaire
  const handleSubmit = () => {
    if (!formData.nom || !formData.prenom || !formData.email) {
      alert(
        "Veuillez remplir tous les champs obligatoires (nom, prénom, email)"
      );
      return;
    }

    if (modalType === "add") {
      if (employes.some((e) => e.code === formData.code)) {
        alert("Ce code employé existe déjà");
        return;
      }

      const nouvelEmploye: Employe = {
        ...formData,
        id: Date.now().toString(),
      };

      setEmployes((prev) => [...prev, nouvelEmploye]);
      alert("Employé ajouté avec succès!");
    } else if (modalType === "edit" && selectedEmploye) {
      setEmployes((prev) =>
        prev.map((e) =>
          e.id === selectedEmploye.id
            ? { ...formData, id: selectedEmploye.id }
            : e
        )
      );
      alert("Employé modifié avec succès!");
    }

    closeModal();
  };

  // Supprimer employé
  const handleDelete = () => {
    if (!selectedEmploye) return;

    setEmployes((prev) => prev.filter((e) => e.id !== selectedEmploye.id));
    alert("Employé supprimé avec succès!");
    closeModal();
  };

  // Gérer les changements d'input
  const handleInputChange = (
    field: keyof Omit<Employe, "id">,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Filtrer les employés
  const filteredEmployes = employes.filter((emp) => {
    const matchSearch =
      searchTerm === "" ||
      emp.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTypeEmployeLabel(emp.typeEmploye)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      emp.departement.toLowerCase().includes(searchTerm.toLowerCase());

    const matchFilter = filterType === "tous" || emp.typeEmploye === filterType;

    return matchSearch && matchFilter;
  });

  return (
    <div className={`${baseClasses} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion des Employés</h1>
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
            Système de gestion des Employés Scolaires - SIGEP
          </p>
        </div>

        {/* Barre d'actions */}
        <div className={`${cardClasses} rounded-lg shadow-sm border p-6 mb-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Recherche */}
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un employé..."
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtre par type */}
              <div className="relative min-w-[200px]">
                <Filter className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <select
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(e.target.value as TypeEmploye | "tous")
                  }
                >
                  <option value="tous">Tous les types</option>
                  {TYPE_EMPLOYE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => openModal("add")}
              className={`${buttonPrimaryClasses} px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
            >
              <Plus className="h-4 w-4" />
              Ajouter un Employé
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg ${
                  isDarkMode ? "bg-blue-900" : "bg-blue-100"
                }`}
              >
                <Users
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Total Employés
                </p>
                <p className="text-2xl font-bold">{employes.length}</p>
              </div>
            </div>
          </div>

          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg ${
                  isDarkMode ? "bg-green-900" : "bg-green-100"
                }`}
              >
                <CheckCircle
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-green-300" : "text-green-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Actifs
                </p>
                <p className="text-2xl font-bold">
                  {employes.filter((e) => e.statut === "actif").length}
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg ${
                  isDarkMode ? "bg-red-900" : "bg-red-100"
                }`}
              >
                <AlertTriangle
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-red-300" : "text-red-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Inactifs
                </p>
                <p className="text-2xl font-bold">
                  {employes.filter((e) => e.statut === "inactif").length}
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg ${
                  isDarkMode ? "bg-purple-900" : "bg-purple-100"
                }`}
              >
                <Briefcase
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-purple-300" : "text-purple-600"
                  }`}
                />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Types de postes
                </p>
                <p className="text-2xl font-bold">
                  {new Set(employes.map((e) => e.typeEmploye)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des employés */}
        <div className={`${cardClasses} rounded-lg shadow-sm border`}>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Liste des Employés ({filteredEmployes.length})
            </h2>

            {filteredEmployes.length === 0 ? (
              <div className="text-center py-12">
                <User
                  className={`h-16 w-16 mx-auto mb-4 ${
                    isDarkMode ? "text-gray-600" : "text-gray-400"
                  }`}
                />
                <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                  Aucun employé trouvé
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className={tableHeaderClasses}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Employé
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Poste
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Département
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${tableBorderClasses}`}>
                    {filteredEmployes.map((emp) => (
                      <tr key={emp.id} className={tableRowClasses}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                  isDarkMode ? "bg-gray-600" : "bg-gray-300"
                                }`}
                              >
                                <User
                                  className={`h-5 w-5 ${
                                    isDarkMode
                                      ? "text-gray-300"
                                      : "text-gray-600"
                                  }`}
                                />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium">
                                {emp.prenom} {emp.nom}
                              </div>
                              <div
                                className={`text-sm ${
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {emp.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{emp.email}</div>
                          <div
                            className={`text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {emp.telephone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeEmployeColor(
                              emp.typeEmploye
                            )}`}
                          >
                            {getTypeEmployeLabel(emp.typeEmploye)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{emp.departement}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              emp.statut === "actif"
                                ? isDarkMode
                                  ? "bg-green-900 text-green-300"
                                  : "bg-green-100 text-green-800"
                                : isDarkMode
                                ? "bg-red-900 text-red-300"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {emp.statut === "actif" ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openModal("view", emp)}
                              className={`${
                                isDarkMode
                                  ? "text-gray-400 hover:text-gray-200"
                                  : "text-gray-600 hover:text-gray-900"
                              } p-1`}
                              title="Voir"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openModal("edit", emp)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openModal("delete", emp)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div
              className={`relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md ${cardClasses} max-h-screen overflow-y-auto`}
            >
              <div className="mt-3">
                {/* En-tête du modal */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {modalType === "add" && "Ajouter un Employé"}
                    {modalType === "edit" && "Modifier l'Employé"}
                    {modalType === "view" && "Détails de l'Employé"}
                    {modalType === "delete" && "Confirmer la Suppression"}
                  </h3>
                  <button
                    onClick={closeModal}
                    className={`${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Contenu du modal */}
                {modalType === "delete" ? (
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <p
                      className={`mb-6 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Êtes-vous sûr de vouloir supprimer l'employé{" "}
                      <strong>
                        {selectedEmploye?.prenom} {selectedEmploye?.nom}
                      </strong>{" "}
                      ? Cette action est irréversible.
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={closeModal}
                        className={`px-4 py-2 rounded-lg ${buttonSecondaryClasses}`}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleDelete}
                        className={`px-4 py-2 rounded-lg ${buttonDangerClasses}`}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : modalType === "view" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p>
                          <strong>Code:</strong> {selectedEmploye?.code}
                        </p>
                        <p>
                          <strong>Nom:</strong> {selectedEmploye?.nom}
                        </p>
                        <p>
                          <strong>Prénom:</strong> {selectedEmploye?.prenom}
                        </p>
                        <p>
                          <strong>Email:</strong> {selectedEmploye?.email}
                        </p>
                        <p>
                          <strong>Téléphone:</strong>{" "}
                          {selectedEmploye?.telephone}
                        </p>
                        <p>
                          <strong>Type d'employé:</strong>{" "}
                          {selectedEmploye &&
                            getTypeEmployeLabel(selectedEmploye.typeEmploye)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p>
                          <strong>Date d'embauche:</strong>{" "}
                          {selectedEmploye?.dateEmbauche &&
                            new Date(
                              selectedEmploye.dateEmbauche
                            ).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Statut:</strong> {selectedEmploye?.statut}
                        </p>
                        <p>
                          <strong>Département:</strong>{" "}
                          {selectedEmploye?.departement}
                        </p>
                        <p>
                          <strong>Adresse:</strong> {selectedEmploye?.adresse}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p>
                        <strong>Responsabilités:</strong>{" "}
                        {selectedEmploye?.responsabilites}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Diplômes:</strong> {selectedEmploye?.diplomes}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Code Employé *
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.code}
                          onChange={(e) =>
                            handleInputChange("code", e.target.value)
                          }
                          disabled={modalType === "edit"}
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Type d'employé *
                        </label>
                        <select
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.typeEmploye}
                          onChange={(e) =>
                            handleInputChange(
                              "typeEmploye",
                              e.target.value as TypeEmploye
                            )
                          }
                        >
                          {TYPE_EMPLOYE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Nom *
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.nom}
                          onChange={(e) =>
                            handleInputChange("nom", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Prénom *
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.prenom}
                          onChange={(e) =>
                            handleInputChange("prenom", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Email *
                        </label>
                        <input
                          type="email"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.telephone}
                          onChange={(e) =>
                            handleInputChange("telephone", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Département
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Administration, Pédagogie..."
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.departement}
                          onChange={(e) =>
                            handleInputChange("departement", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Statut *
                        </label>
                        <select
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.statut}
                          onChange={(e) =>
                            handleInputChange(
                              "statut",
                              e.target.value as "actif" | "inactif"
                            )
                          }
                        >
                          <option value="actif">Actif</option>
                          <option value="inactif">Inactif</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Date d'embauche
                        </label>
                        <input
                          type="date"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.dateEmbauche}
                          onChange={(e) =>
                            handleInputChange("dateEmbauche", e.target.value)
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Adresse
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.adresse}
                          onChange={(e) =>
                            handleInputChange("adresse", e.target.value)
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Responsabilités
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Décrivez les principales responsabilités..."
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.responsabilites}
                          onChange={(e) =>
                            handleInputChange("responsabilites", e.target.value)
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDarkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Diplômes et qualifications
                        </label>
                        <textarea
                          rows={2}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                          value={formData.diplomes}
                          onChange={(e) =>
                            handleInputChange("diplomes", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex justify-end gap-4 mt-6">
                      <button
                        onClick={closeModal}
                        className={`px-4 py-2 rounded-lg ${buttonSecondaryClasses}`}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSubmit}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${buttonPrimaryClasses}`}
                      >
                        <Save className="h-4 w-4" />
                        {modalType === "add" ? "Ajouter" : "Modifier"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionEmployer;
