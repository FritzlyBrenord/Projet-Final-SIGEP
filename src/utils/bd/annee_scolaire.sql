-- =====================================================
-- SCRIPTS SQL POUR LE SYSTÈME DE GESTION SCOLAIRE
-- Institution Mixte Faustin Premier
-- =====================================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLE ANNEES_SCOLAIRES
-- Table principale qui contient toutes les années scolaires
-- =====================================================

CREATE TABLE annees_scolaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(20) NOT NULL UNIQUE, -- Format: "2024-2025"
    description TEXT,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    active BOOLEAN DEFAULT FALSE, -- Une seule année peut être active à la fois
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT check_annee_format CHECK (nom ~ '^\d{4}-\d{4}$'),
    CONSTRAINT check_dates_coherentes CHECK (date_fin > date_debut)
);

-- Index pour optimiser les recherches
CREATE INDEX idx_annees_scolaires_nom ON annees_scolaires(nom);
CREATE INDEX idx_annees_scolaires_active ON annees_scolaires(active);

-- Trigger pour s'assurer qu'une seule année est active
CREATE OR REPLACE FUNCTION ensure_single_active_year()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.active = TRUE THEN
        -- Désactiver toutes les autres années
        UPDATE annees_scolaires 
        SET active = FALSE 
        WHERE id != NEW.id AND active = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_active_year
    BEFORE INSERT OR UPDATE ON annees_scolaires
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_year();

-- =====================================================
-- 2. TABLE CLASSES
-- Classes liées à une année scolaire
-- =====================================================

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL, -- ex: "1ère Année Fondamentale"
    niveau VARCHAR(50) NOT NULL, -- ex: "1ère AF", "NSI"
    capacite_max INTEGER NOT NULL DEFAULT 30,
    annee_scolaire_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Clé étrangère
    CONSTRAINT fk_classes_annee_scolaire 
        FOREIGN KEY (annee_scolaire_id) 
        REFERENCES annees_scolaires(id) 
        ON DELETE CASCADE,
    
    -- Contraintes
    CONSTRAINT check_capacite_positive CHECK (capacite_max > 0),
    CONSTRAINT unique_classe_par_annee UNIQUE (nom, annee_scolaire_id)
);

-- Index pour optimiser les recherches
CREATE INDEX idx_classes_annee_scolaire ON classes(annee_scolaire_id);
CREATE INDEX idx_classes_niveau ON classes(niveau);

-- =====================================================
-- 3. TABLE SALLES
-- Salles liées à une classe
-- =====================================================

CREATE TABLE salles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL, -- ex: "Salle A1"
    capacite INTEGER NOT NULL DEFAULT 30,
    type VARCHAR(50) DEFAULT 'Classe', -- "Classe", "Laboratoire", "Bibliothèque"
    classe_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Clé étrangère
    CONSTRAINT fk_salles_classe 
        FOREIGN KEY (classe_id) 
        REFERENCES classes(id) 
        ON DELETE CASCADE,
    
    -- Contraintes
    CONSTRAINT check_capacite_salle_positive CHECK (capacite > 0),
    CONSTRAINT unique_salle_par_classe UNIQUE (nom, classe_id)
);

-- Index pour optimiser les recherches
CREATE INDEX idx_salles_classe ON salles(classe_id);
CREATE INDEX idx_salles_type ON salles(type);

-- =====================================================
-- 4. TABLE MATIERES
-- Matières enseignées dans une salle
-- =====================================================

CREATE TABLE matieres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL, -- ex: "Mathématiques"
    code VARCHAR(20), -- ex: "MATH"
    coefficient INTEGER NOT NULL DEFAULT 100,
    description TEXT,
    salle_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Clé étrangère
    CONSTRAINT fk_matieres_salle 
        FOREIGN KEY (salle_id) 
        REFERENCES salles(id) 
        ON DELETE CASCADE,
    
    -- Contraintes
    CONSTRAINT check_coefficient_positive CHECK (coefficient > 0),
    CONSTRAINT unique_matiere_par_salle UNIQUE (nom, salle_id)
);

-- Index pour optimiser les recherches
CREATE INDEX idx_matieres_salle ON matieres(salle_id);
CREATE INDEX idx_matieres_nom ON matieres(nom);
CREATE INDEX idx_matieres_code ON matieres(code);

