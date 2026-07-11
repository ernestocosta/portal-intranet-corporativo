import bcrypt from "bcrypt";
import { query } from "../config/database.js";
import { authenticateViaLdap, parseUsername } from "./ldapService.js";

const LDAP_ENABLED =
  String(process.env.LDAP_ENABLED || "true").toLowerCase() !== "false";

function groupHas(groups, terms = []) {
  return groups.some((group) => {
    const g = String(group || "").toUpperCase();
    return terms.some((term) => g.includes(term));
  });
}

function determineRole(groups = [], department = "") {
  const upperGroups = groups.map((g) => String(g || "").toUpperCase());
  const upperDepartment = String(department || "").toUpperCase();

  // TI / ADMIN
  if (
    groupHas(upperGroups, [
      "ADMINS",
      "DOMAIN ADMINS",
      "ADMINISTRADORES",
      "TI",
      "INFORMATICA",
      "INFORMÁTICA",
      "TECNOLOGIA",
    ]) ||
    upperDepartment.includes("TI") ||
    upperDepartment.includes("INFORMATICA") ||
    upperDepartment.includes("INFORMÁTICA") ||
    upperDepartment.includes("TECNOLOGIA")
  ) {
    return "admin";
  }

  // QUALIDADE
  if (
    groupHas(upperGroups, [
      "QUALIDADE",
      "ASQL",
      "ASSESSORIA DA QUALIDADE",
      "NSP",
      "NUCLEO DE SEGURANCA",
      "NÚCLEO DE SEGURANÇA",
    ]) ||
    upperDepartment.includes("QUALIDADE") ||
    upperDepartment.includes("ASQL") ||
    upperDepartment.includes("NSP")
  ) {
    return "qualidade";
  }

  // RH / GESTÃO DE PESSOAS / DEPARTAMENTO PESSOAL
  if (
    groupHas(upperGroups, [
      "RH",
      "RECURSOS HUMANOS",
      "DEPARTAMENTO PESSOAL",
      "GESTAO DE PESSOAS",
      "GESTÃO DE PESSOAS",
      "GP - DEPARTAMENTO PESSOAL",
      "GP",
    ]) ||
    upperDepartment.includes("RH") ||
    upperDepartment.includes("RECURSOS HUMANOS") ||
    upperDepartment.includes("DEPARTAMENTO PESSOAL") ||
    upperDepartment.includes("GESTAO DE PESSOAS") ||
    upperDepartment.includes("GESTÃO DE PESSOAS") ||
    upperDepartment.includes("GP")
  ) {
    return "rh";
  }

  // GESTORES
  if (
    groupHas(upperGroups, ["GESTORES", "MANAGERS"]) ||
    upperDepartment.includes("DIRETORIA") ||
    upperDepartment.includes("PRESID")
  ) {
    return "manager";
  }

  return "user";
}

async function upsertUserFromLdap(ldapData) {
  const username = parseUsername(ldapData.username);
  const role = determineRole(ldapData.groups, ldapData.department);

  const result = await query(
    `INSERT INTO users
      (username, display_name, email, department, job_title, groups, role, is_ldap, last_login_at)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW())
     ON CONFLICT (username) DO UPDATE SET
       display_name = EXCLUDED.display_name,
       email = EXCLUDED.email,
       department = EXCLUDED.department,
       job_title = EXCLUDED.job_title,
       groups = EXCLUDED.groups,
       role = EXCLUDED.role,
       is_ldap = TRUE,
       last_login_at = NOW()
     RETURNING id, username, display_name, email, department, job_title, groups, role, is_ldap`,
    [
      username,
      ldapData.displayName || username,
      ldapData.email || `${username}@exemplo.local`,
      ldapData.department || "",
      ldapData.jobTitle || "",
      ldapData.groups || [],
      role,
    ]
  );

  return result.rows[0];
}

async function authenticateLocal(username, password) {
  const result = await query(
    `SELECT id, username, display_name, email, department, job_title, groups, role, password_hash, is_ldap
     FROM users
     WHERE username = $1
       AND is_ldap = FALSE`,
    [username]
  );

  if (result.rows.length === 0) return null;

  const user = result.rows[0];
  if (!user.password_hash) return null;

  let valid = false;

  if (user.password_hash.startsWith("$2")) {
    valid = await bcrypt.compare(password, user.password_hash);
  } else if (user.password_hash.startsWith("plain:")) {
    valid = password === user.password_hash.slice("plain:".length);
  }

  if (!valid) return null;

  await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [
    user.id,
  ]);

  const { password_hash: _, ...safeUser } = user;
  return safeUser;
}

export async function authenticate(rawInput, password) {
  const username = parseUsername(rawInput);

  if (!username || !password) {
    return {
      success: false,
      error: "Informe usuário e senha.",
    };
  }

  if (LDAP_ENABLED) {
    try {
      console.info(`[Auth] Tentando autenticação LDAP para "${username}".`);

      const ldapData = await authenticateViaLdap(rawInput, password);
      const user = await upsertUserFromLdap(ldapData);

      console.info(
        `[Auth] Login LDAP autorizado para "${username}" com perfil "${user.role}".`
      );

      return {
        success: true,
        user,
      };
    } catch (ldapErr) {
      console.warn(
        `[Auth] LDAP recusou ou falhou para "${username}": ${ldapErr.message}`
      );

      return {
        success: false,
        error: "Usuário ou senha inválidos no domínio.",
      };
    }
  }

  console.info(`[Auth] LDAP desativado. Tentando login local para "${username}".`);

  const localUser = await authenticateLocal(username, password);

  if (localUser) {
    return {
      success: true,
      user: localUser,
    };
  }

  return {
    success: false,
    error: "Usuário ou senha inválidos.",
  };
}

export function formatSessionUser(dbUser) {
  return {
    id: dbUser.id,
    username: dbUser.username,
    displayName: dbUser.display_name,
    email: dbUser.email,
    department: dbUser.department,
    jobTitle: dbUser.job_title,
    groups: dbUser.groups || [],
    role: dbUser.role,
    isLdap: dbUser.is_ldap || false,
  };
}