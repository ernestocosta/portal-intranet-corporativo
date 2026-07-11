-- ============================================================
-- Intranet HBP — Tabelas CMS (Banners, Atalhos, Quem Somos)
-- ============================================================

-- 🔥 FIX: Remover constraint antiga de role que só aceita user/manager/admin
-- e substituir por uma que aceita também qualidade e rh
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'manager', 'admin', 'qualidade', 'rh'));

-- ─── Banners da página inicial ───
CREATE TABLE IF NOT EXISTS banners (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(200) NOT NULL DEFAULT '',
    description     TEXT NOT NULL DEFAULT '',
    image_path      VARCHAR(500) DEFAULT '',
    type            VARCHAR(20) NOT NULL DEFAULT 'Texto'
                    CHECK (type IN ('Texto', 'Imagem')),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON banners (active);
CREATE INDEX IF NOT EXISTS idx_banners_sort ON banners (sort_order);

-- ─── Atalhos (Acesso Rápido) ───
CREATE TABLE IF NOT EXISTS shortcuts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(200) NOT NULL,
    description     VARCHAR(500) NOT NULL DEFAULT '',
    icon            VARCHAR(200) NOT NULL DEFAULT '',
    icon_path       VARCHAR(500) NOT NULL DEFAULT '',
    url             VARCHAR(500) NOT NULL DEFAULT '#',
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shortcuts_active ON shortcuts (active);

-- ─── Blocos de conteúdo "Quem Somos" ───
CREATE TABLE IF NOT EXISTS content_blocks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(200) NOT NULL DEFAULT '',
    text            TEXT NOT NULL DEFAULT '',
    image_path      VARCHAR(500) DEFAULT '',
    image_position  VARCHAR(20) NOT NULL DEFAULT 'abaixo'
                    CHECK (image_position IN ('acima', 'abaixo', 'esquerda', 'direita')),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Gráficos "Quem Somos" ───
CREATE TABLE IF NOT EXISTS content_charts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(200) NOT NULL DEFAULT '',
    description     TEXT NOT NULL DEFAULT '',
    bars            JSONB NOT NULL DEFAULT '[]',
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Triggers de updated_at ───
CREATE TRIGGER trg_banners_updated BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_shortcuts_updated BEFORE UPDATE ON shortcuts
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_content_blocks_updated BEFORE UPDATE ON content_blocks
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_content_charts_updated BEFORE UPDATE ON content_charts
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ─── Dados iniciais de atalhos (demonstração) ───
INSERT INTO shortcuts (title, description, icon, url, active, sort_order) VALUES
    ('Laboratório Parceiro', 'Exames e resultados', '🧪', 'https://exemplo.com/laboratorio', TRUE, 1),
    ('Indicadores', 'Painéis e métricas', '📊', 'https://exemplo.com/indicadores', TRUE, 2),
    ('E-mail Corporativo', 'Acesso ao webmail', '✉️', 'https://webmail.exemplo.local/', TRUE, 3)
ON CONFLICT DO NOTHING;

-- ─── Dados iniciais de banners ───
INSERT INTO banners (title, description, type, active, sort_order) VALUES
    ('Portal corporativo integrado para toda a equipe.', 'Acesso rápido aos principais sistemas, documentos institucionais, indicadores e comunicados internos.', 'Texto', TRUE, 1)
ON CONFLICT DO NOTHING;

-- ─── Dados iniciais de blocos de conteúdo (demonstração) ───
INSERT INTO content_blocks (title, text, image_position, active, sort_order) VALUES
    ('Quem Somos', 'Tradição e modernidade colocam esta organização em lugar de destaque entre as grandes instituições do setor (texto ilustrativo de demonstração).', 'abaixo', TRUE, 1),
    ('Nossa Empresa Hoje', 'Ao longo de sua história, a organização alia tradição à modernidade, sempre buscando as mais altas tecnologias (texto ilustrativo de demonstração).', 'abaixo', TRUE, 2)
ON CONFLICT DO NOTHING;

-- ─── Dados iniciais de gráficos (demonstração) ───
INSERT INTO content_charts (title, description, bars, sort_order) VALUES
    ('Dedicação: mais de 60% dos atendimentos com foco social',
     'Dados ilustrativos de demonstração sobre a distribuição de atendimentos.',
     '[{"label":"Outros","value":40,"color":"#9bc558"},{"label":"Atendimento Social","value":60,"color":"#3f7f73"}]',
     1)
ON CONFLICT DO NOTHING;