-- =====================================================
-- 5. TABLE EMPLOIS_DU_TEMPS
-- Emplois du temps pour chaque salle
-- =====================================================

CREATE TYPE jour_semaine AS ENUM ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi');

CREATE TABLE emplois_du_temps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jour jour_semaine NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    matiere_id UUID NOT NULL,
    salle_id UUID NOT NULL,
    professeur VARCHAR(255), -- Nom du professeur (tableau temporaire)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Clés étrangères
    CONSTRAINT fk_emplois_matiere 
        FOREIGN KEY (matiere_id) 
        REFERENCES matieres(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_emplois_salle 
        FOREIGN KEY (salle_id) 
        REFERENCES salles(id) 
        ON DELETE CASCADE,
    
    -- Contraintes
    CONSTRAINT check_heures_coherentes CHECK (heure_fin > heure_debut),
    CONSTRAINT check_heures_valides CHECK (
        heure_debut >= '07:00:00' AND 
        heure_fin <= '17:00:00'
    ),
    -- Éviter les conflits d'horaires dans la même salle
    CONSTRAINT unique_creneau_salle UNIQUE (salle_id, jour, heure_debut, heure_fin)
);

-- Index pour optimiser les recherches
CREATE INDEX idx_emplois_salle ON emplois_du_temps(salle_id);
CREATE INDEX idx_emplois_matiere ON emplois_du_temps(matiere_id);
CREATE INDEX idx_emplois_jour ON emplois_du_temps(jour);
CREATE INDEX idx_emplois_horaires ON emplois_du_temps(heure_debut, heure_fin);

-- =====================================================
-- 6. FONCTIONS ET TRIGGERS POUR LA COHÉRENCE DES DONNÉES
-- =====================================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à toutes les tables
CREATE TRIGGER trigger_annees_scolaires_updated_at
    BEFORE UPDATE ON annees_scolaires
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_salles_updated_at
    BEFORE UPDATE ON salles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_matieres_updated_at
    BEFORE UPDATE ON matieres
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_emplois_du_temps_updated_at
    BEFORE UPDATE ON emplois_du_temps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 7. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour vérifier les conflits d'horaires
