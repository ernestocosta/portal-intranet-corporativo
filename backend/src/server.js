import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pool from "./config/database.js";
import apiRoutes from "./routes/api.js";
import fs from "fs";
import path from "path";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function ensureSchemaFixes() {
    await pool.query(`ALTER TABLE shortcuts ADD COLUMN IF NOT EXISTS icon_path VARCHAR(500) NOT NULL DEFAULT ''`);
  await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_shortcuts_active ON shortcuts (active)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_documents_public ON documents (is_public)`);
}

async function ensureDemoUsers() {
  if (String(process.env.SEED_DEMO_USERS || "true").toLowerCase() === "false") return;
  await pool.query(`
    INSERT INTO users (username, display_name, email, department, job_title, groups, role, password_hash, is_ldap)
    VALUES
      ('admin', 'Ana Beatriz Souza', 'admin@demo.local', 'Tecnologia da Informação', 'Administradora de Sistemas', ARRAY['TI','Admins','Gestores'], 'admin', 'plain:admin123', FALSE),
      ('gestor', 'Carlos Eduardo Lima', 'gestor@demo.local', 'Recursos Humanos', 'Gerente de RH', ARRAY['RH','Gestores'], 'manager', 'plain:gestor123', FALSE),
      ('joao', 'Marcos Vinícius Alves', 'joao@demo.local', 'Financeiro', 'Analista Financeiro', ARRAY['Financeiro'], 'user', 'plain:joao123', FALSE)
    ON CONFLICT (username) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      email = EXCLUDED.email,
      department = EXCLUDED.department,
      job_title = EXCLUDED.job_title,
      groups = EXCLUDED.groups,
      role = EXCLUDED.role,
      password_hash = EXCLUDED.password_hash,
      is_ldap = EXCLUDED.is_ldap;
  `);
}

app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:8080,http://localhost:5173").split(",");
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

const PgSession = connectPgSimple(session);
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    name: "hbp.sid",
    secret: process.env.SESSION_SECRET || "hbp-default-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 8 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && process.env.FORCE_HTTPS === "true",
      sameSite: "lax",
    },
  })
);

// 🔥 Servir uploads como arquivos estáticos (imagens de banners, blocos, etc.)
app.use("/uploads", express.static(path.resolve(UPLOAD_DIR)));

app.use("/api", apiRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error("[Server] Error:", err.message);
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "JSON malformado" });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Arquivo excede o limite de 50MB" });
  }
  res.status(500).json({ error: "Erro interno do servidor" });
});

ensureSchemaFixes()
  .then(() => ensureDemoUsers())
  .catch((err) => console.error("[Server] Falha ao preparar banco/usuários locais:", err.message))
  .finally(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Server] Intranet HBP running on port ${PORT}`);
    });
  });
