export type StatutEmploye = "actif" | "inactif";

export const FONCTIONS = [
  "Censeur",
  "Surveillant",
  "Directeur",
  "Directeur pédagogique",
  "Secrétaire",
  "Économe",
  "Gardien",
  "Préciser",
] as const;

export const DEPARTEMENTS = [
  "Direction",
  "Censora",
  "Economat",
  "Administration",
  "Préciser",
] as const;

export interface Employer {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  date_embauche: string;
  nif_cin: string;
  diplomes?: string;
  responsabilites?: string;
  fonction?: string;
  departement?: string;
  departement_preciser?: string;
  statut: StatutEmploye;
  annee_scolaire_id: string;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmployerFormData {
  code: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  date_embauche: string;
  nif_cin: string;
  diplomes?: string;
  responsabilites?: string;
  fonction?: string;
  departement?: string;
  departement_preciser?: string;
  statut: StatutEmploye;
  annee_scolaire_id: string;
}


