"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  GraduationCap,
  Building,
  TrendingUp,
  UserCheck,
  UserX,
  Award,
  Calendar,
  Clock,
  X,
  Download,
  Eye,
  Filter,
  ChevronDown,
  ChevronRight,
  BookOpen,
  DollarSign,
  FileText,
  Activity,
  History,
  Moon,
  Sun,
  Printer,
  Search,
  Star,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

// Types étendus
interface Student {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  classesDemandee: string;
  salle: string;
  status: "actif" | "inactif" | "suspendu" | "expulse" | "redouble";
  dateInscription: string;
  moyenneGenerale: number;
  etablissementPrecedent: string;
  sexe: "M" | "F";
  fraisScolarite: number;
  fraisPayes: number;
  moyenneT1?: number;
  moyenneT2?: number;
  moyenneT3?: number;
}

interface Employe {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  typeEmploye: string;
  departement: string;
  statut: "actif" | "inactif";
  dateEmbauche: string;
  classesAssignees: string[];
  sallesAssignees: string[];
  matieresEnseignees: string[];
}

interface Paiement {
  id: string;
  studentId: string;
  trimestre: "T1" | "T2" | "T3";
  montantDu: number;
  montantPaye: number;
  datePaiement: string;
  statut: "complet" | "partiel" | "en_attente";
}

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  date: string;
  heure: string;
  details: string;
  typeAction:
    | "connexion"
    | "modification"
    | "ajout"
    | "suppression"
    | "consultation";
}

interface Props {
  darkMode: boolean;
}

// Données d'exemple étendues
const sampleStudents: Student[] = [
  {
    id: "1",
    code: "ETU001",
    nom: "Duval",
    prenom: "Marie",
    classesDemandee: "9ème AF",
    salle: "9eA",
    status: "actif",
    dateInscription: "2024-09-01",
    moyenneGenerale: 95.5,
    etablissementPrecedent: "École Saint-Joseph",
    sexe: "F",
    fraisScolarite: 50000,
    fraisPayes: 50000,
    moyenneT1: 94.0,
    moyenneT2: 96.0,
    moyenneT3: 96.5,
  },
  {
    id: "2",
    code: "ETU002",
    nom: "Jean-Baptiste",
    prenom: "Pierre",
    classesDemandee: "9ème AF",
    salle: "9eB",
    status: "actif",
    dateInscription: "2024-09-01",
    moyenneGenerale: 92.8,
    etablissementPrecedent: "Collège Notre-Dame",
    sexe: "M",
    fraisScolarite: 50000,
    fraisPayes: 35000,
    moyenneT1: 91.0,
    moyenneT2: 93.5,
    moyenneT3: 94.0,
  },
  {
    id: "3",
    code: "ETU003",
    nom: "Pierre",
    prenom: "Sophie",
    classesDemandee: "9ème AF",
    salle: "9eA",
    status: "actif",
    dateInscription: "2024-09-01",
    moyenneGenerale: 89.1,
    etablissementPrecedent: "École Privée",
    sexe: "F",
    fraisScolarite: 50000,
    fraisPayes: 50000,
    moyenneT1: 88.0,
    moyenneT2: 89.0,
    moyenneT3: 90.5,
  },
  {
    id: "4",
    code: "ETU004",
    nom: "Charles",
    prenom: "Anne",
    classesDemandee: "7ème AF",
    salle: "7eA",
    status: "redouble",
    dateInscription: "2023-09-01",
    moyenneGenerale: 45.2,
    etablissementPrecedent: "École Primaire",
    sexe: "F",
    fraisScolarite: 45000,
    fraisPayes: 20000,
    moyenneT1: 42.0,
    moyenneT2: 46.0,
    moyenneT3: 48.0,
  },
  {
    id: "5",
    code: "ETU005",
    nom: "Moreau",
    prenom: "Jean",
    classesDemandee: "8ème AF",
    salle: "8eA",
    status: "expulse",
    dateInscription: "2024-09-01",
    moyenneGenerale: 35.8,
    etablissementPrecedent: "École Publique",
    sexe: "M",
    fraisScolarite: 48000,
    fraisPayes: 15000,
    moyenneT1: 38.0,
    moyenneT2: 34.0,
    moyenneT3: 35.5,
  },
  {
    id: "6",
    code: "ETU006",
    nom: "Laurent",
    prenom: "Julie",
    classesDemandee: "8ème AF",
    salle: "8eA",
    status: "actif",
    dateInscription: "2024-09-01",
    moyenneGenerale: 78.4,
    etablissementPrecedent: "École Mixte",
    sexe: "F",
    fraisScolarite: 48000,
    fraisPayes: 48000,
    moyenneT1: 76.0,
    moyenneT2: 79.0,
    moyenneT3: 80.0,
  },
];

