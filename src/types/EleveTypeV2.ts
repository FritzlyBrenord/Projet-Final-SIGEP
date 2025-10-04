// Types pour la gestion des élèves avec deux tables séparées

// Table eleves - Données permanentes
export interface ElevePermanent {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  pays_naissance: string;
  region_naissance: string;
  ville_naissance: string;
  section_naissance?: string;
  sexe: "M" | "F";
  adresse_actuelle: string;
  telephone_parents: string;
  adresse_parents: string;
  nif_parents: string;
  moyenne_generale: number;
  etablissement_precedent: string;
  photo_url?: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

// Table eleves_inscriptions - Inscriptions par année
export interface EleveInscription {
  id: string;
  eleve_id: string;
  statut: "actif" | "inactif" | "suspendu";
  date_inscription: string;
  observations?: string;
  annee_scolaire_id: string;
  classe_id: string;
  salle_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

// Type combiné pour l'affichage
export interface EleveAffiche extends ElevePermanent {
  // Données de l'inscription actuelle
  inscription_id: string;
  statut: "actif" | "inactif" | "suspendu";
  date_inscription: string;
  observations_inscription?: string;
  annee_scolaire_id: string;
  classe_id: string;
  salle_id: string;
}

// Données pour l'ajout d'un nouvel élève
export interface EleveFormData {
  // Données permanentes
  nom: string;
  prenom: string;
  date_naissance: string;
  pays_naissance: string;
  region_naissance: string;
  ville_naissance: string;
  section_naissance?: string;
  sexe: "M" | "F";
  adresse_actuelle: string;
  telephone_parents: string;
  adresse_parents: string;
  nif_parents: string;
  moyenne_generale: number;
  etablissement_precedent: string;
  photo_url?: string;
  
  // Données d'inscription
  annee_scolaire_id: string;
  classe_id: string;
  salle_id: string;
  statut: "actif" | "inactif" | "suspendu";
  observations?: string;
}

// Données pour la réinscription
export interface ReinscriptionData {
  eleve_id: string;
  annee_scolaire_id: string;
  classe_id: string;
  salle_id: string;
  statut: "actif" | "inactif" | "suspendu";
  observations?: string;
}

// Résultat de vérification de doublons
export interface DoublonEleve {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  pays_naissance: string;
  region_naissance: string;
  ville_naissance: string;
  section_naissance?: string;
  telephone_parents: string;
  nif_parents: string;
  annee_scolaire: string;
  classe: string;
  statut: string;
}