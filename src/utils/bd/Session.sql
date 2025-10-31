-- Table des sessions actives
CREATE TABLE IF NOT EXISTS sessions_actives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    device_info TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    login_count INTEGER DEFAULT 1,
    logout_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions_actives(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions_actives(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions_actives(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions_actives(last_activity);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions_actives 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();