-- Table pour les notes des élèves
-- Cette table stocke les notes des élèves par matière, trimestre et année scolaire

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    matiere_id UUID NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
    trimestre INTEGER NOT NULL CHECK (trimestre IN (1, 2, 3)),
    note DECIMAL(5,2) NOT NULL CHECK (note >= 0 AND note <= 100),
    observation TEXT,
    date_ajout DATE NOT NULL DEFAULT CURRENT_DATE,
    annee_scolaire_id UUID NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte unique pour éviter les doublons de notes pour le même élève, matière et trimestre
    UNIQUE(eleve_id, matiere_id, trimestre, annee_scolaire_id)
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_notes_eleve_id ON notes(eleve_id);
CREATE INDEX IF NOT EXISTS idx_notes_matiere_id ON notes(matiere_id);
CREATE INDEX IF NOT EXISTS idx_notes_trimestre ON notes(trimestre);
CREATE INDEX IF NOT EXISTS idx_notes_annee_scolaire_id ON notes(annee_scolaire_id);
CREATE INDEX IF NOT EXISTS idx_notes_deleted ON notes(deleted);
CREATE INDEX IF NOT EXISTS idx_notes_date_ajout ON notes(date_ajout);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notes_eleve_matiere_trimestre ON notes(eleve_id, matiere_id, trimestre);
CREATE INDEX IF NOT EXISTS idx_notes_annee_trimestre ON notes(annee_scolaire_id, trimestre);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_updated_at 
    BEFORE UPDATE ON notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE notes IS 'Table des notes des élèves par matière et trimestre';
COMMENT ON COLUMN notes.id IS 'Identifiant unique de la note';
COMMENT ON COLUMN notes.eleve_id IS 'Référence vers l''élève';
COMMENT ON COLUMN notes.matiere_id IS 'Référence vers la matière';
COMMENT ON COLUMN notes.trimestre IS 'Numéro du trimestre (1, 2 ou 3)';
COMMENT ON COLUMN notes.note IS 'Note sur 100 points';
COMMENT ON COLUMN notes.observation IS 'Observation optionnelle sur la note';
COMMENT ON COLUMN notes.date_ajout IS 'Date d''ajout de la note';
COMMENT ON COLUMN notes.annee_scolaire_id IS 'Référence vers l''année scolaire';
COMMENT ON COLUMN notes.deleted IS 'Indicateur de suppression logique';
COMMENT ON COLUMN notes.created_at IS 'Date de création de l''enregistrement';
COMMENT ON COLUMN notes.updated_at IS 'Date de dernière modification';

-- Vue pour faciliter les requêtes avec les noms des élèves et matières
CREATE OR REPLACE VIEW notes_avec_details AS
SELECT 
    n.id,
    n.eleve_id,
    n.matiere_id,
    n.trimestre,
    n.note,
    n.observation,
    n.date_ajout,
    n.annee_scolaire_id,
    n.deleted,
    n.created_at,
    n.updated_at,
    e.code as eleve_code,
    e.nom as eleve_nom,
    e.prenom as eleve_prenom,
    e.classe_id,
    e.salle_id,
    m.nom as matiere_nom,
    m.coefficient as matiere_coefficient,
    c.nom as classe_nom,
    s.nom as salle_nom,
    a.nom as annee_scolaire_nom
FROM notes n
JOIN eleves e ON n.eleve_id = e.id
JOIN matieres m ON n.matiere_id = m.id
JOIN salles s ON e.salle_id = s.id
JOIN classes c ON s.classe_id = c.id
JOIN annees_scolaires a ON n.annee_scolaire_id = a.id
WHERE n.deleted = FALSE AND e.deleted = FALSE;

-- Fonction pour calculer la moyenne générale d'un élève pour un trimestre
CREATE OR REPLACE FUNCTION calculer_moyenne_trimestre(
    p_eleve_id UUID,
    p_trimestre INTEGER,
    p_annee_scolaire_id UUID
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    moyenne DECIMAL(5,2);
BEGIN
    SELECT 
        COALESCE(
            SUM(n.note * m.coefficient) / NULLIF(SUM(m.coefficient), 0),
            0
        )
    INTO moyenne
    FROM notes n
    JOIN matieres m ON n.matiere_id = m.id
    WHERE n.eleve_id = p_eleve_id
      AND n.trimestre = p_trimestre
      AND n.annee_scolaire_id = p_annee_scolaire_id
      AND n.deleted = FALSE;
    
    RETURN COALESCE(moyenne, 0);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer la moyenne générale annuelle d'un élève
CREATE OR REPLACE FUNCTION calculer_moyenne_annuelle(
    p_eleve_id UUID,
    p_annee_scolaire_id UUID
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    moyenne DECIMAL(5,2);
BEGIN
    SELECT 
        COALESCE(
            AVG(calculer_moyenne_trimestre(p_eleve_id, trimestre, p_annee_scolaire_id)),
            0
        )
    INTO moyenne
    FROM generate_series(1, 3) AS trimestre;
    
    RETURN COALESCE(moyenne, 0);
END;
$$ LANGUAGE plpgsql;

-- Règles de politique de sécurité (RLS) si nécessaire
-- ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Exemple de données de test (à supprimer en production)
-- INSERT INTO notes (eleve_id, matiere_id, trimestre, note, observation, annee_scolaire_id)
-- VALUES 
--     ('eleve-uuid-1', 'matiere-uuid-1', 1, 85.5, 'Très bon travail', 'annee-uuid-1'),
--     ('eleve-uuid-1', 'matiere-uuid-2', 1, 78.0, 'Peut mieux faire', 'annee-uuid-1'),
--     ('eleve-uuid-2', 'matiere-uuid-1', 1, 92.0, 'Excellent', 'annee-uuid-1');