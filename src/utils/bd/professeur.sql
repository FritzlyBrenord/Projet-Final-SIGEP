-- =========================================
-- TABLES POUR LA GESTION DES PROFESSEURS
-- (Les tables annees_scolaires, classes, salles, matieres existent déjà)
-- =========================================

-- 1. TABLE PROFESSEURS
CREATE TABLE IF NOT EXISTS professeurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enseignant_id VARCHAR(50) NOT NULL, -- Identifiant interne de l'enseignant
    code VARCHAR(20) UNIQUE NOT NULL, -- Code unique du professeur (ex: PROF001)
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    date_embauche DATE,
    diplomes TEXT, -- Diplômes et qualifications
    statut VARCHAR(20) CHECK (statut IN ('actif', 'inactif')) DEFAULT 'actif',
    annee_scolaire_id UUID NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    deleted BOOLEAN DEFAULT FALSE, -- Suppression logique
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),    
);

-- 2. TABLE SEQUENCES (Assignations professeur -> classe/salle/matiere)
CREATE TABLE IF NOT EXISTS sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professeur_id UUID NOT NULL REFERENCES professeurs(id) ON DELETE CASCADE,
    classe UUID NOT NULL VARCHAR(20),,
    salle UUID NOT NULL VARCHAR(20),,
    matiere UUID NOT NULL VARCHAR(20),,
    deleted BOOLEAN DEFAULT FALSE, -- Suppression logique
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
);

-- =========================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- =========================================

-- Index sur la table professeurs
CREATE INDEX IF NOT EXISTS idx_professeurs_annee ON professeurs(annee_scolaire_id);
CREATE INDEX IF NOT EXISTS idx_professeurs_statut ON professeurs(statut);
CREATE INDEX IF NOT EXISTS idx_professeurs_deleted ON professeurs(deleted);
CREATE INDEX IF NOT EXISTS idx_professeurs_code ON professeurs(code);
CREATE INDEX IF NOT EXISTS idx_professeurs_email ON professeurs(email);

-- Index sur la table sequences
CREATE INDEX IF NOT EXISTS idx_sequences_professeur ON sequences(professeur_id);
CREATE INDEX IF NOT EXISTS idx_sequences_classe ON sequences(classe_id);
CREATE INDEX IF NOT EXISTS idx_sequences_salle ON sequences(salle_id);
CREATE INDEX IF NOT EXISTS idx_sequences_matiere ON sequences(matiere_id);
CREATE INDEX IF NOT EXISTS idx_sequences_deleted ON sequences(deleted);

-- Index composé pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_sequences_professeur_active ON sequences(professeur_id, deleted);

-- =========================================
-- FONCTIONS DE MISE À JOUR AUTOMATIQUE
-- =========================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour professeurs
CREATE TRIGGER update_professeurs_updated_at 
    BEFORE UPDATE ON professeurs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers pour sequences
CREATE TRIGGER update_sequences_updated_at 
    BEFORE UPDATE ON sequences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- VUES UTILES POUR LES REQUÊTES
-- =========================================

-- Vue complète des séquences avec toutes les informations
CREATE OR REPLACE VIEW v_sequences_complete AS
SELECT 
    s.id,
    s.professeur_id,
    s.classe_id,
    s.salle_id,
    s.matiere_id,
    s.deleted,
    s.created_at,
    s.updated_at,
    -- Informations du professeur
    CONCAT(p.prenom, ' ', p.nom) as professeur_nom,
    p.code as professeur_code,
    p.email as professeur_email,
    p.statut as professeur_statut,
    -- Informations des entités liées
    c.nom as classe_nom,
    sa.nom as salle_nom,
    m.nom as matiere_nom,
    m.coefficient as matiere_coefficient,
    -- Informations de l'année scolaire
    a.nom as annee_scolaire
FROM sequences s
    LEFT JOIN professeurs p ON s.professeur_id = p.id
    LEFT JOIN classes c ON s.classe_id = c.id
    LEFT JOIN salles sa ON s.salle_id = sa.id
    LEFT JOIN matieres m ON s.matiere_id = m.id
    LEFT JOIN annees_scolaires a ON p.annee_scolaire_id = a.id
WHERE s.deleted = FALSE AND p.deleted = FALSE;

-- Vue des professeurs actifs avec leurs statistiques
CREATE OR REPLACE VIEW v_professeurs_stats AS
SELECT 
    p.id,
    p.code,
    p.nom,
    p.prenom,
    p.email,
    p.telephone,
    p.statut,
    p.annee_scolaire_id,
    a.nom as annee_scolaire,
    COUNT(s.id) as nombre_sequences,
    COUNT(DISTINCT s.classe_id) as nombre_classes,
    COUNT(DISTINCT s.salle_id) as nombre_salles,
    COUNT(DISTINCT s.matiere_id) as nombre_matieres
FROM professeurs p
    LEFT JOIN sequences s ON p.id = s.professeur_id AND s.deleted = FALSE
    LEFT JOIN annees_scolaires a ON p.annee_scolaire_id = a.id
WHERE p.deleted = FALSE
GROUP BY p.id, p.code, p.nom, p.prenom, p.email, p.telephone, p.statut, p.annee_scolaire_id, a.nom;




-- =========================================
-- DONNÉES DE TEST (OPTIONNEL)
-- =========================================

-- Exemples d'insertion (décommenter pour tester)
/*
-- Supposons qu'il existe une année scolaire avec id = 'uuid-annee-2024-2025'
INSERT INTO professeurs (enseignant_id, code, nom, prenom, email, telephone, adresse, date_embauche, diplomes, statut, annee_scolaire_id) VALUES
('ENS001', 'PROF001', 'Dupont', 'Marie', 'marie.dupont@ecole.ht', '+509 1234 5678', 'Port-au-Prince, Haïti', '2020-09-01', 'Licence en Lettres Modernes', 'actif', 'uuid-annee-2024-2025'),
('ENS002', 'PROF002', 'Martin', 'Jean', 'jean.martin@ecole.ht', '+509 2345 6789', 'Port-au-Prince, Haïti', '2019-09-01', 'Master en Mathématiques', 'actif', 'uuid-annee-2024-2025'),
('ENS003', 'PROF003', 'Leblanc', 'Sophie', 'sophie.leblanc@ecole.ht', '+509 3456 7890', 'Port-au-Prince, Haïti', '2021-09-01', 'Licence en Biologie', 'actif', 'uuid-annee-2024-2025');
*/