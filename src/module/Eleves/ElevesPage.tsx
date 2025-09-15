import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  UserX,
  UserCheck,
  Download,
  Users,
  Calendar,
  ChevronDown,
  MapPin,
  Building,
  GraduationCap,
} from "lucide-react";
import ReenrollmentModal from "./Reinscription/Reinscription";
import ExportModal from "./ExportModal";
import { useEleves } from "../../Context/ContextEleves";
import { useAnneeScolaire } from "../../Context/ContextAnneeScolaire";
import { Eleve, EleveFormData } from "../../types/EleveType";

// plus de données locales; tout vient du contexte Eleves

interface Props {
  isDarkMode: boolean;
}

const ElevesPage = ({ isDarkMode }: Props) => {
  const { eleves, ajouterEleve, modifierEleve, supprimerEleve, rechercherEleves, genererNouveauCode } = useEleves();
  const { currentYear } = useAnneeScolaire();
  const [filteredStudents, setFilteredStudents] =
    useState<Eleve[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSalle, setFilterSalle] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [filterBirthPlace, setFilterBirthPlace] = useState("");
  const [filterAddress, setFilterAddress] = useState("");
  const [filterPreviousSchool, setFilterPreviousSchool] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Eleve | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Eleve | null>(null);
  const [showReinscriptionModal, setShowReinscriptionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Formulaire
  const [formData, setFormData] = useState<EleveFormData>({
    code: "",
    nom: "",
    prenom: "",
    date_naissance: "",
    lieu_naissance: "",
    sexe: "M",
    adresse_actuelle: "",
    telephone_parents: "",
    adresse_parents: "",
    nif_parents: "",
    moyenne_generale: 0,
    etablissement_precedent: "",
    statut: "actif",
    date_inscription: "",
    observations: "",
    photo_url: "",
    annee_scolaire_id: "",
    classe_id: "",
    salle_id: "",
  });

  // Classes et salles depuis l'année scolaire courante
  const classes = useMemo(
    () =>
      currentYear?.classes.map((classe) => ({
        value: classe.id,
        label: classe.name,
      })) || [],
    [currentYear?.classes]
  ) as { value: string; label: string }[];

  const sallesByClass: Record<string, { value: string; label: string }[]> =
    useMemo(() => {
      const result: Record<string, { value: string; label: string }[]> = {};
      currentYear?.classes.forEach((classe) => {
        result[classe.id] = classe.salles.map((salle) => ({
          value: salle.id,
          label: `${salle.name}`,
        }));
      });
      return result;
    }, [currentYear?.classes]);

  const getClasseName = (classeId?: string) =>
    classes.find((c) => c.value === classeId)?.label || classeId || "";
  const getSalleName = (classeId?: string, salleId?: string) => {
    if (!classeId || !salleId) return salleId || "";
    return sallesByClass[classeId]?.find((s) => s.value === salleId)?.label || salleId;
  };

  // Fonction pour calculer l'âge
  const calculateAge = (dateNaissance: string) => {
    const today = new Date();
    const birth = new Date(dateNaissance);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Effet pour filtrer les étudiants
  useEffect(() => {
    let filtered = searchTerm ? rechercherEleves(searchTerm) : eleves;

    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterClass) {
      filtered = filtered.filter((student) => student.classe_id === filterClass);
    }

    if (filterSalle) {
      filtered = filtered.filter((student) => student.salle_id === filterSalle);
    }

    if (filterGender) {
      filtered = filtered.filter((student) => student.sexe === filterGender);
    }

    if (filterStatus) {
      filtered = filtered.filter((student) => student.statut === filterStatus as any);
    }

    if (filterAge) {
      filtered = filtered.filter((student: Eleve) => {
        const age = calculateAge(student.date_naissance);
        const ageRange = filterAge.split("-");
        if (ageRange.length === 2) {
          return age >= parseInt(ageRange[0]) && age <= parseInt(ageRange[1]);
        }
        return age.toString() === filterAge;
      });
    }

    if (filterBirthPlace) {
      filtered = filtered.filter((student: Eleve) =>
        student.lieu_naissance
          .toLowerCase()
          .includes(filterBirthPlace.toLowerCase())
      );
    }

    if (filterAddress) {
      filtered = filtered.filter((student: Eleve) =>
        student.adresse_actuelle
          .toLowerCase()
          .includes(filterAddress.toLowerCase())
      );
    }

    if (filterPreviousSchool) {
      filtered = filtered.filter((student: Eleve) =>
        student.etablissement_precedent
          .toLowerCase()
          .includes(filterPreviousSchool.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [
    eleves,
    searchTerm,
    filterClass,
    filterSalle,
    filterGender,
    filterStatus,
    filterAge,
    filterBirthPlace,
    filterAddress,
    filterPreviousSchool,
  ]);

  // Gestion du formulaire
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target as { name: keyof EleveFormData; value: string };
    setFormData((prev) => {
      const next = {
      ...prev,
      [name]: name === "moyenne_generale" ? (parseFloat(value) as any) || 0 : (value as any),
      } as EleveFormData;
      // Si la classe change, réinitialiser la salle
      if (name === "classe_id") {
        next.salle_id = "" as any;
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!currentYear) {
      alert("Veuillez d'abord sélectionner une année scolaire");
      return;
    }
    const payload: EleveFormData = { ...formData, annee_scolaire_id: currentYear.id };
    if (!payload.code) payload.code = await genererNouveauCode();
    if (editingStudent) await modifierEleve(editingStudent.id, payload);
    else await ajouterEleve(payload);
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      nom: "",
      prenom: "",
      date_naissance: "",
      lieu_naissance: "",
      sexe: "M",
      adresse_actuelle: "",
      telephone_parents: "",
      adresse_parents: "",
      nif_parents: "",
      moyenne_generale: 0,
      etablissement_precedent: "",
      statut: "actif",
      date_inscription: "",
      observations: "",
      photo_url: "",
      annee_scolaire_id: "",
      classe_id: "",
      salle_id: "",
    });
    setEditingStudent(null);
    setShowForm(false);
  };

  // Actions sur les étudiants
  const changeStudentStatus = async (
    studentId: string,
    newStatus: "actif" | "inactif" | "suspendu"
  ) => {
    await modifierEleve(studentId, { statut: newStatus } as any);
  };

  const deleteStudent = async (studentId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet élève ?")) {
      await supprimerEleve(studentId);
    }
  };

  const editStudent = (student: Eleve) => {
    setEditingStudent(student);
    setFormData({
      code: student.code,
      nom: student.nom,
      prenom: student.prenom,
      date_naissance: student.date_naissance,
      lieu_naissance: student.lieu_naissance,
      sexe: student.sexe,
      adresse_actuelle: student.adresse_actuelle,
      telephone_parents: student.telephone_parents,
      adresse_parents: student.adresse_parents,
      nif_parents: student.nif_parents,
      moyenne_generale: student.moyenne_generale,
      etablissement_precedent: student.etablissement_precedent,
      statut: student.statut,
      date_inscription: student.date_inscription,
      observations: student.observations || "",
      photo_url: student.photo_url || "",
      annee_scolaire_id: student.annee_scolaire_id,
      classe_id: student.classe_id,
      salle_id: student.salle_id,
    });
    setShowForm(true);
  };

  // Statistiques
  const stats = {
    total: eleves.length,
    actifs: eleves.filter((s: Eleve) => s.statut === "actif").length,
    inactifs: eleves.filter((s: Eleve) => s.statut === "inactif").length,
    suspendus: eleves.filter((s: Eleve) => s.statut === "suspendu").length,
    moyenneGenerale:
      eleves.reduce((acc: number, s: Eleve) => acc + (s.moyenne_generale || 0), 0) /
        (eleves.length || 1),
  };

  const getStatusColor = (status: string) => {
    if (isDarkMode) {
      switch (status) {
        case "actif":
          return "bg-green-900 text-green-200";
        case "inactif":
          return "bg-gray-700 text-gray-300";
        case "suspendu":
          return "bg-red-900 text-red-200";
        default:
          return "bg-gray-700 text-gray-300";
      }
    } else {
      switch (status) {
        case "actif":
          return "bg-green-100 text-green-800";
        case "inactif":
          return "bg-gray-100 text-gray-800";
        case "suspendu":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    }
  };

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

  return (
    <div className={`${baseClasses} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion des Élèves</h1>
          <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
            Système de gestion complète des élèves de l'établissement
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Total Élèves
                </p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Actifs
                </p>
                <p className="text-2xl font-semibold">{stats.actifs}</p>
              </div>
            </div>
          </div>
          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Suspendus
                </p>
                <p className="text-2xl font-semibold">{stats.suspendus}</p>
              </div>
            </div>
          </div>
          <div className={`${cardClasses} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Inactifs
                </p>
                <p className="text-2xl font-semibold">{stats.inactifs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'actions et filtres */}
        <div className={`${cardClasses} p-6 rounded-lg shadow-sm border mb-6`}>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
            <button
              onClick={() => setShowForm(true)}
              className={`${buttonPrimaryClasses} px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
            >
              <Plus className="h-4 w-4" />
              Ajouter un élève
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setShowReinscriptionModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <GraduationCap className="h-4 w-4" />
                Réinscription
              </button>
              <button 
                onClick={() => setShowExportModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className={`w-full pl-10 pr-3 mb-5 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Filtres de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <select
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">Toutes les classes</option>
              {classes.map((classe) => (
                <option key={classe.value} value={classe.value}>
                  {classe.label}
                </option>
              ))}
            </select>

            <select
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
              value={filterSalle}
              onChange={(e) => setFilterSalle(e.target.value)}
            >
              <option value="">Toutes les salles</option>
              {filterClass && sallesByClass[filterClass]
                ? sallesByClass[filterClass].map((salle) => (
                    <option key={salle.value} value={salle.value}>
                      {salle.label}
                    </option>
                  ))
                : Object.values(sallesByClass)
                    .flat()
                    .map((salle) => (
                      <option key={salle.value} value={salle.value}>
                        {salle.label}
                      </option>
                    ))}
            </select>

            <select
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
            >
              <option value="">Tous les sexes</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>

            <select
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="suspendu">Suspendu</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 flex items-center gap-2 ${inputClasses} hover:bg-opacity-80`}
            >
              <Filter className="h-4 w-4" />
              Filtres avancés
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showAdvancedFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Filtres avancés */}
          {showAdvancedFilters && (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-t ${
                isDarkMode ? "border-gray-600" : "border-gray-200"
              }`}
            >
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Tranche d'âge
                </label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={filterAge}
                  onChange={(e) => setFilterAge(e.target.value)}
                >
                  <option value="">Tous les âges</option>
                  <option value="12-14">12-14 ans</option>
                  <option value="15-17">15-17 ans</option>
                  <option value="18-20">18-20 ans</option>
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Lieu de naissance
                </label>
                <input
                  type="text"
                  placeholder="Port-au-Prince, Cap-Haïtien..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={filterBirthPlace}
                  onChange={(e) => setFilterBirthPlace(e.target.value)}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Adresse actuelle
                </label>
                <input
                  type="text"
                  placeholder="Delmas, Pétion-Ville..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={filterAddress}
                  onChange={(e) => setFilterAddress(e.target.value)}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  École précédente
                </label>
                <input
                  type="text"
                  placeholder="École Saint-Joseph..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                  value={filterPreviousSchool}
                  onChange={(e) => setFilterPreviousSchool(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Liste des élèves */}
        <div
          className={`${cardClasses} rounded-lg shadow-sm border overflow-hidden`}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Code
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Élève
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Classe/Salle
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Lieu
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Statut
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDarkMode
                    ? "bg-gray-800 divide-gray-700"
                    : "bg-white divide-gray-200"
                }`}
              >
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {student.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium">
                          {student.prenom} {student.nom}
                        </div>
                        <div
                          className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {student.sexe === "M" ? "Masculin" : "Féminin"} • Âge:{" "}
                          {calculateAge(student.date_naissance)} ans
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium">
                          {getClasseName(student.classe_id)}
                        </div>
                        <div
                          className={`${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Salle: {getSalleName(student.classe_id, student.salle_id)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">
                            {student.lieu_naissance}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Building className="h-3 w-3" />
                          <span
                            className={`text-xs ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {student.adresse_actuelle.length > 20
                              ? student.adresse_actuelle.substring(0, 20) + "..."
                              : student.adresse_actuelle}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          student.statut
                        )}`}
                      >
                        {student.statut.charAt(0).toUpperCase() +
                          student.statut.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-400 transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => editStudent(student)}
                          className={`transition-colors ${
                            isDarkMode
                              ? "text-gray-400 hover:text-gray-200"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {student.statut === "actif" ? (
                          <button
                            onClick={() =>
                              changeStudentStatus(student.id, "suspendu")
                            }
                            className="text-orange-600 hover:text-orange-400 transition-colors"
                            title="Suspendre"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              changeStudentStatus(student.id, "actif")
                            }
                            className="text-green-600 hover:text-green-400 transition-colors"
                            title="Activer"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteStudent(student.id)}
                          className="text-red-600 hover:text-red-400 transition-colors"
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
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              Aucun élève trouvé selon vos critères de recherche.
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`${cardClasses} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Détails de l'élève</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className={`hover:text-red-500 transition-colors ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Code
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.code}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Nom complet
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.prenom} {selectedStudent.nom}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Date de naissance
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.date_naissance} (
                    {calculateAge(selectedStudent.date_naissance)} ans)
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Lieu de naissance
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.lieu_naissance}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Sexe
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.sexe === "M" ? "Masculin" : "Féminin"}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Classe / Salle
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {getClasseName(selectedStudent.classe_id)} - {getSalleName(
                      selectedStudent.classe_id,
                      selectedStudent.salle_id
                    )}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Adresse actuelle
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.adresse_actuelle}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Téléphone parents
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.telephone_parents}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    NIF parents
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.nif_parents}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Adresse parents
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.adresse_parents}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Moyenne générale
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.moyenne_generale}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Établissement précédent
                  </label>
                  <p
                    className={`text-sm p-2 rounded ${
                      isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    {selectedStudent.etablissement_precedent}
                  </p>
                </div>
                {selectedStudent.observations && (
                  <div className="md:col-span-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Observations
                    </label>
                    <p
                      className={`text-sm p-2 rounded ${
                        isDarkMode
                          ? "bg-gray-700 text-white"
                          : "bg-gray-50 text-gray-900"
                      }`}
                    >
                      {selectedStudent.observations}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout/modification */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60  bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`${cardClasses} rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingStudent
                    ? "Modifier l'élève"
                    : "Ajouter un nouvel élève"}
                </h2>
                <button
                  type="button"
                  onClick={resetForm}
                  className={`hover:text-red-500 transition-colors ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.code}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Sexe *
                  </label>
                  <select
                    name="sexe"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.sexe}
                    onChange={handleInputChange}
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
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
                    name="nom"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.nom}
                    onChange={handleInputChange}
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
                    name="prenom"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.prenom}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Date de naissance *
                  </label>
                  <input
                    type="date"
                    name="date_naissance"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.date_naissance}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Lieu de naissance *
                  </label>
                  <input
                    type="text"
                    name="lieu_naissance"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.lieu_naissance}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Adresse actuelle *
                  </label>
                  <input
                    type="text"
                    name="adresse_actuelle"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.adresse_actuelle}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Téléphone parents/tuteurs *
                  </label>
                  <input
                    type="tel"
                    name="telephone_parents"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.telephone_parents}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    NIF parent/tuteur *
                  </label>
                  <input
                    type="text"
                    name="nif_parents"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.nif_parents}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Adresse parent/tuteur *
                  </label>
                  <input
                    type="text"
                    name="adresse_parents"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.adresse_parents}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Classe *
                  </label>
                  <select
                    name="classe_id"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.classe_id}
                    onChange={handleInputChange}
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes.map((classe) => (
                      <option key={classe.value} value={classe.value}>
                        {classe.label}
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
                    Salle *
                  </label>
                  <select
                    name="salle_id"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.salle_id}
                    onChange={handleInputChange}
                    disabled={!formData.classe_id}
                  >
                    <option value="">Sélectionner une salle</option>
                    {formData.classe_id &&
                    sallesByClass[formData.classe_id]
                      ? sallesByClass[formData.classe_id].map((salle) => (
                          <option key={salle.value} value={salle.value}>
                            {salle.label}
                          </option>
                        ))
                      : Object.values(sallesByClass)
                          .flat()
                          .map((salle) => (
                            <option key={salle.value} value={salle.value}>
                              {salle.label}
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
                    Moyenne générale *
                  </label>
                  <input
                    type="number"
                    name="moyenne_generale"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.moyenne_generale}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Établissement précédent *
                  </label>
                  <input
                    type="text"
                    name="etablissement_precedent"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.etablissement_precedent}
                    onChange={handleInputChange}
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
                    name="statut"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.statut}
                    onChange={handleInputChange}
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="suspendu">Suspendu</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Observations
                  </label>
                  <textarea
                    name="observations"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.observations}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? "text-gray-300 bg-gray-700 hover:bg-gray-600"
                      : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className={`px-4 py-2 rounded-lg transition-colors ${buttonPrimaryClasses}`}
                >
                  {editingStudent ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReenrollmentModal
        isOpen={showReinscriptionModal}
        onClose={() => setShowReinscriptionModal(false)}
        isDarkMode={isDarkMode}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        students={eleves.map((e) => ({
          id: e.id,
          code: e.code,
          nom: e.nom,
          prenom: e.prenom,
          dateNaissance: e.date_naissance,
          lieuNaissance: e.lieu_naissance,
          sexe: e.sexe,
          adresseActuelle: e.adresse_actuelle,
          telephoneParents: e.telephone_parents,
          adresseParents: e.adresse_parents,
          nifParents: e.nif_parents,
          classesDemandee: e.classe_id,
          salle: e.salle_id,
          moyenneGenerale: e.moyenne_generale,
          etablissementPrecedent: e.etablissement_precedent,
          status: e.statut,
          dateInscription: e.date_inscription,
          observations: e.observations,
          photoUrl: e.photo_url,
        }))}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default ElevesPage;
