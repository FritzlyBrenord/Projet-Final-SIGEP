-- ========================================
-- TABLE: system_activities
-- Description: Traçabilité complète du système
-- ========================================

CREATE TABLE system_activities (
  -- Identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Information de l'action
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'ajout', 
    'modification', 
    'suppression', 
    'reinscription',
    'connexion',
    'deconnexion',
    'consultation',
    'export',
    'import'
  )),
  
  module VARCHAR(100) NOT NULL CHECK (module IN (
    'Gestion Élèves',
    'Notes',
    'Paiements',
    'Professeurs',
    'Employés',
    'Paramètres',
    'Authentification',
    'Rapports',
    'Calendrier',
    'Système'
  )),
  
  -- Détails de l'activité
  title VARCHAR(255) NOT NULL,
  details TEXT,
  
  -- Entité concernée (table source + ID)
  source_table VARCHAR(100),
  entity_id VARCHAR(255),
  
  -- Utilisateur qui a effectué l'action
  user_id UUID NOT NULL REFERENCES "Utilisateur"(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  user_role VARCHAR(50),
  
  -- Année scolaire
  annee_scolaire_id VARCHAR(100),
  
  -- Adresse IP et User Agent
  ip_address VARCHAR(50),
  user_agent TEXT,
  
  -- Données supplémentaires (JSON pour flexibilité)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES "Utilisateur"(id)
);

-- ========================================
-- TABLE: activity_settings
-- Description: Configuration de la suppression automatique
-- ========================================

CREATE TABLE activity_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Suppression automatique
  auto_delete_enabled BOOLEAN DEFAULT FALSE,
  auto_delete_days INTEGER DEFAULT 30 CHECK (auto_delete_days IN (
    5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 
    55, 60, 65, 70, 75, 80, 85, 90, 95, 100
  )),
  
  -- Dernière exécution du nettoyage
  last_cleanup_at TIMESTAMPTZ,
  
  -- Configuration
  max_activities INTEGER DEFAULT 1000,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES "Utilisateur"(id)
);

-- Insérer la configuration par défaut
INSERT INTO activity_settings (
  auto_delete_enabled, 
  auto_delete_days, 
  max_activities
) VALUES (
  FALSE, 
  30, 
  1000
) ON CONFLICT DO NOTHING;

-- ========================================
-- INDEX pour optimiser les performances
-- ========================================

CREATE INDEX idx_activities_created_at ON system_activities(created_at DESC);
CREATE INDEX idx_activities_user_id ON system_activities(user_id);
CREATE INDEX idx_activities_module ON system_activities(module);
CREATE INDEX idx_activities_action ON system_activities(action);
CREATE INDEX idx_activities_annee ON system_activities(annee_scolaire_id);
CREATE INDEX idx_activities_deleted ON system_activities(deleted) WHERE deleted = FALSE;
CREATE INDEX idx_activities_source ON system_activities(source_table, entity_id);

-- Index composite pour les requêtes fréquentes
CREATE INDEX idx_activities_user_date ON system_activities(user_id, created_at DESC);
CREATE INDEX idx_activities_module_date ON system_activities(module, created_at DESC);

-- ========================================
-- FONCTION: Nettoyage automatique
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS INTEGER AS $$
DECLARE
  settings_record RECORD;
  deleted_count INTEGER;
  cutoff_date TIMESTAMPTZ;
BEGIN
  -- Récupérer les paramètres
  SELECT * INTO settings_record FROM activity_settings LIMIT 1;
  
  -- Si la suppression auto n'est pas activée, sortir
  IF NOT settings_record.auto_delete_enabled THEN
    RETURN 0;
  END IF;
  
  -- Calculer la date limite
  cutoff_date := NOW() - (settings_record.auto_delete_days || ' days')::INTERVAL;
  
  -- Supprimer les anciennes activités (soft delete)
  UPDATE system_activities
  SET 
    deleted = TRUE,
    deleted_at = NOW()
  WHERE 
    created_at < cutoff_date
    AND deleted = FALSE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Mettre à jour la date du dernier nettoyage
  UPDATE activity_settings
  SET last_cleanup_at = NOW();
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FONCTION: Trigger pour limiter le nombre d'activités
-- ========================================

CREATE OR REPLACE FUNCTION enforce_max_activities()
RETURNS TRIGGER AS $$
DECLARE
  settings_record RECORD;
  current_count INTEGER;
  excess_count INTEGER;
