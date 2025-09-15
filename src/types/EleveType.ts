export type EleveStatut = "actif" | "inactif" | "suspendu";

export interface Eleve {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: "M" | "F";
  adresse_actuelle: string;
  telephone_parents: string;
  adresse_parents: string;
  nif_parents: string;
  moyenne_generale: number;
  etablissement_precedent: string;
  statut: EleveStatut;
  date_inscription: string;
  observations?: string;
  photo_url?: string;
  annee_scolaire_id: string;
  classe_id: string;     // un élève dans une seule classe
  salle_id: string;      // un élève dans une seule salle
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EleveFormData {
  code: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: "M" | "F";
  adresse_actuelle: string;
  telephone_parents: string;
  adresse_parents: string;
  nif_parents: string;
  moyenne_generale: number;
  etablissement_precedent: string;
  statut: EleveStatut;
  date_inscription: string;
  observations?: string;
  photo_url?: string;
  annee_scolaire_id: string;
  classe_id: string;
  salle_id: string;
}


