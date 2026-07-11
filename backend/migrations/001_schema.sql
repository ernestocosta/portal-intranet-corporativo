-- ============================================================
-- Intranet HBP — Schema Principal
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Usuários (cache LDAP) ───
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(120) NOT NULL UNIQUE,
    display_name    VARCHAR(200) NOT NULL,
    email           VARCHAR(200) NOT NULL,
    department      VARCHAR(120) NOT NULL DEFAULT '',
    job_title       VARCHAR(200) NOT NULL DEFAULT '',
    groups          TEXT[] DEFAULT '{}',
    role            VARCHAR(20) NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'manager', 'admin')),
    password_hash   VARCHAR(255),
    is_ldap         BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role ON users (role);

-- ─── Pastas de documentos ───
CREATE TABLE folders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(120) NOT NULL,
    parent_id       UUID REFERENCES folders(id) ON DELETE CASCADE,
    department      VARCHAR(120) NOT NULL DEFAULT 'Geral',
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_folders_parent ON folders (parent_id);
CREATE INDEX idx_folders_department ON folders (department);

-- ─── Documentos ───
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(300) NOT NULL,
    original_name   VARCHAR(300) NOT NULL,
    mime_type       VARCHAR(120) NOT NULL DEFAULT 'application/octet-stream',
    file_size       BIGINT NOT NULL DEFAULT 0,
    storage_path    VARCHAR(500) NOT NULL,
    folder_id       UUID REFERENCES folders(id) ON DELETE SET NULL,
    department      VARCHAR(120) NOT NULL DEFAULT 'Geral',
    is_public       BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_folder ON documents (folder_id);
CREATE INDEX idx_documents_department ON documents (department);
CREATE INDEX idx_documents_public ON documents (is_public);

-- ─── Avisos / Comunicados ───
CREATE TABLE notices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(200) NOT NULL,
    content         TEXT NOT NULL,
    author          VARCHAR(200) NOT NULL,
    priority        VARCHAR(10) NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high')),
    visibility      VARCHAR(20) NOT NULL DEFAULT 'all'
                    CHECK (visibility IN ('all', 'managers', 'admins')),
    published_at    DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notices_priority ON notices (priority);
CREATE INDEX idx_notices_visibility ON notices (visibility);
CREATE INDEX idx_notices_published ON notices (published_at DESC);

-- ─── Logs de acesso ───
CREATE TABLE access_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    username        VARCHAR(120) NOT NULL,
    action          VARCHAR(200) NOT NULL,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_user ON access_logs (user_id);
CREATE INDEX idx_logs_created ON access_logs (created_at DESC);
CREATE INDEX idx_logs_action ON access_logs (action);

-- ─── Função de atualização de timestamp ───
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_notices_updated BEFORE UPDATE ON notices
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
