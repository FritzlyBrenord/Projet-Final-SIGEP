// ===========================
// TYPES POUR LA NOUVELLE STRUCTURE DB
// ===========================

// Type pour la table enseignants (informations personnelles)
export interface Enseignant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  nif_cin: string;
  date_naissance?: string;
  diplomes: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Type pour la table professeurs_affectations (relations par année)
export interface ProfesseurAffectation {
  id: string;
  enseignant_id: string;
  annee_scolaire_id: string;
  code: string;
  enseignant_code?: string;
  date_embauche?: string;
  date_fin_contrat?: string;
  statut: "actif" | "inactif" | "suspendu";
  type_contrat: "permanent" | "temporaire" | "vacataire";
  salaire_base?: number;
  notes_rh?: string;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Type pour la table sequences (maintenant liée à professeurs_affectations)
export interface Sequence {
  id: string;
  professeur_affectation_id: string; // Nouveau : référence vers professeurs_affectations
  classe: string;
  salle: string;
  matiere: string;
  volume_horaire?: number;
  coefficient?: number;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ===========================
// TYPES COMBINÉS POUR L'INTERFACE
// ===========================

// Type principal pour l'affichage (combine enseignant + affectation + séquences)
export interface Professeur {
  // Identifiants
  id: string; // ID de l'affectation (professeurs_affectations.id)
  enseignant_id: string; // ID de l'enseignant (enseignants.id)
  
  // Informations personnelles (depuis enseignants)
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  nif_cin: string;
  diplomes: string;
  
  // Informations d'affectation (depuis professeurs_affectations)
  code: string;
  enseignant_code?: string;
  date_embauche: string;
  date_fin_contrat?: string;
  statut: "actif" | "inactif" | "suspendu";
  type_contrat: "permanent" | "temporaire" | "vacataire";
  salaire_base?: number;
  notes_rh?: string;
  annee_scolaire_id: string;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Séquences associées
  sequences: Sequence[];
}

// Type pour les formulaires (adapté à la nouvelle structure)
export interface ProfesseurFormData {
  // Informations personnelles (pour enseignants)
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  nif_cin: string;
  diplomes: string;
  
  // Informations d'affectation (pour professeurs_affectations)
  code: string;
  enseignant_code?: string;
  date_embauche: string;
  date_fin_contrat?: string;
  statut: "actif" | "inactif" | "suspendu";
  type_contrat: "permanent" | "temporaire" | "vacataire";
  salaire_base?: number;
  notes_rh?: string;
  annee_scolaire_id: string;
  
  // Séquences
  sequences: Omit<Sequence, "id" | "professeur_affectation_id">[];
}

// ===========================
// TYPES POUR LA BASE DE DONNÉES
// ===========================

// Types DB correspondant aux tables
interface EnseignantDB {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  nif_cin: string;
  date_naissance?: string;
  diplomes: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProfesseurAffectationDB {
  id: string;
  enseignant_id: string;
  annee_scolaire_id: string;
  code: string;
  enseignant_code?: string;
  date_embauche?: string;
  date_fin_contrat?: string;
  statut: "actif" | "inactif" | "suspendu";
  type_contrat: "permanent" | "temporaire" | "vacataire";
  salaire_base?: number;
  notes_rh?: string;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SequenceDB {
  id: string;
  professeur_affectation_id: string;
  classe: string;
  salle: string;
  matiere: string;
  volume_horaire?: number;
  coefficient?: number;
  deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

// ===========================
// INTERFACE DU CONTEXTE (adaptée)
// ===========================

export interface ProfesseurContextType {
  // États
  professeurs: Professeur[];
  isLoading: boolean;
  error: string | null;

  // Fonctions CRUD Professeurs
  ajouterProfesseur: (professeur: ProfesseurFormData) => Promise<void>;
  modifierProfesseur: (id: string, professeur: Partial<ProfesseurFormData>) => Promise<void>;
  supprimerProfesseur: (id: string) => Promise<void>;
  supprimerProfesseurDefinitif: (id: string) => Promise<void>;
  restaurerProfesseur: (id: string) => Promise<void>;

  // Fonctions de gestion des séquences
  ajouterSequence: (professeurId: string, sequence: Omit<Sequence, "id" | "professeur_affectation_id">) => Promise<void>;
  modifierSequence: (professeurId: string, sequenceId: string, sequence: Partial<Omit<Sequence, "id" | "professeur_affectation_id">>) => Promise<void>;
  supprimerSequence: (professeurId: string, sequenceId: string) => Promise<void>;

  // Fonctions de recherche et filtrage
  rechercherProfesseurs: (terme: string) => Professeur[];
  obtenirProfesseurParId: (id: string) => Professeur | undefined;
  obtenirProfesseursParAnnee: (anneeId: string) => Professeur[];
  obtenirProfesseursActifs: (anneeId?: string) => Professeur[];
  obtenirProfesseursInactifs: (anneeId?: string) => Professeur[];
  obtenirProfesseursSupprimesLogiquement: (anneeId?: string) => Professeur[];

  // Fonctions utilitaires
  setError: (error: string | null) => void;
  rechargerProfesseurs: () => Promise<void>;
  chargerProfesseursParAnnee: (anneeId: string) => Promise<void>;
  validerCodeProfesseur: (code: string, professeurId?: string, anneeId?: string) => Promise<boolean>;
  validerEmailEnseignant: (email: string, enseignantId?: string) => Promise<boolean>;
  genererNouveauCode: (anneeId: string) => Promise<string>;

  // Actions par lots
  supprimerPlusieursProfesseurs: (ids: string[]) => Promise<void>;
  restaurerPlusieursProfesseurs: (ids: string[]) => Promise<void>;

  // NOUVELLE FONCTION - Copie vers nouvelle année scolaire (simplifiée avec la nouvelle structure)
  copierProfesseursVersNouvelleAnnee: (anneeSourceId: string, anneeDestinationId: string) => Promise<void>;

  // NOUVELLES FONCTIONS - Gestion séparée des enseignants
  obtenirEnseignants: () => Enseignant[];
  obtenirEnseignantParId: (id: string) => Enseignant | undefined;
  modifierEnseignant: (id: string, enseignant: Partial<Enseignant>) => Promise<void>;
}

// ===========================
// TYPES POUR LES COMPOSANTS (inchangés)
// ===========================

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
  onSave: (sequence: Omit<Sequence, "id" | "professeur_affectation_id">) => void;
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

// ===========================
// NOUVEAUX TYPES UTILITAIRES
// ===========================

// Type pour la fonction de copie simplifiée
export interface CopieResult {
  professeursCopies: number;
  sequenceCopiees: number;
  professeursIgnores: number;
  erreurs: string[];
}

// Type pour les statistiques
export interface StatistiquesProfesseurs {
  total: number;
  actifs: number;
  inactifs: number;
  suspendus: number;
  permanents: number;
  temporaires: number;
  vacataires: number;
}