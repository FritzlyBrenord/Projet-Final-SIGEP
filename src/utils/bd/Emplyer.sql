-- Table des employés
CREATE TABLE public.employes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,                               -- ex: EMP001
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL UNIQUE,
  telephone text UNIQUE,
  adresse text,
  date_embauche date,
  nif_cin text UNIQUE,
  diplomes text,
  responsabilites text,
  fonction text,                                           -- Censeur, Surveillant, Directeur, etc.
  departement text,                                        -- Direction, Censora, Economat, Administration
  statut text NOT NULL CHECK (statut IN ('actif','inactif')),
  annee_scolaire_id uuid NOT NULL
    REFERENCES public.annees_scolaires(id) ON DELETE CASCADE,
  deleted boolean NOT NULL DEFAULT false,                  -- suppression logique
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- (Optionnel) Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employes_updated_at ON public.employes;
CREATE TRIGGER trg_employes_updated_at
BEFORE UPDATE ON public.employes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_employes_annee ON public.employes(annee_scolaire_id);
CREATE INDEX IF NOT EXISTS idx_employes_deleted ON public.employes(deleted);
CREATE INDEX IF NOT EXISTS idx_employes_nom_prenom ON public.employes(nom, prenom);