-- ============================================================
-- Intranet HBP — Dados iniciais
-- ============================================================

-- Usuários locais para desenvolvimento/homologação.
-- Em produção, use LDAP/AD e substitua senhas locais por hashes bcrypt.
INSERT INTO users (username, display_name, email, department, job_title, groups, role, password_hash, is_ldap)
VALUES
    ('admin',  'Ana Beatriz Souza',  'admin@demo.local',  'Tecnologia da Informação',  'Administradora de Sistemas',  ARRAY['TI','Admins','Gestores'],  'admin',   'plain:admin123', FALSE),
    ('gestor', 'Carlos Eduardo Lima',   'gestor@demo.local',   'Recursos Humanos',          'Gerente de RH',               ARRAY['RH','Gestores'],            'manager', 'plain:gestor123', FALSE),
    ('joao',   'Marcos Vinícius Alves',        'joao@demo.local',        'Financeiro',                'Analista Financeiro',         ARRAY['Financeiro'],               'user',    'plain:joao123', FALSE)
ON CONFLICT (username) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    department = EXCLUDED.department,
    job_title = EXCLUDED.job_title,
    groups = EXCLUDED.groups,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash,
    is_ldap = EXCLUDED.is_ldap;

INSERT INTO folders (name, department) VALUES
    ('Políticas', 'Geral'),
    ('Institucional', 'Geral'),
    ('RH', 'RH'),
    ('TI', 'TI'),
    ('Financeiro', 'Financeiro')
ON CONFLICT DO NOTHING;

INSERT INTO notices (title, content, author, priority, visibility, published_at) VALUES
    ('Manutenção programada do servidor', 'Informamos que no próximo sábado, das 22h às 02h, haverá manutenção nos servidores internos.', 'TI — Ana Beatriz Souza', 'high', 'all', '2026-04-25'),
    ('Nova política de home office', 'A nova política de trabalho híbrido entra em vigor a partir de maio. Confira detalhes no portal do RH.', 'RH — Carlos Eduardo Lima', 'medium', 'all', '2026-04-22'),
    ('Reunião mensal de gestores', 'Próxima terça-feira, 10h, sala de reuniões 3. Pauta: metas do trimestre.', 'Diretoria', 'medium', 'managers', '2026-04-20'),
    ('Confraternização anual', 'Nossa confraternização acontecerá em junho. Em breve enviaremos o convite oficial.', 'RH', 'low', 'all', '2026-04-15')
ON CONFLICT DO NOTHING;