BEGIN
  -- Récupérer les paramètres
  SELECT * INTO settings_record FROM activity_settings LIMIT 1;
  
  -- Compter les activités non supprimées
  SELECT COUNT(*) INTO current_count 
  FROM system_activities 
  WHERE deleted = FALSE;
  
  -- Si on dépasse la limite
  IF current_count > settings_record.max_activities THEN
    excess_count := current_count - settings_record.max_activities;
    
    -- Supprimer les plus anciennes (soft delete)
    UPDATE system_activities
    SET 
      deleted = TRUE,
      deleted_at = NOW()
    WHERE id IN (
      SELECT id 
      FROM system_activities 
      WHERE deleted = FALSE
      ORDER BY created_at ASC
      LIMIT excess_count
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_max_activities
AFTER INSERT ON system_activities
FOR EACH STATEMENT
EXECUTE FUNCTION enforce_max_activities();

-- ========================================
-- FONCTION: Ajouter une activité (helper)
-- ========================================

CREATE OR REPLACE FUNCTION log_activity(
  p_action VARCHAR,
  p_module VARCHAR,
  p_title VARCHAR,
  p_details TEXT,
  p_user_id UUID,
  p_user_email VARCHAR,
  p_user_name VARCHAR DEFAULT NULL,
  p_user_role VARCHAR DEFAULT NULL,
  p_source_table VARCHAR DEFAULT NULL,
  p_entity_id VARCHAR DEFAULT NULL,
  p_annee_scolaire_id VARCHAR DEFAULT NULL,
  p_ip_address VARCHAR DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO system_activities (
    action,
    module,
    title,
    details,
    user_id,
    user_email,
    user_name,
    user_role,
    source_table,
    entity_id,
    annee_scolaire_id,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_action,
    p_module,
    p_title,
    p_details,
    p_user_id,
    p_user_email,
    p_user_name,
    p_user_role,
    p_source_table,
    p_entity_id,
    p_annee_scolaire_id,
    p_ip_address,
    p_user_agent,
    p_metadata
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VUES utiles
-- ========================================

-- Vue des activités récentes (non supprimées)
CREATE OR REPLACE VIEW v_recent_activities AS
SELECT 
  a.id,
  a.action,
  a.module,
  a.title,
  a.details,
  a.source_table,
  a.entity_id,
  a.user_id,
  a.user_email,
  a.user_name,
  a.user_role,
  a.annee_scolaire_id,
  a.ip_address,
  a.created_at,
  a.metadata
FROM system_activities a
WHERE a.deleted = FALSE
ORDER BY a.created_at DESC;

-- Vue des statistiques par module
CREATE OR REPLACE VIEW v_activity_stats_by_module AS
SELECT 
  module,
  COUNT(*) as total_activities,
  COUNT(CASE WHEN action = 'ajout' THEN 1 END) as total_ajouts,
  COUNT(CASE WHEN action = 'modification' THEN 1 END) as total_modifications,
  COUNT(CASE WHEN action = 'suppression' THEN 1 END) as total_suppressions,
  COUNT(CASE WHEN action = 'connexion' THEN 1 END) as total_connexions,
  MAX(created_at) as derniere_activite
FROM system_activities
WHERE deleted = FALSE
GROUP BY module;

-- Vue des activités par utilisateur
CREATE OR REPLACE VIEW v_activity_stats_by_user AS
SELECT 
  user_id,
  user_email,
  user_name,
  user_role,
  COUNT(*) as total_activities,
  MAX(created_at) as derniere_activite
FROM system_activities
WHERE deleted = FALSE
GROUP BY user_id, user_email, user_name, user_role;

-- ========================================
-- POLITIQUE RLS (Row Level Security) - Optionnel
-- ========================================

-- Activer RLS
ALTER TABLE system_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_settings ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire
CREATE POLICY "Lecture publique activités"
ON system_activities FOR SELECT
TO authenticated
USING (deleted = FALSE);

-- Politique: Seuls les admins peuvent modifier les paramètres
CREATE POLICY "Admin seul pour settings"
ON activity_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Utilisateur" 
    WHERE id = auth.uid() 
    AND role IN ('Administrateur', 'Super Administrateur')
  )
);

-- ========================================
-- COMMENTAIRES
-- ========================================

COMMENT ON TABLE system_activities IS 'Traçabilité complète de toutes les actions du système';
COMMENT ON TABLE activity_settings IS 'Configuration de la gestion automatique des activités';
COMMENT ON COLUMN system_activities.action IS 'Type d''action effectuée';
COMMENT ON COLUMN system_activities.module IS 'Module concerné par l''action';
COMMENT ON COLUMN system_activities.metadata IS 'Données JSON supplémentaires flexibles';
COMMENT ON FUNCTION cleanup_old_activities() IS 'Nettoie automatiquement les activités anciennes selon la configuration';
COMMENT ON FUNCTION log_activity IS 'Fonction helper pour enregistrer facilement une nouvelle activité';