# Intranet Corporativa — Portal Demo

Portal corporativo interno com autenticação LDAP/AD, gestão de documentos, avisos e indicadores.

> **Nota:** este repositório é uma versão de portfólio. Todos os nomes, e-mails, senhas de demonstração e conteúdo institucional são **100% fictícios** — nenhuma informação real de funcionários ou da empresa original está incluída.

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Frontend   │────▶│   Backend    │────▶│ PostgreSQL │
│  React/Vite  │     │  Express.js  │     │    16      │
│   (Nginx)    │     │   Node 20   │     │            │
│   :8080      │     │   :3000      │     │   :5432    │
└─────────────┘     └──────────────┘     └────────────┘
```

## Início Rápido (Docker)

```bash
# 1. Copiar variáveis de ambiente
cp .env.example .env

# 2. Subir todos os serviços
docker-compose up --build -d

# 3. Acessar
# Frontend: http://localhost:8080
# API:      http://localhost:3000/health
```

## Usuários de Demonstração

| Usuário  | Senha      | Perfil         |
|----------|------------|----------------|
| admin    | admin123   | Administrador  |
| gestor   | gestor123  | Gestor (RH)    |
| joao     | joao123    | Usuário        |

Formatos aceitos no login:
- `admin`
- `admin@empresa.corp`
- `EMPRESA\admin`

## Estrutura do Projeto

```
intranet-portfolio/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── migrations/
│   │   ├── 001_schema.sql      # Esquema completo do banco
│   │   └── 002_seed.sql        # Dados iniciais
│   └── src/
│       ├── server.js            # Entry point Express
│       ├── config/database.js   # Pool PostgreSQL
│       ├── controllers/         # Handlers das rotas
│       ├── middleware/          # Auth guards
│       ├── routes/api.js        # Definição de rotas
│       └── services/            # Lógica de negócio (auth, LDAP, logs)
└── frontend/
    ├── Dockerfile
    ├── nginx.conf               # Proxy reverso para API
    ├── package.json
    └── src/
        ├── App.jsx              # Rotas React
        ├── main.jsx             # Entry point
        ├── index.css            # Tailwind + identidade visual
        ├── lib/                 # API client, auth context
        └── components/
            ├── layout/          # Layouts público e privado
            ├── pages/           # Páginas da aplicação
            └── ui/              # Componentes reutilizáveis
```

## Módulos

- **Dashboard** — Visão geral com estatísticas e avisos recentes
- **Avisos** — Comunicados com prioridade e visibilidade por perfil
- **Documentos** — Upload, pastas, download e controle de acesso por setor
- **Diretoria** — Contatos da liderança executiva
- **Indicadores** — KPIs e métricas institucionais
- **Administração** — Gestão de avisos, documentos e logs de acesso

## Perfis e Permissões

| Recurso               | user | manager | admin |
|------------------------|------|---------|-------|
| Dashboard              | ✓    | ✓       | ✓     |
| Avisos (leitura)       | ✓*   | ✓       | ✓     |
| Documentos (leitura)   | ✓**  | ✓       | ✓     |
| Upload de documentos   | ✗    | ✓       | ✓     |
| Gestão de avisos       | ✗    | ✓       | ✓     |
| Gestão de documentos   | ✗    | ✗       | ✓     |
| Logs de acesso         | ✗    | ✓       | ✓     |

\* Apenas avisos com visibilidade "todos"
\** Apenas documentos públicos ou do próprio setor

## Banco de Dados

### Tabelas

- `users` — Cache de usuários LDAP com perfil e departamento
- `folders` — Pastas para organização de documentos
- `documents` — Metadados e referência aos arquivos armazenados
- `notices` — Comunicados internos
- `access_logs` — Auditoria de acessos e ações
- `session` — Sessões Express (criada automaticamente)

## Autenticação

1. **Tentativa LDAP** — Bind com `usuario@dominio.corp`
2. **Fallback local** — Busca no banco com bcrypt
3. Sessão armazenada no PostgreSQL (8h de duração)
4. Proteção de rotas via middleware `requireAuth` e `requireRole`

## Desenvolvimento Local (sem Docker)

```bash
# Backend
cd backend
cp ../.env.example .env
npm install
npm run dev

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
```

## Variáveis de Ambiente

| Variável         | Descrição                    | Padrão                |
|------------------|------------------------------|-----------------------|
| DB_NAME          | Nome do banco                | intranet_demo          |
| DB_USER          | Usuário PostgreSQL           | intranet              |
| DB_PASSWORD      | Senha PostgreSQL             | troque-esta-senha       |
| SESSION_SECRET   | Chave da sessão              | (gerar em produção)   |
| LDAP_URL         | URL do servidor LDAP         | ldap://ldap:389       |
| LDAP_DOMAIN      | Domínio para login           | empresa.corp          |
| CORS_ORIGIN      | Origens permitidas (CSV)     | http://localhost:8080  |

## Identidade Visual

Paleta institucional (verde/azul corporativo):
- **Azul principal**: `#1b5a9e` (institucional hospitalar)
- **Azul escuro**: `#0e2d52` (sidebar, cabeçalhos)
- **Branco/cinza claro**: backgrounds e cards
- Tipografia: Inter (sans-serif, legível)
