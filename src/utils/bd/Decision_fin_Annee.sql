-- Table pour les décisions de fin d'année
CREATE TABLE decision_de_fin_annee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eleve_id UUID NOT NULL,
    annee_scolaire_id UUID NOT NULL,
    observation TEXT,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('ADMIS', 'REDOUBLER', 'EXPULSER')),
    date_decision DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted BOOLEAN DEFAULT FALSE,
    
    -- Contraintes de clés étrangères
    CONSTRAINT fk_decision_eleve 
        FOREIGN KEY (eleve_id) 
        REFERENCES eleves(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_decision_annee_scolaire 
        FOREIGN KEY (annee_scolaire_id) 
        REFERENCES annees_scolaires(id) 
        ON DELETE CASCADE,
    
    -- Contrainte d'unicité : un élève ne peut avoir qu'une seule décision par année scolaire
    CONSTRAINT unique_decision_eleve_annee 
        UNIQUE (eleve_id, annee_scolaire_id)
);

-- Index pour améliorer les performances
CREATE INDEX idx_decision_eleve ON decision_de_fin_annee(eleve_id);
CREATE INDEX idx_decision_annee_scolaire ON decision_de_fin_annee(annee_scolaire_id);
CREATE INDEX idx_decision_deleted ON decision_de_fin_annee(deleted);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_decision_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_decision_updated_at
    BEFORE UPDATE ON decision_de_fin_annee
    FOR EACH ROW
    EXECUTE FUNCTION update_decision_updated_at();

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE decision_de_fin_annee IS 'Table des décisions de fin d''année pour les élèves';
COMMENT ON COLUMN decision_de_fin_annee.id IS 'Identifiant unique de la décision';
COMMENT ON COLUMN decision_de_fin_annee.eleve_id IS 'Référence vers l''élève';
COMMENT ON COLUMN decision_de_fin_annee.annee_scolaire_id IS 'Référence vers l''année scolaire';
COMMENT ON COLUMN decision_de_fin_annee.observation IS 'Observation sur la décision';
COMMENT ON COLUMN decision_de_fin_annee.decision IS 'Décision prise (ADMIS, REDOUBLER, EXPULSER)';
COMMENT ON COLUMN decision_de_fin_annee.date_decision IS 'Date de prise de décision';
COMMENT ON COLUMN decision_de_fin_annee.created_at IS 'Date de création de l''enregistrement';
COMMENT ON COLUMN decision_de_fin_annee.updated_at IS 'Date de dernière modification';
COMMENT ON COLUMN decision_de_fin_annee.deleted IS 'Indicateur de suppression logique';