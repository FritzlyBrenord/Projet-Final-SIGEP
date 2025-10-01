-- Script SQL pour ajouter la colonne NIF/CIN à la table professeurs
-- Exécuter cette requête dans votre base de données PostgreSQL

-- Ajouter la colonne nif_cin à la table professeurs
ALTER TABLE public.professeurs 
ADD COLUMN nif_cin VARCHAR(13);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.professeurs.nif_cin IS 'Numéro d''identification fiscale ou carte d''identité nationale (NIF/CIN) - Format: 10 chiffres, avec tirets si commence par 0 (ex: 002-435-893-3)';

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_professeurs_nif_cin ON public.professeurs USING btree (nif_cin);

-- Ajouter une contrainte pour s'assurer que le NIF/CIN contient uniquement des chiffres et des tirets
-- (optionnel, peut être ajouté si vous voulez une validation stricte au niveau base de données)
-- ALTER TABLE public.professeurs 
-- ADD CONSTRAINT chk_nif_cin_format 
-- CHECK (nif_cin IS NULL OR nif_cin ~ '^[0-9-]+$');

-- Mettre à jour les enregistrements existants (optionnel)
-- Si vous voulez donner une valeur par défaut aux professeurs existants
-- UPDATE public.professeurs 
-- SET nif_cin = '' 
-- WHERE nif_cin IS NULL;