const sampleEmployes: Employe[] = [
  {
    id: "1",
    code: "EMP001",
    nom: "Dupont",
    prenom: "Jean",
    typeEmploye: "directeur",
    departement: "Direction",
    statut: "actif",
    dateEmbauche: "2020-09-01",
    classesAssignees: [],
    sallesAssignees: [],
    matieresEnseignees: [],
  },
  {
    id: "2",
    code: "EMP002",
    nom: "Martin",
    prenom: "Marie",
    typeEmploye: "professeur",
    departement: "Sciences",
    statut: "actif",
    dateEmbauche: "2019-08-15",
    classesAssignees: ["9ème AF", "8ème AF"],
    sallesAssignees: ["9eA", "9eB", "8eA"],
    matieresEnseignees: ["Mathématiques", "Physique"],
  },
  {
    id: "3",
    code: "EMP003",
    nom: "Bernard",
    prenom: "Pierre",
    typeEmploye: "professeur",
    departement: "Lettres",
    statut: "actif",
    dateEmbauche: "2021-01-10",
    classesAssignees: ["9ème AF", "7ème AF"],
    sallesAssignees: ["9eA", "9eB", "7eA"],
    matieresEnseignees: ["Français", "Histoire"],
  },
  {
    id: "4",
    code: "EMP004",
    nom: "Leroy",
    prenom: "Sophie",
    typeEmploye: "professeur",
    departement: "Sciences",
    statut: "actif",
    dateEmbauche: "2022-03-01",
    classesAssignees: ["8ème AF", "7ème AF"],
    sallesAssignees: ["8eA", "7eA"],
    matieresEnseignees: ["Biologie", "Chimie"],
  },
  {
    id: "5",
    code: "EMP005",
    nom: "Dubois",
    prenom: "Paul",
    typeEmploye: "professeur",
    departement: "Langues",
    statut: "actif",
    dateEmbauche: "2020-09-01",
    classesAssignees: ["9ème AF", "8ème AF", "7ème AF"],
    sallesAssignees: ["9eA", "9eB", "8eA", "7eA"],
    matieresEnseignees: ["Anglais", "Espagnol"],
  },
];

const samplePaiements: Paiement[] = [
  {
    id: "1",
    studentId: "1",
    trimestre: "T1",
    montantDu: 16667,
    montantPaye: 16667,
    datePaiement: "2024-10-15",
    statut: "complet",
  },
  {
    id: "2",
    studentId: "1",
    trimestre: "T2",
    montantDu: 16667,
    montantPaye: 16667,
    datePaiement: "2024-01-15",
    statut: "complet",
  },
  {
    id: "3",
    studentId: "1",
    trimestre: "T3",
    montantDu: 16666,
    montantPaye: 16666,
    datePaiement: "2024-04-15",
    statut: "complet",
  },
  {
    id: "4",
    studentId: "2",
    trimestre: "T1",
    montantDu: 16667,
    montantPaye: 16667,
    datePaiement: "2024-10-20",
    statut: "complet",
  },
  {
    id: "5",
    studentId: "2",
    trimestre: "T2",
    montantDu: 16667,
    montantPaye: 10000,
    datePaiement: "2024-01-20",
    statut: "partiel",
  },
  {
    id: "6",
    studentId: "2",
    trimestre: "T3",
    montantDu: 16666,
    montantPaye: 8333,
    datePaiement: "2024-04-20",
    statut: "partiel",
  },
];

