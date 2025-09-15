-- Tables de référence supposées:
-- public.annees_scolaires(id uuid primary key, year text, ...)
-- public.classes(id uuid primary key, name text, annee_scolaire_id uuid references annees_scolaires(id) on delete cascade, ...)
-- public.salles(id uuid primary key, name text, classe_id uuid references classes(id) on delete cascade, ...)

-- Table eleves
CREATE TABLE public.eleves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,                                       -- ex: ETU001
  nom text NOT NULL,
  prenom text NOT NULL,
  date_naissance date NOT NULL,
  lieu_naissance text NOT NULL,
  sexe text NOT NULL CHECK (sexe IN ('M','F')),
  adresse_actuelle text NOT NULL,
  telephone_parents text NOT NULL,
  adresse_parents text NOT NULL,
  nif_parents text NOT NULL,
  moyenne_generale numeric(5,2) NOT NULL DEFAULT 0,
  etablissement_precedent text NOT NULL,
  statut text NOT NULL CHECK (statut IN ('actif','inactif','suspendu')),
  date_inscription date NOT NULL DEFAULT CURRENT_DATE,
  observations text,
  photo_url text,
  annee_scolaire_id uuid NOT NULL REFERENCES public.annees_scolaires(id) ON DELETE CASCADE,
  classe_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  salle_id uuid NOT NULL REFERENCES public.salles(id) ON DELETE RESTRICT,
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_eleves_code UNIQUE (annee_scolaire_id, code)
);

-- Règle métier: un élève dans une seule classe et une seule salle ⇒ géré par classe_id/salle_id NOT NULL
-- (Optionnel) cohérence salle -> classe
-- Assure que la salle choisie appartient à la classe choisie (via trigger si nécessaire)

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_eleves_updated_at ON public.eleves;
CREATE TRIGGER trg_eleves_updated_at
BEFORE UPDATE ON public.eleves
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_eleves_annee ON public.eleves(annee_scolaire_id);
CREATE INDEX IF NOT EXISTS idx_eleves_classe ON public.eleves(classe_id);
CREATE INDEX IF NOT EXISTS idx_eleves_salle ON public.eleves(salle_id);
CREATE INDEX IF NOT EXISTS idx_eleves_deleted ON public.eleves(deleted);