import React, { useState, useEffect } from "react";
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

// Types TypeScript
interface Student {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  sexe: "M" | "F";
  adresseActuelle: string;
  telephoneParents: string;
  adresseParents: string;
  nifParents: string;
  classesDemandee: string;
  salle: string;
  moyenneGenerale: number;
  etablissementPrecedent: string;
  status: "actif" | "inactif" | "suspendu";
  dateInscription: string;
  observations?: string;
  photoUrl?: string;
}

// Données d'exemple
const sampleStudents: Student[] = [
  {
    id: "1",
    code: "ETU001",
    nom: "Duval",
    prenom: "Marie",
    dateNaissance: "2008-05-15",
    lieuNaissance: "Port-au-Prince",
    sexe: "F",
    adresseActuelle: "123 Rue Delmas, Port-au-Prince",
    telephoneParents: "+509 3456-7890",
    adresseParents: "123 Rue Delmas, Port-au-Prince",
    nifParents: "12345678901",
    classesDemandee: "9ème AF",
    salle: "9eA",
    moyenneGenerale: 85.5,
    etablissementPrecedent: "École Saint-Joseph",
    status: "actif",
    dateInscription: "2024-09-01",
    observations: "Excellente élève, très motivée",
  },
  {
    id: "2",
    code: "ETU002",
    nom: "Jean-Baptiste",
    prenom: "Pierre",
    dateNaissance: "2009-03-22",
    lieuNaissance: "Cap-Haïtien",
    sexe: "M",
    adresseActuelle: "456 Avenue Jean-Jacques Dessalines",
    telephoneParents: "+509 2345-6789",
    adresseParents: "456 Avenue Jean-Jacques Dessalines",
    nifParents: "98765432101",
    classesDemandee: "8ème AF",
    salle: "8eB",
    moyenneGenerale: 78.2,
    etablissementPrecedent: "Collège Notre-Dame",
    status: "actif",
    dateInscription: "2024-09-01",
  },
  {
    id: "3",
    code: "ETU003",
    nom: "Charles",
    prenom: "Anne",
    dateNaissance: "2007-11-08",
    lieuNaissance: "Gonaïves",
    sexe: "F",
    adresseActuelle: "789 Rue Capois, Pétion-Ville",
    telephoneParents: "+509 4567-8901",
    adresseParents: "789 Rue Capois, Pétion-Ville",
    nifParents: "11223344556",
    classesDemandee: "Terminale",
    salle: "TermA",
    moyenneGenerale: 92.1,
    etablissementPrecedent: "Lycée Alexandre Pétion",
    status: "suspendu",
    dateInscription: "2023-09-01",
    observations: "Suspendu temporairement pour absence répétée",
  },
  {
    id: "4",
    code: "ETU004",
    nom: "Moreau",
    prenom: "Jean",
    dateNaissance: "2009-01-12",
    lieuNaissance: "Les Cayes",
    sexe: "M",
    adresseActuelle: "321 Route de Frères, Carrefour",
    telephoneParents: "+509 5678-9012",
    adresseParents: "321 Route de Frères, Carrefour",
    nifParents: "22334455667",
    classesDemandee: "7ème AF",
    salle: "7eA",
    moyenneGenerale: 72.8,
    etablissementPrecedent: "École Nationale des Cayes",
    status: "actif",
    dateInscription: "2024-09-01",
    observations: "Bon comportement, besoin d'améliorer en mathématiques",
  },
];

interface Props {
  isDarkMode: boolean;
}

