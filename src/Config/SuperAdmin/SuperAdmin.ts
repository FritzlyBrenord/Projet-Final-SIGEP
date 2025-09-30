// SuperAdminConfig.ts
import { Employer } from "@/types/EmployerType";

export const SUPER_ADMIN_CREDENTIALS = {
  email: "superadmin@imfp.edu.ht",
  password: "SuperAdmin@IMFP2025!",
  id: "00000000-0000-0000-0000-000000000001",
  employer_id: "emp-00000000-0000-0000-0000-000000000001",
};

export const SUPER_ADMIN_EMPLOYER: Employer = {
  id: "emp-00000000-0000-0000-0000-000000000001",
  code: "EMP-SUPERADMIN-001",
  nom: "SYSTÈME",
  prenom: "Super Admin",
  email: "superadmin@imfp.edu.ht",
  telephone: "+509 3700-0000",
  adresse: "Institution Mixte Faustin Premier, Delmas, Port-au-Prince",
  date_embauche: "2025-01-01",
  nif_cin: "SA-000-000-000-0",
  diplomes: "Administration Système, Gestion Éducative, Sécurité Informatique",
  responsabilites: "Administration complète du système SIGEP, Gestion des utilisateurs, Configuration et maintenance, Sécurité et sauvegarde des données, Supervision générale",
  fonction: "Super Administrateur",
  departement: "Système",
  departement_preciser: "Administration Système et Sécurité",
  statut: "actif",
  annee_scolaire_id: "ANNEE-SCOLAIRE-2024-2025",
  deleted: false,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
};

export const SUPER_ADMIN_PERMISSIONS = [
  "Tableau de Bord",
  "Années Scolaires",
  "Élèves",
  "Notes",
  "Professeurs",
  "Employés",
  "Paiements",
  "Rapports",
  "Calendrier",
  "Paramètres",
  "Gestion Utilisateurs",
  "Sécurité et Accès",
  "Sauvegarde et Restauration",
  "Journaux d'Activité",
  "Configuration Système",
  "Gestion des Rôles",
  "Gestion des Permissions",
  "Modules Académiques",
  "Gestion Financière",
  "Communication",
  "Statistiques Avancées",
  "Export de Données",
  "Import de Données",
  "Archivage",
  "Gestion Documentaire",
];

export const SUPER_ADMIN_USER_PROFILE = {
  id: "00000000-0000-0000-0000-000000000001",
  email_connexion: "superadmin@imfp.edu.ht",
  password_connexion: "SuperAdmin@IMFP2025!",
  role: "Super Administrateur" as const,
  employer_id: "emp-00000000-0000-0000-0000-000000000001",
  isbloquer: false,
  derniere_connexion: null,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
  autorisations: SUPER_ADMIN_PERMISSIONS,
  employer: SUPER_ADMIN_EMPLOYER,
};