export interface Note {
  id: string;
  eleve_id: string;
  matiere_id: string;
  trimestre: 1 | 2 | 3;
  note: number;
  observation?: string;
  date_ajout: string;
  decision_de_fin_annee?:string;
  annee_scolaire_id: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NoteFormData {
  eleve_id: string;
  matiere_id: string;
  trimestre: 1 | 2 | 3;
  note: number;
  observation?: string;
  decision_de_fin_annee?:string;
  annee_scolaire_id: string;
}

// Les matières sont maintenant gérées par le contexte ContextAnneeScolaire
// Utilisez Subject de ContextAnneeScolaire.tsx

export interface NoteWithDetails extends Note {
  eleve_nom: string;
  eleve_prenom: string;
  eleve_code: string;
  matiere_nom: string;
  classe_nom: string;
  salle_nom: string;
}