const sampleUserActivities: UserActivity[] = [
  {
    id: "1",
    userId: "user1",
    userName: "Admin Principal",
    action: "Connexion au système",
    module: "Système",
    date: "2024-12-19",
    heure: "08:30:15",
    details: "Connexion réussie depuis l'adresse IP 192.168.1.100",
    typeAction: "connexion",
  },
  {
    id: "2",
    userId: "user2",
    userName: "Marie Martin",
    action: "Ajout d'un nouvel élève",
    module: "Gestion Élèves",
    date: "2024-12-19",
    heure: "09:15:22",
    details: "Ajout de l'élève Duval Marie (ETU001)",
    typeAction: "ajout",
  },
  {
    id: "3",
    userId: "user1",
    userName: "Admin Principal",
    action: "Modification des notes",
    module: "Notes et Évaluations",
    date: "2024-12-19",
    heure: "10:45:10",
    details: "Modification notes trimestre T2 pour Pierre Sophie",
    typeAction: "modification",
  },
  {
    id: "4",
    userId: "user3",
    userName: "Pierre Bernard",
    action: "Consultation des rapports",
    module: "Rapports",
    date: "2024-12-19",
    heure: "11:20:33",
    details: "Consultation rapport classe 9ème AF",
    typeAction: "consultation",
  },
  {
    id: "5",
    userId: "user2",
    userName: "Marie Martin",
    action: "Déconnexion",
    module: "Système",
    date: "2024-12-18",
    heure: "16:45:18",
    details: "Déconnexion normale du système",
    typeAction: "connexion",
  },
  {
    id: "6",
    userId: "user4",
    userName: "Sophie Leroy",
    action: "Connexion au système",
    module: "Système",
    date: "2024-12-18",
    heure: "07:15:30",
    details: "Connexion réussie depuis l'adresse IP 192.168.1.105",
    typeAction: "connexion",
  },
];

