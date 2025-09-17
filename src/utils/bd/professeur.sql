-- =======================
-- NOUVELLE STRUCTURE DE BASE DE DONNÉES
-- =======================

-- 1. TABLE DES ENSEIGNANTS (Informations personnelles uniques)
CREATE TABLE public.enseignants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom character varying(100) NOT NULL,
  prenom character varying(100) NOT NULL,
  email character varying(255) NOT NULL,
  telephone character varying(20) NULL,
  adresse text NULL,
  nif_cin text NULL,
  date_naissance date NULL,
  diplomes text NULL,
  photo_url text NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT enseignants_pkey PRIMARY KEY (id),
  CONSTRAINT enseignants_email_key UNIQUE (email),
  CONSTRAINT enseignants_nif_cin_key UNIQUE (nif_cin),
  
  -- Contraintes de validation
  CONSTRAINT email_valide CHECK (
    email::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text
  ),
  CONSTRAINT telephone_valide CHECK (
    telephone::text ~ '^[\+]?[0-9\s\-\(\)]{8,20}$'::text OR telephone IS NULL
  ),
  CONSTRAINT nif_cin_valide CHECK (
    nif_cin IS NULL OR LENGTH(REPLACE(nif_cin, '-', '')) = 10
  )
);

-- 2. TABLE DES AFFECTATIONS PROFESSEURS (Relations par année scolaire)
CREATE TABLE public.professeurs_affectations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  enseignant_id uuid NOT NULL,
  annee_scolaire_id uuid NOT NULL,
  code character varying(20) NOT NULL,
  enseignant_code character varying(50) NULL, -- Code spécifique pour cette année
  date_embauche date NULL,
  date_fin_contrat date NULL,
  statut character varying(20) DEFAULT 'actif'::character varying,
  type_contrat character varying(50) DEFAULT 'permanent',
  salaire_base decimal(10,2) NULL,
  notes_rh text NULL,
  deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT professeurs_affectations_pkey PRIMARY KEY (id),
  CONSTRAINT professeurs_affectations_enseignant_id_fkey 
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE CASCADE,
  CONSTRAINT professeurs_affectations_annee_scolaire_id_fkey 
    FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id) ON DELETE CASCADE,
  
  -- Contrainte d'unicité : un enseignant ne peut avoir qu'une seule affectation par année
  CONSTRAINT unique_enseignant_annee UNIQUE (enseignant_id, annee_scolaire_id),
  
  -- Contrainte d'unicité : code unique par année scolaire
  CONSTRAINT unique_code_annee UNIQUE (code, annee_scolaire_id),
  
  -- Contraintes de validation
  CONSTRAINT statut_valide CHECK (
    statut::text = ANY (ARRAY['actif'::character varying, 'inactif'::character varying, 'suspendu'::character varying]::text[])
  ),
  CONSTRAINT type_contrat_valide CHECK (
    type_contrat::text = ANY (ARRAY['permanent'::character varying, 'temporaire'::character varying, 'vacataire'::character varying]::text[])
  ),
  CONSTRAINT dates_coherentes CHECK (
    date_fin_contrat IS NULL OR date_fin_contrat >= date_embauche
  )
);

-- 3. TABLE DES SÉQUENCES (inchangée, mais référence maintenant professeurs_affectations)
CREATE TABLE public.sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professeur_affectation_id uuid NOT NULL, -- Référence vers professeurs_affectations
  classe character varying(100) NOT NULL,
  salle character varying(100) NOT NULL,
  matiere character varying(100) NOT NULL,
  volume_horaire integer NULL,
  coefficient decimal(3,2) NULL DEFAULT 1.0,
  deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT sequences_pkey PRIMARY KEY (id),
  CONSTRAINT sequences_professeur_affectation_id_fkey 
    FOREIGN KEY (professeur_affectation_id) REFERENCES professeurs_affectations(id) ON DELETE CASCADE,
  
  -- Contrainte d'unicité : un professeur ne peut pas avoir la même séquence en double
  CONSTRAINT unique_professeur_sequence UNIQUE (professeur_affectation_id, classe, salle, matiere)
);

-- =======================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- =======================

-- Index pour la table enseignants
CREATE INDEX idx_enseignants_nom ON enseignants(nom);
CREATE INDEX idx_enseignants_prenom ON enseignants(prenom);
CREATE INDEX idx_enseignants_email ON enseignants(email);

-- Index pour la table professeurs_affectations
CREATE INDEX idx_professeurs_affectations_enseignant ON professeurs_affectations(enseignant_id);
CREATE INDEX idx_professeurs_affectations_annee ON professeurs_affectations(annee_scolaire_id);
CREATE INDEX idx_professeurs_affectations_code ON professeurs_affectations(code);
CREATE INDEX idx_professeurs_affectations_statut ON professeurs_affectations(statut);
CREATE INDEX idx_professeurs_affectations_deleted ON professeurs_affectations(deleted);

-- Index pour la table sequences
CREATE INDEX idx_sequences_professeur_affectation ON sequences(professeur_affectation_id);
CREATE INDEX idx_sequences_classe ON sequences(classe);
CREATE INDEX idx_sequences_matiere ON sequences(matiere);
CREATE INDEX idx_sequences_deleted ON sequences(deleted);

-- =======================
-- TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- =======================

-- Trigger pour enseignants
CREATE TRIGGER update_enseignants_updated_at 
  BEFORE UPDATE ON enseignants 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour professeurs_affectations
CREATE TRIGGER update_professeurs_affectations_updated_at 
  BEFORE UPDATE ON professeurs_affectations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour sequences
CREATE TRIGGER update_sequences_updated_at 
  BEFORE UPDATE ON sequences 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

