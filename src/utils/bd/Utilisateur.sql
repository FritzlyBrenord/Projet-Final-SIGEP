-- ======================================================
-- CRÉATION DE LA TABLE UTILISATEUR POUR SUPABASE
-- ======================================================

-- Suppression de la table si elle existe (pour recréation)
DROP TABLE IF EXISTS public."Utilisateur" CASCADE;

-- Création de la table Utilisateur
CREATE TABLE public."Utilisateur" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_connexion VARCHAR(255) NOT NULL UNIQUE,
    password_connexion VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Administrateur', 'Utilisateur')),
    employer_id UUID NOT NULL,
    isBloquer BOOLEAN DEFAULT FALSE,
    derniere_connexion TIMESTAMPTZ,
    autorisation JSON B
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- ======================================================

-- Index pour les recherches par email (authentification)
CREATE INDEX idx_utilisateur_email ON public."Utilisateur"(email_connexion);

-- Index pour les recherches par employer_id (jointures)
CREATE INDEX idx_utilisateur_employer_id ON public."Utilisateur"(employer_id);

-- Index pour filtrer par rôle
CREATE INDEX idx_utilisateur_role ON public."Utilisateur"(role);

-- Index pour filtrer les utilisateurs bloqués
CREATE INDEX idx_utilisateur_is_bloquer ON public."Utilisateur"(isBloquer);

-- Index pour trier par date de création
CREATE INDEX idx_utilisateur_created_at ON public."Utilisateur"(created_at DESC);

-- ======================================================
-- CONTRAINTES ET RELATIONS
-- ======================================================

-- Contrainte de clé étrangère vers la table employes
ALTER TABLE public."Utilisateur" 
ADD CONSTRAINT fk_utilisateur_employer 
FOREIGN KEY (employer_id) REFERENCES public."employes"(id) ON DELETE CASCADE;

-- Contrainte pour s'assurer que l'email est valide
ALTER TABLE public."Utilisateur" 
ADD CONSTRAINT chk_email_format 
CHECK (email_connexion ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- ======================================================
-- TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- ======================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at à chaque modification
CREATE TRIGGER trigger_update_utilisateur_updated_at
    BEFORE UPDATE ON public."Utilisateur"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ======================================================
-- POLITIQUES DE SÉCURITÉ RLS (Row Level Security)
-- ======================================================

-- Activer RLS sur la table
ALTER TABLE public."Utilisateur" ENABLE ROW LEVEL SECURITY;

-- Politique pour les administrateurs (accès complet)
CREATE POLICY "Administrateurs_acces_complet" ON public."Utilisateur"
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public."Utilisateur" u
            INNER JOIN public."employes" e ON u.employer_id = e.id
            WHERE u.email_connexion = auth.jwt() ->> 'email'
            AND u.role = 'Administrateur'
            AND u.isBloquer = FALSE
            AND (e.deleted = FALSE OR e.deleted IS NULL)
        )
    );

-- Politique pour les utilisateurs normaux (lecture de leur propre profil)
CREATE POLICY "Utilisateurs_propre_profil" ON public."Utilisateur"
    FOR SELECT 
    TO authenticated
    USING (
        email_connexion = auth.jwt() ->> 'email'
        AND isBloquer = FALSE
    );

-- Politique pour la mise à jour du profil (utilisateurs peuvent seulement modifier certains champs)
CREATE POLICY "Utilisateurs_modifier_profil" ON public."Utilisateur"
    FOR UPDATE 
    TO authenticated
    USING (
        email_connexion = auth.jwt() ->> 'email'
        AND isBloquer = FALSE
    )
    WITH CHECK (
        email_connexion = auth.jwt() ->> 'email'
        -- Les utilisateurs ne peuvent pas modifier leur rôle, employer_id ou statut de blocage
        -- Ces vérifications doivent être faites au niveau applicatif
    );

-- ======================================================
-- FONCTIONS UTILITAIRES
-- ======================================================

-- Fonction pour vérifier si un utilisateur est administrateur
CREATE OR REPLACE FUNCTION is_admin_user(user_email TEXT DEFAULT auth.jwt() ->> 'email')
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public."Utilisateur" u
        INNER JOIN public."employes" e ON u.employer_id = e.id
        WHERE u.email_connexion = user_email
        AND u.role = 'Administrateur'
        AND u.isBloquer = FALSE
        AND (e.deleted = FALSE OR e.deleted IS NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier l'accès utilisateur
CREATE OR REPLACE FUNCTION can_user_access(user_email TEXT DEFAULT auth.jwt() ->> 'email')
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public."Utilisateur" u
        INNER JOIN public."employes" e ON u.employer_id = e.id
        WHERE u.email_connexion = user_email
        AND u.isBloquer = FALSE
        AND (e.deleted = FALSE OR e.deleted IS NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les informations complètes d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_with_employer_info(user_email TEXT DEFAULT auth.jwt() ->> 'email')
RETURNS TABLE (
    user_id UUID,
    email_connexion VARCHAR,
    role VARCHAR,
    employer_nom VARCHAR,
    employer_prenom VARCHAR,
    employer_email VARCHAR,
    employer_departement VARCHAR,
    employer_fonction VARCHAR,
    derniere_connexion TIMESTAMPTZ,
    is_blocked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email_connexion,
        u.role,
        e.nom,
        e.prenom,
        e.email,
        e.departement,
        e.fonction,
        u.derniere_connexion,
        u.isBloquer
    FROM public."Utilisateur" u
    INNER JOIN public."employes" e ON u.employer_id = e.id
    WHERE u.email_connexion = user_email
    AND (e.deleted = FALSE OR e.deleted IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les utilisateurs par rôle
CREATE OR REPLACE FUNCTION count_users_by_role()
RETURNS TABLE (
    role_name VARCHAR,
    user_count BIGINT,
    active_count BIGINT,
    blocked_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.role as role_name,
        COUNT(*) as user_count,
        COUNT(*) FILTER (WHERE u.isBloquer = FALSE) as active_count,
        COUNT(*) FILTER (WHERE u.isBloquer = TRUE) as blocked_count
    FROM public."Utilisateur" u
    INNER JOIN public."employes" e ON u.employer_id = e.id
    WHERE (e.deleted = FALSE OR e.deleted IS NULL)
    GROUP BY u.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