const Rapport = ({ darkMode }: Props) => {
  const [activeSection, setActiveSection] = useState("eleves");
  const [showTracability, setShowTracability] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2024-2025");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("tous");
  const [filterClasse, setFilterClasse] = useState("toutes");
  const [showFilters, setShowFilters] = useState(false);

  // Calculs statistiques
  const totalStudents = sampleStudents.length;
  const activeStudents = sampleStudents.filter(
    (s) => s.status === "actif"
  ).length;
  const reussitStudents = sampleStudents.filter(
    (s) => s.moyenneGenerale >= 60
  ).length;
  const echoueStudents = sampleStudents.filter(
    (s) => s.moyenneGenerale < 60 && s.status !== "expulse"
  ).length;
  const redoubleStudents = sampleStudents.filter(
    (s) => s.status === "redouble"
  ).length;
  const expulseStudents = sampleStudents.filter(
    (s) => s.status === "expulse"
  ).length;

  // Top 3 lauréats
  const laureats = sampleStudents
    .filter((s) => s.status === "actif" && s.moyenneGenerale >= 60)
    .sort((a, b) => b.moyenneGenerale - a.moyenneGenerale)
    .slice(0, 3);

  // Statistiques par classe et salle
  const statsByClass = sampleStudents.reduce((acc, student) => {
    const classe = student.classesDemandee;
    if (!acc[classe]) {
      acc[classe] = {
        total: 0,
        actifs: 0,
        reussit: 0,
        echoue: 0,
        salles: new Set(),
        professeurs: new Set(),
      };
    }
    acc[classe].total++;
    if (student.status === "actif") acc[classe].actifs++;
    if (student.moyenneGenerale >= 60) acc[classe].reussit++;
    else acc[classe].echoue++;
    acc[classe].salles.add(student.salle);
    return acc;
  }, {} as Record<string, any>);

  // Professeurs par classe
  sampleEmployes.forEach((emp) => {
    if (emp.typeEmploye === "professeur") {
      emp.classesAssignees.forEach((classe) => {
        if (statsByClass[classe]) {
          statsByClass[classe].professeurs.add(`${emp.prenom} ${emp.nom}`);
        }
      });
    }
  });

  // Statistiques de paiements
  const paiementStats = {
    T1: { du: 0, paye: 0, enAttente: 0 },
    T2: { du: 0, paye: 0, enAttente: 0 },
    T3: { du: 0, paye: 0, enAttente: 0 },
  };

  samplePaiements.forEach((p) => {
    paiementStats[p.trimestre].du += p.montantDu;
    paiementStats[p.trimestre].paye += p.montantPaye;
    paiementStats[p.trimestre].enAttente += p.montantDu - p.montantPaye;
  });

  // Filtrage des activités
  const filteredActivities = sampleUserActivities.filter((activity) => {
    if (filterDate && activity.date !== filterDate) return false;
    if (filterStatus !== "tous" && activity.typeAction !== filterStatus)
      return false;
    return true;
  });

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
    onClick,
  }: any) => (
    <div
      className={`p-6 rounded-lg border transition-all cursor-pointer hover:scale-105 ${
        darkMode
          ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
          : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-sm font-medium ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {title}
          </p>
          <p
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {value}
          </p>
          {subtitle && (
            <p
              className={`text-xs ${
                darkMode ? "text-gray-500" : "text-gray-500"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const LaureatCard = ({
    student,
    rank,
  }: {
    student: Student;
    rank: number;
  }) => (
    <div
      className={`p-4 rounded-lg border-2 border-yellow-400 ${
        darkMode ? "bg-gray-800" : "bg-yellow-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              rank === 1
                ? "bg-yellow-500"
                : rank === 2
                ? "bg-gray-400"
                : "bg-yellow-600"
            }`}
          >
            <span className="text-white font-bold">{rank}</span>
          </div>
          <div>
            <h4
              className={`font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {student.prenom} {student.nom}
            </h4>
            <p
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {student.classesDemandee} - Salle {student.salle}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-xl font-bold ${
              darkMode ? "text-yellow-400" : "text-yellow-600"
            }`}
          >
            {student.moyenneGenerale.toFixed(1)}%
          </p>
          <Star className="h-5 w-5 text-yellow-500 mx-auto" />
        </div>
      </div>
    </div>
  );

  const PaiementCard = ({
    trimestre,
    data,
  }: {
    trimestre: string;
    data: any;
  }) => (
    <div
      className={`p-4 rounded-lg border ${
        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <h4
        className={`font-bold text-lg mb-3 ${
          darkMode ? "text-white" : "text-gray-900"
        }`}
      >
        {trimestre}
      </h4>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Montant dû:
          </span>
          <span
            className={`font-medium ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {data.du.toLocaleString()} HTG
          </span>
        </div>
        <div className="flex justify-between">
          <span
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Montant payé:
          </span>
          <span className="font-medium text-green-600">
            {data.paye.toLocaleString()} HTG
          </span>
        </div>
        <div className="flex justify-between">
          <span
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            En attente:
          </span>
          <span className="font-medium text-red-600">
            {data.enAttente.toLocaleString()} HTG
          </span>
        </div>
        <div
          className={`w-full bg-gray-200 rounded-full h-2 ${
            darkMode ? "bg-gray-700" : ""
          }`}
        >
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${(data.paye / data.du) * 100}%` }}
          />
        </div>
        <p
          className={`text-xs text-center ${
            darkMode ? "text-gray-500" : "text-gray-500"
          }`}
        >
          {((data.paye / data.du) * 100).toFixed(1)}% payé
        </p>
      </div>
    </div>
  );

  const TracabilityModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg p-6 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">
            Traçabilité des Connexions et Actions
          </h3>
          <button
            onClick={() => setShowTracability(false)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filtres */}
        <div
          className={`mb-6 p-4 rounded-lg ${
            darkMode ? "bg-gray-700" : "bg-gray-100"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Filtrer par date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Type d'action
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="tous">Toutes les actions</option>
                <option value="connexion">Connexions</option>
                <option value="modification">Modifications</option>
                <option value="ajout">Ajouts</option>
                <option value="consultation">Consultations</option>
                <option value="suppression">Suppressions</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterDate("");
                  setFilterStatus("tous");
                }}
                className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`p-3 rounded-lg text-center ${
              darkMode ? "bg-blue-900" : "bg-blue-100"
            }`}
          >
            <p
              className={`text-2xl font-bold ${
                darkMode ? "text-blue-300" : "text-blue-600"
              }`}
            >
              {
                filteredActivities.filter((a) => a.typeAction === "connexion")
                  .length
              }
            </p>
            <p
              className={`text-sm ${
                darkMode ? "text-blue-400" : "text-blue-700"
              }`}
            >
              Connexions
            </p>
          </div>
          <div
            className={`p-3 rounded-lg text-center ${
              darkMode ? "bg-green-900" : "bg-green-100"
            }`}
          >
            <p
              className={`text-2xl font-bold ${
                darkMode ? "text-green-300" : "text-green-600"
              }`}
            >
              {
                filteredActivities.filter((a) => a.typeAction === "ajout")
                  .length
              }
            </p>
            <p
              className={`text-sm ${
                darkMode ? "text-green-400" : "text-green-700"
              }`}
            >
              Ajouts
            </p>
          </div>
          <div
            className={`p-3 rounded-lg text-center ${
              darkMode ? "bg-yellow-900" : "bg-yellow-100"
            }`}
          >
            <p
              className={`text-2xl font-bold ${
                darkMode ? "text-yellow-300" : "text-yellow-600"
              }`}
            >
              {
                filteredActivities.filter(
                  (a) => a.typeAction === "modification"
                ).length
              }
            </p>
            <p
              className={`text-sm ${
                darkMode ? "text-yellow-400" : "text-yellow-700"
              }`}
            >
              Modifications
            </p>
          </div>
          <div
            className={`p-3 rounded-lg text-center ${
              darkMode ? "bg-purple-900" : "bg-purple-100"
            }`}
          >
            <p
              className={`text-2xl font-bold ${
                darkMode ? "text-purple-300" : "text-purple-600"
              }`}
            >
              {
                filteredActivities.filter(
                  (a) => a.typeAction === "consultation"
                ).length
              }
            </p>
            <p
              className={`text-sm ${
                darkMode ? "text-purple-400" : "text-purple-700"
              }`}
            >
              Consultations
            </p>
          </div>
        </div>

        {/* Liste des activités */}
        <div className="space-y-3">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={`p-4 rounded-lg border-l-4 ${
                activity.typeAction === "connexion"
                  ? "border-l-blue-500"
                  : activity.typeAction === "modification"
                  ? "border-l-yellow-500"
                  : activity.typeAction === "ajout"
                  ? "border-l-green-500"
                  : activity.typeAction === "suppression"
                  ? "border-l-red-500"
                  : "border-l-purple-500"
              } ${
                darkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {activity.userName}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        activity.typeAction === "connexion"
                          ? "bg-blue-100 text-blue-800"
                          : activity.typeAction === "modification"
                          ? "bg-yellow-100 text-yellow-800"
                          : activity.typeAction === "ajout"
                          ? "bg-green-100 text-green-800"
                          : activity.typeAction === "suppression"
                          ? "bg-red-100 text-red-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {activity.typeAction}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    <strong>Action:</strong> {activity.action}
                  </p>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    <strong>Module:</strong> {activity.module}
                  </p>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    {activity.details}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p
                    className={`text-sm font-medium ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {activity.date}
                  </p>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {activity.heure}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div
              className={`p-8 text-center ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <p>Aucune activité trouvée pour les filtres sélectionnés.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <header
        className={`p-6 border-b transition-colors ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">
                Tableau de Bord - Année Scolaire {selectedYear}
              </h1>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Récapitulatif complet de l'année académique
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filtres</span>
            </button>

            <button
              onClick={() => setShowTracability(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <History className="h-4 w-4" />
              <span>Traçabilité</span>
            </button>

            <button
              onClick={() => window.print()}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Navigation des sections */}
        <div
          className={`mb-8 p-1 rounded-lg ${
            darkMode ? "bg-gray-800" : "bg-gray-200"
          }`}
        >
          <div className="flex space-x-1">
            {[
              { id: "eleves", label: "Élèves & Résultats", icon: Users },
              {
                id: "professeurs",
                label: "Professeurs par Classe",
                icon: GraduationCap,
              },
              {
                id: "paiements",
                label: "Paiements & Finances",
                icon: DollarSign,
              },
              { id: "laureats", label: "Lauréats", icon: Award },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeSection === section.id
                    ? "bg-blue-600 text-white"
                    : darkMode
                    ? "text-gray-400 hover:text-white hover:bg-gray-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <section.icon className="h-4 w-4" />
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section Élèves & Résultats */}
        {activeSection === "eleves" && (
          <div className="space-y-8">
            {/* Statistiques générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Élèves"
                value={totalStudents}
                icon={Users}
                color="bg-blue-500"
                subtitle="Tous statuts confondus"
              />
              <StatCard
                title="Élèves Actifs"
                value={activeStudents}
                icon={UserCheck}
                color="bg-green-500"
                subtitle={`${((activeStudents / totalStudents) * 100).toFixed(
                  1
                )}%`}
              />
              <StatCard
                title="Réussis (≥60%)"
                value={reussitStudents}
                icon={CheckCircle}
                color="bg-emerald-500"
                subtitle={`${((reussitStudents / totalStudents) * 100).toFixed(
                  1
                )}%`}
              />
              <StatCard
                title="En Difficulté"
                value={echoueStudents}
                icon={AlertCircle}
                color="bg-orange-500"
                subtitle={`${((echoueStudents / totalStudents) * 100).toFixed(
                  1
                )}%`}
              />
            </div>

            {/* Statuts spéciaux */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Redoublants"
                value={redoubleStudents}
                icon={BookOpen}
                color="bg-yellow-500"
              />
              <StatCard
                title="Expulsés"
                value={expulseStudents}
                icon={XCircle}
                color="bg-red-600"
              />
              <StatCard
                title="Taux de Réussite"
                value={`${((reussitStudents / totalStudents) * 100).toFixed(
                  1
                )}%`}
                icon={TrendingUp}
                color="bg-purple-500"
              />
            </div>

            {/* Détails par statut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Élèves réussis */}
              <div
                className={`p-6 rounded-lg border ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <h3 className="text-lg font-semibold mb-4 text-green-600">
                  Élèves Réussis (≥60%)
                </h3>
                <div className="space-y-3">
                  {sampleStudents
                    .filter((s) => s.moyenneGenerale >= 60)
                    .map((student) => (
                      <div
                        key={student.id}
                        className={`p-3 rounded-lg ${
                          darkMode ? "bg-gray-700" : "bg-green-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p
                              className={`font-medium ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {student.prenom} {student.nom}
                            </p>
                            <p
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {student.classesDemandee} - Salle {student.salle}
                            </p>
                          </div>
                          <span className="text-green-600 font-bold">
                            {student.moyenneGenerale.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Élèves en difficulté */}
              <div
                className={`p-6 rounded-lg border ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <h3 className="text-lg font-semibold mb-4 text-red-600">
                  Élèves en Difficulté (&lt;60%)
                </h3>
                <div className="space-y-3">
                  {sampleStudents
                    .filter((s) => s.moyenneGenerale < 60)
                    .map((student) => (
                      <div
                        key={student.id}
                        className={`p-3 rounded-lg ${
                          darkMode ? "bg-gray-700" : "bg-red-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p
                              className={`font-medium ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {student.prenom} {student.nom}
                            </p>
                            <p
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {student.classesDemandee} - Salle {student.salle}{" "}
                              ({student.status})
                            </p>
                          </div>
                          <span className="text-red-600 font-bold">
                            {student.moyenneGenerale.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Statistiques par classe */}
            <div
              className={`p-6 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3 className="text-lg font-semibold mb-6">
                Statistiques par Classe
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(statsByClass).map(([classe, stats]) => (
                  <div
                    key={classe}
                    className={`p-4 rounded-lg border ${
                      darkMode
                        ? "bg-gray-700 border-gray-600"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <h4
                      className={`font-bold text-lg mb-3 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {classe}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total élèves:</span>
                        <span className="font-medium">{stats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Actifs:</span>
                        <span className="font-medium text-green-600">
                          {stats.actifs}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Réussis:</span>
                        <span className="font-medium text-emerald-600">
                          {stats.reussit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">En difficulté:</span>
                        <span className="font-medium text-red-600">
                          {stats.echoue}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Salles:</span>
                        <span className="font-medium">
                          {Array.from(stats.salles).join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section Professeurs par Classe */}
        {activeSection === "professeurs" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Professeurs"
                value={
                  sampleEmployes.filter((e) => e.typeEmploye === "professeur")
                    .length
                }
                icon={GraduationCap}
                color="bg-blue-500"
              />
              <StatCard
                title="Classes Couvertes"
                value={
                  new Set(sampleEmployes.flatMap((e) => e.classesAssignees))
                    .size
                }
                icon={Building}
                color="bg-green-500"
              />
              <StatCard
                title="Salles Utilisées"
                value={
                  new Set(sampleEmployes.flatMap((e) => e.sallesAssignees)).size
                }
                icon={BookOpen}
                color="bg-purple-500"
              />
              <StatCard
                title="Matières Enseignées"
                value={
                  new Set(sampleEmployes.flatMap((e) => e.matieresEnseignees))
                    .size
                }
                icon={Award}
                color="bg-orange-500"
              />
            </div>

            {/* Professeurs par classe et salle */}
            <div
              className={`p-6 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3 className="text-lg font-semibold mb-6">
                Affectation des Professeurs par Classe et Salle
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Object.entries(statsByClass).map(([classe]) => {
                  const professeurs = sampleEmployes.filter(
                    (emp) =>
                      emp.typeEmploye === "professeur" &&
                      emp.classesAssignees.includes(classe)
                  );

                  return (
                    <div
                      key={classe}
                      className={`p-4 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <h4
                        className={`font-bold text-lg mb-4 ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Classe {classe}
                      </h4>

                      {professeurs.map((prof) => (
                        <div
                          key={prof.id}
                          className={`mb-4 p-3 rounded-lg ${
                            darkMode ? "bg-gray-600" : "bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5
                              className={`font-medium ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {prof.prenom} {prof.nom}
                            </h5>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                darkMode
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {prof.typeEmploye}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <p
                              className={`text-sm ${
                                darkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              <strong>Matières:</strong>{" "}
                              {prof.matieresEnseignees.join(", ")}
                            </p>
                            <p
                              className={`text-sm ${
                                darkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              <strong>Salles assignées:</strong>{" "}
                              {prof.sallesAssignees
                                .filter((salle) => {
                                  const studentInSalle = sampleStudents.find(
                                    (s) => s.salle === salle
                                  );
                                  return (
                                    studentInSalle?.classesDemandee === classe
                                  );
                                })
                                .join(", ") || "Aucune"}
                            </p>
                            <p
                              className={`text-sm ${
                                darkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              <strong>Embauché le:</strong>{" "}
                              {new Date(prof.dateEmbauche).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}

                      {professeurs.length === 0 && (
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Aucun professeur assigné à cette classe.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Section Paiements */}
        {activeSection === "paiements" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PaiementCard trimestre="Trimestre 1" data={paiementStats.T1} />
              <PaiementCard trimestre="Trimestre 2" data={paiementStats.T2} />
              <PaiementCard trimestre="Trimestre 3" data={paiementStats.T3} />
            </div>

            {/* Détails des paiements par élève */}
            <div
              className={`p-6 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3 className="text-lg font-semibold mb-6">
                Détails des Paiements par Élève
              </h3>
              <div className="space-y-4">
                {sampleStudents.map((student) => {
                  const studentPaiements = samplePaiements.filter(
                    (p) => p.studentId === student.id
                  );
                  const totalDu = student.fraisScolarite;
                  const totalPaye = student.fraisPayes;
                  const balance = totalDu - totalPaye;

                  return (
                    <div
                      key={student.id}
                      className={`p-4 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4
                            className={`font-medium ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {student.prenom} {student.nom}
                          </h4>
                          <p
                            className={`text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {student.classesDemandee} - Salle {student.salle}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold ${
                              balance === 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            Balance: {balance.toLocaleString()} HTG
                          </p>
                          <p
                            className={`text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {totalPaye.toLocaleString()} /{" "}
                            {totalDu.toLocaleString()} HTG
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {["T1", "T2", "T3"].map((trimestre) => {
                          const paiement = studentPaiements.find(
                            (p) => p.trimestre === trimestre
                          );
                          return (
                            <div
                              key={trimestre}
                              className={`p-3 rounded-lg ${
                                darkMode ? "bg-gray-600" : "bg-white"
                              }`}
                            >
                              <h5
                                className={`font-medium mb-2 ${
                                  darkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {trimestre}
                              </h5>
                              {paiement ? (
                                <div>
                                  <p
                                    className={`text-sm ${
                                      darkMode
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    Payé:{" "}
                                    {paiement.montantPaye.toLocaleString()} HTG
                                  </p>
                                  <p
                                    className={`text-sm ${
                                      darkMode
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    Dû: {paiement.montantDu.toLocaleString()}{" "}
                                    HTG
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      darkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {paiement.datePaiement}
                                  </p>
                                  <span
                                    className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                                      paiement.statut === "complet"
                                        ? "bg-green-100 text-green-800"
                                        : paiement.statut === "partiel"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {paiement.statut}
                                  </span>
                                </div>
                              ) : (
                                <p
                                  className={`text-sm ${
                                    darkMode ? "text-gray-400" : "text-gray-500"
                                  }`}
                                >
                                  Aucun paiement
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Section Lauréats */}
        {activeSection === "laureats" && (
          <div className="space-y-8">
            <div
              className={`p-6 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3 className="text-lg font-semibold mb-6 text-center">
                🏆 Top 3 des Lauréats - Année Scolaire {selectedYear} 🏆
              </h3>
              <div className="space-y-4">
                {laureats.map((student, index) => (
                  <LaureatCard
                    key={student.id}
                    student={student}
                    rank={index + 1}
                  />
                ))}
              </div>
            </div>

            {/* Moyennes par trimestre des lauréats */}
            <div
              className={`p-6 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3 className="text-lg font-semibold mb-6">
                Évolution des Moyennes des Lauréats
              </h3>
              <div className="space-y-4">
                {laureats.map((student) => (
                  <div
                    key={student.id}
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4
                      className={`font-medium mb-3 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {student.prenom} {student.nom} - {student.classesDemandee}
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Trimestre 1
                        </p>
                        <p className="text-xl font-bold text-blue-600">
                          {student.moyenneT1?.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Trimestre 2
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          {student.moyenneT2?.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Trimestre 3
                        </p>
                        <p className="text-xl font-bold text-purple-600">
                          {student.moyenneT3?.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de traçabilité */}
      {showTracability && <TracabilityModal />}

      {/* Footer avec informations supplémentaires */}
      <footer
        className={`mt-12 p-6 border-t ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3
                className={`font-semibold mb-3 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Résumé Exécutif
              </h3>
              <div className="space-y-2">
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  📊 <strong>Performance:</strong>{" "}
                  {((reussitStudents / totalStudents) * 100).toFixed(1)}% de
                  réussite
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  💰 <strong>Finances:</strong>{" "}
                  {(
                    (sampleStudents.reduce((sum, s) => sum + s.fraisPayes, 0) /
                      sampleStudents.reduce(
                        (sum, s) => sum + s.fraisScolarite,
                        0
                      )) *
                    100
                  ).toFixed(1)}
                  % collecté
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  👥 <strong>Effectif:</strong> {totalStudents} élèves dans{" "}
                  {Object.keys(statsByClass).length} classes
                </p>
              </div>
            </div>

            <div>
              <h3
                className={`font-semibold mb-3 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Actions Recommandées
              </h3>
              <div className="space-y-2">
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  🎯 Renforcement pédagogique en 7ème et 8ème AF
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  💳 Suivi des paiements en retard
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  ⭐ Reconnaissance des élèves excellents
                </p>
              </div>
            </div>

            <div>
              <h3
                className={`font-semibold mb-3 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Informations Système
              </h3>
              <div className="space-y-2">
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  📅 Dernière mise à jour:{" "}
                  {new Date().toLocaleDateString("fr-FR")}
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  🔄 Données actualisées en temps réel
                </p>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  📈 Rapport généré automatiquement
                </p>
              </div>
            </div>
          </div>

          <div
            className={`mt-6 pt-6 border-t text-center ${
              darkMode
                ? "border-gray-700 text-gray-400"
                : "border-gray-200 text-gray-600"
            }`}
          >
            <p className="text-sm">
              © {new Date().getFullYear()} Système de Gestion Scolaire - Tous
              droits réservés
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Rapport;
