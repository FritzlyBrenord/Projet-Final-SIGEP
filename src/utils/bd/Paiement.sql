-- =============================================
-- SYSTÈME DE GESTION DES FRAIS DE SCOLARITÉ
-- Tables avec relations Foreign Key style Supabase
-- =============================================

-- Table des types de frais
CREATE TABLE types_frais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    montant_defaut DECIMAL(10,2) NOT NULL DEFAULT 0,
    description TEXT,
    obligatoire BOOLEAN NOT NULL DEFAULT false,
    annee_scolaire_id UUID NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes
    CONSTRAINT ck_types_frais_montant_positif 
        CHECK (montant_defaut >= 0),
    
    CONSTRAINT ck_types_frais_nom_not_empty 
        CHECK (trim(nom) != ''),
    
    -- Contrainte d'unicité : un nom par année scolaire (pour les non supprimés)
    CONSTRAINT uq_types_frais_nom_annee 
        UNIQUE (nom, annee_scolaire_id) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Table des frais personnalisés par classe
CREATE TABLE frais_par_classe (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    classe VARCHAR(50) NOT NULL,
    type_frais_id UUID NOT NULL REFERENCES types_frais(id) ON DELETE CASCADE,
    montant DECIMAL(10,2) NOT NULL DEFAULT 0,
    annee_scolaire_id UUID NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes
    CONSTRAINT ck_frais_par_classe_montant_positif 
        CHECK (montant >= 0),
    
    CONSTRAINT ck_frais_par_classe_classe_not_empty 
        CHECK (trim(classe) != ''),
    
    -- Contrainte d'unicité : une classe/type de frais par année scolaire (pour les non supprimés)
    CONSTRAINT uq_frais_par_classe_unique 
        UNIQUE (classe, type_frais_id, annee_scolaire_id) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Table des paiements
CREATE TABLE paiements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    type_frais_id UUID NOT NULL REFERENCES types_frais(id) ON DELETE RESTRICT,
    montant_du DECIMAL(10,2) NOT NULL DEFAULT 0,
    montant_paye DECIMAL(10,2) NOT NULL DEFAULT 0,
    date_paiement DATE NOT NULL,
    heure_paiement TIME NOT NULL,
    remarques TEXT,
    numero_recu VARCHAR(50) NOT NULL,
    annee_scolaire_id UUID NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes
    CONSTRAINT ck_paiements_montants_positifs 
        CHECK (montant_du >= 0 AND montant_paye >= 0),
    
    CONSTRAINT ck_paiements_numero_recu_not_empty 
        CHECK (trim(numero_recu) != ''),
    
    -- Contrainte d'unicité sur le numéro de reçu
    CONSTRAINT uq_paiements_numero_recu 
        UNIQUE (numero_recu)
);

-- =============================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- =============================================

-- Index sur les types de frais
CREATE INDEX idx_types_frais_annee_scolaire ON types_frais(annee_scolaire_id) WHERE NOT deleted;
CREATE INDEX idx_types_frais_nom ON types_frais(nom) WHERE NOT deleted;
CREATE INDEX idx_types_frais_obligatoire ON types_frais(obligatoire) WHERE NOT deleted;

-- Index sur les frais par classe
CREATE INDEX idx_frais_par_classe_annee_scolaire ON frais_par_classe(annee_scolaire_id) WHERE NOT deleted;
CREATE INDEX idx_frais_par_classe_type_frais ON frais_par_classe(type_frais_id) WHERE NOT deleted;
CREATE INDEX idx_frais_par_classe_classe ON frais_par_classe(classe) WHERE NOT deleted;

-- Index sur les paiements
CREATE INDEX idx_paiements_annee_scolaire ON paiements(annee_scolaire_id) WHERE NOT deleted;
CREATE INDEX idx_paiements_eleve ON paiements(eleve_id) WHERE NOT deleted;
CREATE INDEX idx_paiements_type_frais ON paiements(type_frais_id) WHERE NOT deleted;
CREATE INDEX idx_paiements_date ON paiements(date_paiement) WHERE NOT deleted;
CREATE INDEX idx_paiements_numero_recu ON paiements(numero_recu) WHERE NOT deleted;

-- Index composites pour les requêtes fréquentes
CREATE INDEX idx_paiements_eleve_annee ON paiements(eleve_id, annee_scolaire_id) WHERE NOT deleted;
CREATE INDEX idx_paiements_eleve_type_frais ON paiements(eleve_id, type_frais_id) WHERE NOT deleted;
CREATE INDEX idx_paiements_date_range ON paiements(date_paiement, annee_scolaire_id) WHERE NOT deleted;

-- =============================================
-- TRIGGERS POUR LA MISE À JOUR AUTOMATIQUE
-- =============================================

-- Fonction générique pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER trigger_types_frais_updated_at 
    BEFORE UPDATE ON types_frais 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_frais_par_classe_updated_at 
    BEFORE UPDATE ON frais_par_classe 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_paiements_updated_at 
    BEFORE UPDATE ON paiements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

