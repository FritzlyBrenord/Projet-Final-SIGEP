// Types pour la gestion des professeurs

export interface Sequence {
  id: string;
  classe: string;
  salle: string;
  matiere: string;
  deleted?: boolean;
}

export interface Professeur {
  id: string;
  enseignant_id: string;
  code: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  date_embauche: string;
  nif_cin: string;
  sequences: Sequence[];
  diplomes: string;
  statut: "actif" | "inactif";
  annee_scolaire_id: string;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProfesseurFormData {
  enseignant_id: string;
  code: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  date_embauche: string;
  nif_cin: string;
  sequences: Sequence[];
  diplomes: string;
  statut: "actif" | "inactif";
  annee_scolaire_id: string;
}

export interface ProfesseurContextType {
  // États
  professeurs: Professeur[];
  isLoading: boolean;
  error: string | null;

  // Fonctions CRUD
  ajouterProfesseur: (professeur: ProfesseurFormData) => Promise<void>;
  modifierProfesseur: (id: string, professeur: Partial<ProfesseurFormData>) => Promise<void>;
  supprimerProfesseur: (id: string) => Promise<void>;
  supprimerProfesseurDefinitif: (id: string) => Promise<void>;
  restaurerProfesseur: (id: string) => Promise<void>;
  
  // Fonctions de gestion des séquences
  ajouterSequence: (professeurId: string, sequence: Omit<Sequence, "id">) => Promise<void>;
  modifierSequence: (professeurId: string, sequenceId: string, sequence: Partial<Sequence>) => Promise<void>;
  supprimerSequence: (professeurId: string, sequenceId: string) => Promise<void>;
  
  // Fonctions de recherche et filtrage
  rechercherProfesseurs: (terme: string) => Professeur[];
  obtenirProfesseurParId: (id: string) => Professeur | undefined;
  obtenirProfesseursParAnnee: (anneeId: string) => Professeur[];
  
  // Fonctions utilitaires
  setError: (error: string | null) => void;
  rechargerProfesseurs: () => Promise<void>;
}

export interface ProfesseurModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "view" | "delete";
  professeur?: Professeur;
  isDarkMode?: boolean;
}

export interface SequenceFormProps {
  professeurId: string;
  sequence?: Sequence;
  onSave: (sequence: Omit<Sequence, "id">) => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

export interface ProfesseurListProps {
  professeurs: Professeur[];
  onEdit: (professeur: Professeur) => void;
  onDelete: (professeur: Professeur) => void;
  onView: (professeur: Professeur) => void;
  isDarkMode?: boolean;
}