const ElevesPage = ({ isDarkMode }: Props) => {
  const [students, setStudents] = useState<Student[]>(sampleStudents);
  const [filteredStudents, setFilteredStudents] =
    useState<Student[]>(sampleStudents);
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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showReinscriptionModal, setShowReinscriptionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Formulaire
  const [formData, setFormData] = useState<Partial<Student>>({
    code: "",
    nom: "",
    prenom: "",
    dateNaissance: "",
    lieuNaissance: "",
    sexe: "M",
    adresseActuelle: "",
    telephoneParents: "",
    adresseParents: "",
    nifParents: "",
    classesDemandee: "",
    salle: "",
    moyenneGenerale: 0,
    etablissementPrecedent: "",
    status: "actif",
    observations: "",
  });

  // Classes et salles disponibles
  const classes = [
    "6ème AF",
    "7ème AF",
    "8ème AF",
    "9ème AF",
    "Seconde",
    "Première",
    "Terminale",
  ];

  const sallesByClass: { [key: string]: string[] } = {
    "6ème AF": ["6eA", "6eB"],
    "7ème AF": ["7eA", "7eB", "7eC"],
    "8ème AF": ["8eA", "8eB"],
    "9ème AF": ["9eA", "9eB", "9eC"],
    Seconde: ["2ndA", "2ndB"],
    Première: ["1ereA", "1ereB"],
    Terminale: ["TermA", "TermB"],
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
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterClass) {
      filtered = filtered.filter(
        (student) => student.classesDemandee === filterClass
      );
    }

    if (filterSalle) {
      filtered = filtered.filter((student) => student.salle === filterSalle);
    }

    if (filterGender) {
      filtered = filtered.filter((student) => student.sexe === filterGender);
    }

    if (filterStatus) {
      filtered = filtered.filter((student) => student.status === filterStatus);
    }

    if (filterAge) {
      filtered = filtered.filter((student) => {
        const age = calculateAge(student.dateNaissance);
        const ageRange = filterAge.split("-");
        if (ageRange.length === 2) {
          return age >= parseInt(ageRange[0]) && age <= parseInt(ageRange[1]);
        }
        return age.toString() === filterAge;
      });
    }

    if (filterBirthPlace) {
      filtered = filtered.filter((student) =>
        student.lieuNaissance
          .toLowerCase()
          .includes(filterBirthPlace.toLowerCase())
      );
    }

    if (filterAddress) {
      filtered = filtered.filter((student) =>
        student.adresseActuelle
          .toLowerCase()
          .includes(filterAddress.toLowerCase())
      );
    }

    if (filterPreviousSchool) {
      filtered = filtered.filter((student) =>
        student.etablissementPrecedent
          .toLowerCase()
          .includes(filterPreviousSchool.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [
    students,
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "moyenneGenerale" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = () => {
    if (editingStudent) {
      setStudents((prev) =>
        prev.map((student) =>
          student.id === editingStudent.id
            ? ({ ...student, ...formData } as Student)
            : student
        )
      );
    } else {
      const newStudent: Student = {
        ...(formData as Student),
        id: Date.now().toString(),
        dateInscription: new Date().toISOString().split("T")[0],
      };
      setStudents((prev) => [...prev, newStudent]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: "",
      nom: "",
      prenom: "",
      dateNaissance: "",
      lieuNaissance: "",
      sexe: "M",
      adresseActuelle: "",
      telephoneParents: "",
      adresseParents: "",
      nifParents: "",
      classesDemandee: "",
      salle: "",
      moyenneGenerale: 0,
      etablissementPrecedent: "",
      status: "actif",
      observations: "",
    });
    setEditingStudent(null);
    setShowForm(false);
  };

  // Actions sur les étudiants
  const changeStudentStatus = (
    studentId: string,
    newStatus: "actif" | "inactif" | "suspendu"
  ) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, status: newStatus } : student
      )
    );
  };

  const deleteStudent = (studentId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet élève ?")) {
      setStudents((prev) => prev.filter((student) => student.id !== studentId));
    }
  };

  const editStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData(student);
    setShowForm(true);
  };

  // Statistiques
  const stats = {
    total: students.length,
    actifs: students.filter((s) => s.status === "actif").length,
    inactifs: students.filter((s) => s.status === "inactif").length,
    suspendus: students.filter((s) => s.status === "suspendu").length,
    moyenneGenerale:
      students.reduce((acc, s) => acc + s.moyenneGenerale, 0) /
        students.length || 0,
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
                <option key={classe} value={classe}>
                  {classe}
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
                    <option key={salle} value={salle}>
                      {salle}
                    </option>
                  ))
                : Object.values(sallesByClass)
                    .flat()
                    .map((salle) => (
                      <option key={salle} value={salle}>
                        {salle}
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
                          {calculateAge(student.dateNaissance)} ans
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium">
                          {student.classesDemandee}
                        </div>
                        <div
                          className={`${
                            isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Salle: {student.salle}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">
                            {student.lieuNaissance}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Building className="h-3 w-3" />
                          <span
                            className={`text-xs ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {student.adresseActuelle.length > 20
                              ? student.adresseActuelle.substring(0, 20) + "..."
                              : student.adresseActuelle}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          student.status
                        )}`}
                      >
                        {student.status.charAt(0).toUpperCase() +
                          student.status.slice(1)}
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
                        {student.status === "actif" ? (
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
                    {selectedStudent.dateNaissance} (
                    {calculateAge(selectedStudent.dateNaissance)} ans)
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
                    {selectedStudent.lieuNaissance}
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
                    {selectedStudent.classesDemandee} - {selectedStudent.salle}
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
                    {selectedStudent.adresseActuelle}
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
                    {selectedStudent.telephoneParents}
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
                    {selectedStudent.nifParents}
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
                    {selectedStudent.adresseParents}
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
                    {selectedStudent.moyenneGenerale}
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
                    {selectedStudent.etablissementPrecedent}
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
                    name="dateNaissance"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.dateNaissance}
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
                    name="lieuNaissance"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.lieuNaissance}
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
                    name="adresseActuelle"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.adresseActuelle}
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
                    name="telephoneParents"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.telephoneParents}
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
                    name="nifParents"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.nifParents}
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
                    name="adresseParents"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.adresseParents}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Classe demandée *
                  </label>
                  <select
                    name="classesDemandee"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.classesDemandee}
                    onChange={handleInputChange}
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes.map((classe) => (
                      <option key={classe} value={classe}>
                        {classe}
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
                    name="salle"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.salle}
                    onChange={handleInputChange}
                  >
                    <option value="">Sélectionner une salle</option>
                    {formData.classesDemandee &&
                    sallesByClass[formData.classesDemandee]
                      ? sallesByClass[formData.classesDemandee].map((salle) => (
                          <option key={salle} value={salle}>
                            {salle}
                          </option>
                        ))
                      : Object.values(sallesByClass)
                          .flat()
                          .map((salle) => (
                            <option key={salle} value={salle}>
                              {salle}
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
                    name="moyenneGenerale"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.moyenneGenerale}
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
                    name="etablissementPrecedent"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.etablissementPrecedent}
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
                    name="status"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${inputClasses}`}
                    value={formData.status}
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
        students={students}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default ElevesPage;
