-- Créer la table sessions_actives
CREATE TABLE sessions_actives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  session_token TEXT NOT NULL UNIQUE,
  device_info TEXT,
  ip_address TEXT,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les recherches par email
CREATE INDEX idx_sessions_email ON sessions_actives(email);

-- Index pour accélérer les recherches par token
CREATE INDEX idx_sessions_token ON sessions_actives(session_token);

-- Fonction pour nettoyer automatiquement les sessions expirées (> 2 heures)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions_actives 
  WHERE last_activity < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON TABLE sessions_actives IS 'Stocke les sessions actives pour empêcher les connexions multiples';
COMMENT ON COLUMN sessions_actives.email IS 'Email de l''utilisateur (unique)';
COMMENT ON COLUMN sessions_actives.session_token IS 'Token unique de la session';
COMMENT ON COLUMN sessions_actives.last_activity IS 'Dernière activité (pour détecter les sessions expirées)';