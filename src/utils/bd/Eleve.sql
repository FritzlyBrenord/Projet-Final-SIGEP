-- ============================================
-- SYSTÈME DE GESTION DES ÉLÈVES MULTI-ANNÉES
-- ============================================

-- Table 1: Données permanentes des élèves
CREATE TABLE eleves (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  lieu_naissance TEXT NOT NULL,
  sexe TEXT NOT NULL,
  adresse_actuelle TEXT NOT NULL,
  telephone_parents TEXT NOT NULL,
  adresse_parents TEXT NOT NULL,
  nif_parents TEXT NOT NULL,
  moyenne_generale NUMERIC(5, 2) NOT NULL DEFAULT 0,
  etablissement_precedent TEXT NOT NULL,
  photo_url TEXT NULL,
  deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT eleves_pkey PRIMARY KEY (id),
  CONSTRAINT eleves_code_unique UNIQUE (code),
  CONSTRAINT eleves_sexe_check CHECK (sexe = ANY (ARRAY['M'::text, 'F'::text]))
) TABLESPACE pg_default;

-- Table 2: Inscriptions par année scolaire
CREATE TABLE eleves_inscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  eleve_id UUID NOT NULL,
  statut TEXT NOT NULL,
  date_inscription DATE NOT NULL DEFAULT CURRENT_DATE,
  observations TEXT NULL,
  annee_scolaire_id UUID NOT NULL,
  classe_id UUID NOT NULL,
  salle_id UUID NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT eleves_inscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT uq_eleve_annee UNIQUE (eleve_id, annee_scolaire_id),
  CONSTRAINT eleves_inscriptions_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves (id) ON DELETE CASCADE,
  CONSTRAINT eleves_inscriptions_annee_scolaire_id_fkey FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires (id) ON DELETE CASCADE,
  CONSTRAINT eleves_inscriptions_salle_id_fkey FOREIGN KEY (salle_id) REFERENCES salles (id) ON DELETE RESTRICT,
  CONSTRAINT eleves_inscriptions_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES classes (id) ON DELETE RESTRICT,
  CONSTRAINT eleves_inscriptions_statut_check CHECK (statut = ANY (ARRAY['actif'::text, 'inactif'::text, 'suspendu'::text]))
) TABLESPACE pg_default;

-- Index pour la table eleves
CREATE INDEX IF NOT EXISTS idx_eleves_deleted ON public.eleves USING btree (deleted) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_eleves_code ON public.eleves USING btree (code) TABLESPACE pg_default;

-- Index pour la table eleves_inscriptions
CREATE INDEX IF NOT EXISTS idx_eleves_inscriptions_eleve ON public.eleves_inscriptions USING btree (eleve_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_eleves_inscriptions_annee ON public.eleves_inscriptions USING btree (annee_scolaire_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_eleves_inscriptions_classe ON public.eleves_inscriptions USING btree (classe_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_eleves_inscriptions_salle ON public.eleves_inscriptions USING btree (salle_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_eleves_inscriptions_deleted ON public.eleves_inscriptions USING btree (deleted) TABLESPACE pg_default;

-- Triggers pour mise à jour automatique
CREATE TRIGGER trg_eleves_updated_at 
BEFORE UPDATE ON eleves 
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_eleves_inscriptions_updated_at 
BEFORE UPDATE ON eleves_inscriptions 
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- EXEMPLE D'UTILISATION
-- ============================================

-- Créer un élève (une seule fois)
-- INSERT INTO eleves (code, nom, prenom, date_naissance, lieu_naissance, sexe, adresse_actuelle, telephone_parents, adresse_parents, nif_parents, etablissement_precedent) 
-- VALUES ('BRE001', 'Brenord', 'Jean', '2010-05-15', 'Port-au-Prince', 'M', 'Delmas 33', '3701-2345', 'Delmas 33', '123456789', 'École Primaire ABC');

-- Inscription 2024-2025 en 7e
-- INSERT INTO eleves_inscriptions (eleve_id, annee_scolaire_id, classe_id, salle_id, statut) 
-- VALUES ((SELECT id FROM eleves WHERE code = 'BRE001'), 'UUID_ANNEE_2024_2025', 'UUID_CLASSE_7E', 'UUID_SALLE_A1', 'actif');

-- Inscription 2025-2026 en 8e
-- INSERT INTO eleves_inscriptions (eleve_id, annee_scolaire_id, classe_id, salle_id, statut) 
-- VALUES ((SELECT id FROM eleves WHERE code = 'BRE001'), 'UUID_ANNEE_2025_2026', 'UUID_CLASSE_8E', 'UUID_SALLE_B2', 'actif');

-- Voir l'historique complet d'un élève
-- SELECT e.code, e.nom, e.prenom, a.libelle as annee_scolaire, c.nom as classe, s.nom as salle, i.statut
-- FROM eleves e
-- JOIN eleves_inscriptions i ON e.id = i.eleve_id
-- JOIN annees_scolaires a ON i.annee_scolaire_id = a.id
-- JOIN classes c ON i.classe_id = c.id
-- JOIN salles s ON i.salle_id = s.id
-- WHERE e.code = 'BRE001'
-- ORDER BY a.date_debut;