CREATE OR REPLACE FUNCTION check_horaire_conflict(
    p_salle_id UUID,
    p_jour jour_semaine,
    p_heure_debut TIME,
    p_heure_fin TIME,
    p_emploi_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO conflict_count
    FROM emplois_du_temps
    WHERE salle_id = p_salle_id
      AND jour = p_jour
      AND (p_emploi_id IS NULL OR id != p_emploi_id)
      AND (
          (p_heure_debut < heure_fin AND p_heure_fin > heure_debut)
      );
    
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques d'une année scolaire
CREATE OR REPLACE FUNCTION get_annee_stats(p_annee_id UUID)
RETURNS TABLE(
    nb_classes BIGINT,
    nb_salles BIGINT,
    nb_matieres BIGINT,
    nb_emplois BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM classes WHERE annee_scolaire_id = p_annee_id),
        (SELECT COUNT(*) FROM salles s 
         JOIN classes c ON s.classe_id = c.id 
         WHERE c.annee_scolaire_id = p_annee_id),
        (SELECT COUNT(*) FROM matieres m 
         JOIN salles s ON m.salle_id = s.id 
         JOIN classes c ON s.classe_id = c.id 
         WHERE c.annee_scolaire_id = p_annee_id),
        (SELECT COUNT(*) FROM emplois_du_temps e 
         JOIN salles s ON e.salle_id = s.id 
         JOIN classes c ON s.classe_id = c.id 
         WHERE c.annee_scolaire_id = p_annee_id);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. VUES UTILES
-- =====================================================

-- Vue pour afficher toutes les informations d'une année scolaire
CREATE VIEW v_annee_complete AS
SELECT 
    a.id as annee_id,
    a.nom as annee_nom,
    a.description as annee_description,
    a.active as annee_active,
    c.id as classe_id,
    c.nom as classe_nom,
    c.niveau as classe_niveau,
    s.id as salle_id,
    s.nom as salle_nom,
    s.capacite as salle_capacite,
    m.id as matiere_id,
    m.nom as matiere_nom,
    m.coefficient as matiere_coefficient,
    e.jour,
    e.heure_debut,
    e.heure_fin,
    e.professeur
FROM annees_scolaires a
LEFT JOIN classes c ON a.id = c.annee_scolaire_id
LEFT JOIN salles s ON c.id = s.classe_id
LEFT JOIN matieres m ON s.id = m.salle_id
LEFT JOIN emplois_du_temps e ON s.id = e.salle_id AND m.id = e.matiere_id;

-- Vue pour les conflits d'horaires
CREATE VIEW v_conflits_horaires AS
SELECT 
    e1.id as emploi1_id,
    e2.id as emploi2_id,
    s.nom as salle_nom,
    e1.jour,
    e1.heure_debut,
    e1.heure_fin,
    e1.professeur as prof1,
    e2.professeur as prof2,
    m1.nom as matiere1,
    m2.nom as matiere2
FROM emplois_du_temps e1
JOIN emplois_du_temps e2 ON e1.salle_id = e2.salle_id 
    AND e1.jour = e2.jour 
    AND e1.id < e2.id
    AND (e1.heure_debut < e2.heure_fin AND e1.heure_fin > e2.heure_debut)
JOIN salles s ON e1.salle_id = s.id
JOIN matieres m1 ON e1.matiere_id = m1.id
JOIN matieres m2 ON e2.matiere_id = m2.id;

-- =====================================================
-- 9. DONNÉES D'EXEMPLE (OPTIONNEL)
-- =====================================================

-- Insérer une année scolaire de test
INSERT INTO annees_scolaires (nom, description, date_debut, date_fin, active) 
VALUES 
    ('2024-2025', 'Année académique pour l''enseignement fondamental et secondaire à l''Institution Mixte Faustin Première', '2024-09-01', '2025-06-30', true),
    ('2023-2024', 'Année académique précédente', '2023-09-01', '2024-06-30', false);

-- Insérer des classes de test
INSERT INTO classes (nom, niveau, capacite_max, annee_scolaire_id)
SELECT 
    '1ère Année Fondamentale', '1ère AF', 30, id
FROM annees_scolaires WHERE nom = '2024-2025';

INSERT INTO classes (nom, niveau, capacite_max, annee_scolaire_id)
SELECT 
    '2e Année Fondamentale', '2e AF', 30, id
FROM annees_scolaires WHERE nom = '2024-2025';

-- =====================================================
-- 10. POLITIQUES DE SÉCURITÉ RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE annees_scolaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE salles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE emplois_du_temps ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations aux utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent tout faire" ON annees_scolaires
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Utilisateurs authentifiés peuvent tout faire" ON classes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Utilisateurs authentifiés peuvent tout faire" ON salles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Utilisateurs authentifiés peuvent tout faire" ON matieres
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Utilisateurs authentifiés peuvent tout faire" ON emplois_du_temps
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 11. COMMENTAIRES SUR LES TABLES ET COLONNES
-- =====================================================

COMMENT ON TABLE annees_scolaires IS 'Table principale contenant les années scolaires de l''institution';
COMMENT ON COLUMN annees_scolaires.nom IS 'Nom de l''année au format YYYY-YYYY (ex: 2024-2025)';
COMMENT ON COLUMN annees_scolaires.active IS 'Indique si cette année est l''année courante active';

COMMENT ON TABLE classes IS 'Classes organisées par année scolaire';
COMMENT ON COLUMN classes.niveau IS 'Niveau scolaire (1ère AF, 2e AF, NSI, etc.)';

COMMENT ON TABLE salles IS 'Salles de classe assignées à chaque classe';
COMMENT ON COLUMN salles.type IS 'Type de salle (Classe, Laboratoire, Bibliothèque, etc.)';

COMMENT ON TABLE matieres IS 'Matières enseignées dans chaque salle';
COMMENT ON COLUMN matieres.coefficient IS 'Coefficient de la matière pour le calcul des moyennes';

COMMENT ON TABLE emplois_du_temps IS 'Emplois du temps pour chaque salle et matière';
COMMENT ON COLUMN emplois_du_temps.professeur IS 'Nom du professeur (système temporaire)';

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Vérification finale
SELECT 'Installation terminée avec succès!' as message;