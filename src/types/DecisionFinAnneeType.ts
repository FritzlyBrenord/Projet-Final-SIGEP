export interface DecisionFinAnnee {
  id: string;
  eleve_id: string;
  annee_scolaire_id: string;
  observation?: string;
  decision: 'ADMIS' | 'REDOUBLER' | 'EXPULSER';
  date_decision: string;
  created_at?: string;
  updated_at?: string;
  deleted: boolean;
}

export interface DecisionFinAnneeFormData {
  eleve_id: string;
  annee_scolaire_id: string;
  observation?: string;
  decision: 'ADMIS' | 'REDOUBLER' | 'EXPULSER';
  date_decision?: string;
}

export interface DecisionFinAnneeWithDetails extends DecisionFinAnnee {
  eleve_nom: string;
  eleve_prenom: string;
  eleve_code: string;
  classe_nom: string;
  salle_nom: string;
}