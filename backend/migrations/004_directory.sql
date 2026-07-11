-- ============================================================
-- Intranet HBP — Tabela de Diretoria
-- ============================================================

CREATE TABLE IF NOT EXISTS directory_members (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(200) NOT NULL,
    role        VARCHAR(200) NOT NULL,
    area        VARCHAR(200) NOT NULL DEFAULT '',
    photo       VARCHAR(500) DEFAULT '',
    shape       VARCHAR(20) NOT NULL DEFAULT 'circle'
                CHECK (shape IN ('circle', 'square', 'rectangle')),
    zoom        NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_directory_active ON directory_members (active);
CREATE INDEX IF NOT EXISTS idx_directory_sort   ON directory_members (sort_order);

CREATE TRIGGER trg_directory_updated BEFORE UPDATE ON directory_members
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Dados iniciais de demonstração (100% fictícios)
INSERT INTO directory_members (name, role, area, active, sort_order) VALUES
    ('Marina Albuquerque', 'Presidente',              'Presidência',           TRUE, 1),
    ('Renato Cavalcante',  'Vice - Presidente',       'Vice-Presidência',      TRUE, 2),
    ('Beatriz Fontoura',   'Diretor Assistencial',    'Diretoria Assistencial',TRUE, 3),
    ('Gustavo Pimentel',   'Diretor Administrativo',  'Diretoria Admin.',      TRUE, 4),
    ('Luciana Tavares',    'Diretor Técnico',         'Diretoria Técnica',     TRUE, 5)
ON CONFLICT DO NOTHING;
