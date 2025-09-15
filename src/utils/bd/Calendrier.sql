-- Activer l'extension nécessaire pour gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- TABLES POUR LE CALENDRIER SCOLAIRE - VERSION EXACTE
-- =====================================================

-- Table des événements (correspond à l'interface Event/Evenement)
CREATE TABLE evenements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    date_debut DATE NOT NULL,
    date_fin DATE,
    heure_debut TIME,
    heure_fin TIME,
    type VARCHAR(20) NOT NULL CHECK (type IN ('exam', 'vacation', 'holiday', 'school-start', 'activity', 'reunion', 'formation')),
    matiere VARCHAR(100),
    classe VARCHAR(50),
    salle VARCHAR(50),
    organisateur VARCHAR(100),
    participants TEXT, -- JSON stringifié ["id1","id2",...]
    couleur VARCHAR(20),
    rappel BOOLEAN DEFAULT false,
    annee_scolaire_id UUID NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des horaires (correspond à l'interface Schedule/Horaire)
CREATE TABLE horaires (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    classe VARCHAR(50) NOT NULL,
    salle VARCHAR(50) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    annee_scolaire_id UUID NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des créneaux horaires (correspond aux schedule details avec subjects[])
CREATE TABLE creneaux_horaires (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    horaire_id UUID NOT NULL REFERENCES horaires(id) ON DELETE CASCADE,
    jour_semaine INTEGER CHECK (jour_semaine >= 0 AND jour_semaine <= 6), -- 0=Dimanche, 1=Lundi, etc.
    date_specifique DATE, -- Pour des créneaux sur une date précise
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    matieres JSONB NOT NULL, -- Array de matières ["Français", "Maths", ...]
    professeur VARCHAR(100),
    salle_specifique VARCHAR(50),
    notes TEXT,
    annee_scolaire_id UUID NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte : doit avoir soit jour_semaine soit date_specifique
    CONSTRAINT check_jour_ou_date CHECK (
        (jour_semaine IS NOT NULL AND date_specifique IS NULL) OR
        (jour_semaine IS NULL AND date_specifique IS NOT NULL)
    ),
    
    -- Contrainte : heure_fin > heure_debut
    CONSTRAINT check_heures_valides CHECK (heure_fin > heure_debut)
);

-- =====================================================
-- INDEX ESSENTIELS
-- =====================================================

-- Index pour les événements
CREATE INDEX idx_evenements_annee_scolaire ON evenements(annee_scolaire_id) WHERE deleted = false;
CREATE INDEX idx_evenements_date_debut ON evenements(date_debut) WHERE deleted = false;
CREATE INDEX idx_evenements_classe ON evenements(classe) WHERE deleted = false AND classe IS NOT NULL;

-- Index pour les horaires
CREATE INDEX idx_horaires_annee_scolaire ON horaires(annee_scolaire_id) WHERE deleted = false;
CREATE INDEX idx_horaires_classe ON horaires(classe) WHERE deleted = false;

-- Index pour les créneaux horaires
CREATE INDEX idx_creneaux_horaire_id ON creneaux_horaires(horaire_id) WHERE deleted = false;
CREATE INDEX idx_creneaux_jour_semaine ON creneaux_horaires(jour_semaine) WHERE deleted = false;

-- =====================================================
-- TRIGGERS POUR AUTO-UPDATE DES TIMESTAMPS
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_evenements_updated_at 
    BEFORE UPDATE ON evenements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_horaires_updated_at 
    BEFORE UPDATE ON horaires 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creneaux_horaires_updated_at 
    BEFORE UPDATE ON creneaux_horaires 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONTRAINTES DE VALIDATION
-- =====================================================

-- Contrainte pour éviter les dates de fin antérieures aux dates de début
ALTER TABLE evenements ADD CONSTRAINT check_dates_evenement 
    CHECK (date_fin IS NULL OR date_fin >= date_debut);

ALTER TABLE horaires ADD CONSTRAINT check_dates_horaire 
    CHECK (date_fin >= date_debut);

-- Contrainte pour les heures d'événements (si heure_debut alors heure_fin obligatoire et > heure_debut)
ALTER TABLE evenements ADD CONSTRAINT check_heures_evenement 
    CHECK (
        (heure_debut IS NULL AND heure_fin IS NULL) OR
        (heure_debut IS NOT NULL AND heure_fin IS NOT NULL AND heure_fin > heure_debut)
    );