-- ============================================================
-- Intranet HBP — Tabela Missão & Visão (006)
-- ============================================================

CREATE TABLE IF NOT EXISTS mission_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       VARCHAR(200) NOT NULL DEFAULT '',
    text        TEXT         NOT NULL DEFAULT '',
    icon        VARCHAR(50)  NOT NULL DEFAULT 'Target'
                CHECK (icon IN ('Target', 'Eye', 'Heart', 'Star', 'Shield', 'Award', 'Zap', 'Globe')),
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mission_items_sort   ON mission_items (sort_order);
CREATE INDEX IF NOT EXISTS idx_mission_items_active ON mission_items (active);

CREATE TRIGGER trg_mission_items_updated
    BEFORE UPDATE ON mission_items
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Dados iniciais (com encoding unicode para evitar problemas de charset)
INSERT INTO mission_items (title, text, icon, sort_order, active) VALUES
(
  U&'Miss\00E3o',
  U&'Promover sa\00FAde com excel\00EAncia, humaniza\00E7\00E3o e responsabilidade social, oferecendo assist\00EAncia de qualidade a todos os pacientes.',
  'Target',
  1,
  TRUE
),
(
  U&'Vis\00E3o',
  U&'Ser refer\00EAncia nacional em assist\00EAncia hospitalar, inova\00E7\00E3o m\00E9dica e gest\00E3o sustent\00E1vel at\00E9 2030.',
  'Eye',
  2,
  TRUE
),
(
  'Valores',
  U&'Humaniza\00E7\00E3o, \00E9tica, transpar\00EAncia, inova\00E7\00E3o, qualidade, responsabilidade social e respeito \00E0 vida.',
  'Heart',
  3,
  TRUE
)
ON CONFLICT DO NOTHING;
