import ldapjs from "ldapjs";

const LDAP_URL = process.env.LDAP_URL || "ldap://ldap.exemplo.local:389";
const LDAP_BASE_DN = process.env.LDAP_BASE_DN || "DC=hbp,DC=com";
const LDAP_DOMAIN = process.env.LDAP_DOMAIN || "exemplo.local";
const LDAP_NETBIOS_DOMAIN =
  process.env.LDAP_NETBIOS ||
  process.env.LDAP_NETBIOS_DOMAIN ||
  "HBP";

const LDAP_ENABLED =
  String(process.env.LDAP_ENABLED || "true").toLowerCase() !== "false";

export function parseUsername(rawInput = "") {
  const input = String(rawInput).trim();

  if (input.includes("\\")) {
    return input.split("\\").pop();
  }

  if (input.includes("@")) {
    return input.split("@")[0];
  }

  return input;
}

export function buildUserPrincipal(username) {
  return `${username}@${LDAP_DOMAIN}`;
}

export function buildDomainPrefix(username) {
  return `${LDAP_NETBIOS_DOMAIN}\\${username}`;
}

function buildBindCandidates(rawInput) {
  const input = String(rawInput).trim();
  const username = parseUsername(input);

  const candidates = [];

  if (input.includes("@") || input.includes("\\")) {
    candidates.push(input);
  }

  candidates.push(buildUserPrincipal(username));
  candidates.push(buildDomainPrefix(username));

  return [...new Set(candidates.filter(Boolean))];
}

function bindAsync(client, bindUser, password) {
  return new Promise((resolve, reject) => {
    client.bind(bindUser, password, (err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
}

async function bindWithFallback(client, rawInput, password) {
  let lastError = null;
  const candidates = buildBindCandidates(rawInput);

  for (const candidate of candidates) {
    try {
      console.log(`[LDAP] Tentando autenticar como: ${candidate}`);
      await bindAsync(client, candidate, password);
      console.log(`[LDAP] Autenticado com sucesso: ${candidate}`);
      return candidate;
    } catch (err) {
      lastError = err;
      console.log(`[LDAP] Falha no bind com: ${candidate}`);
    }
  }

  throw lastError || new Error("LDAP_INVALID_CREDENTIALS");
}

function extractAttributes(entry) {
  const attrs = {};

  const attributes =
    entry.pojo?.attributes ||
    entry.attributes ||
    entry.ppiAttributes ||
    [];

  for (const attr of attributes) {
    const values = attr.values || attr.vals || [];

    attrs[attr.type] = values.length === 1 ? values[0] : values;
  }

  return attrs;
}

function normalizeGroups(memberOf) {
  const groups = Array.isArray(memberOf)
    ? memberOf
    : memberOf
      ? [memberOf]
      : [];

  return groups.map((dn) => {
    const match = String(dn).match(/^CN=([^,]+)/i);
    return match ? match[1] : String(dn);
  });
}

function searchUser(client, username) {
  return new Promise((resolve, reject) => {
    const safeUsername = String(username).replace(/[\\()*\0]/g, "");

    const searchOptions = {
      scope: "sub",
      filter: `(|(sAMAccountName=${safeUsername})(userPrincipalName=${safeUsername}@${LDAP_DOMAIN})(mail=${safeUsername}@${LDAP_DOMAIN}))`,
      attributes: [
        "cn",
        "displayName",
        "mail",
        "department",
        "title",
        "memberOf",
        "sAMAccountName",
        "userPrincipalName",
      ],
    };

    client.search(LDAP_BASE_DN, searchOptions, (searchErr, searchRes) => {
      if (searchErr) {
        return reject(searchErr);
      }

      let userData = null;

      searchRes.on("searchEntry", (entry) => {
        const attrs = extractAttributes(entry);
        const groups = normalizeGroups(attrs.memberOf);

        userData = {
          username: attrs.sAMAccountName || username,
          displayName: attrs.displayName || attrs.cn || username,
          email: attrs.mail || attrs.userPrincipalName || `${username}@${LDAP_DOMAIN}`,
          department: attrs.department || "",
          jobTitle: attrs.title || "",
          groups,
          source: "ldap",
        };
      });

      searchRes.on("end", () => {
        resolve(userData);
      });

      searchRes.on("error", (err) => {
        reject(err);
      });
    });
  });
}

function closeClient(client) {
  try {
    client.unbind();
  } catch {
    // ignora erro ao fechar conexão
  }
}

export async function authenticateViaLdap(rawInput, password) {
  if (!LDAP_ENABLED) {
    throw new Error("LDAP_DISABLED");
  }

  if (!rawInput || !password) {
    throw new Error("LDAP_INVALID_CREDENTIALS");
  }

  const username = parseUsername(rawInput);

  return new Promise((resolve, reject) => {
    const client = ldapjs.createClient({
      url: LDAP_URL,
      connectTimeout: 5000,
      timeout: 10000,
      reconnect: false,
    });

    let settled = false;

    client.on("error", (err) => {
      if (!settled) {
        settled = true;
        reject(new Error(`LDAP_CONNECTION_FAILED: ${err.message}`));
      }
    });

    (async () => {
      try {
        console.log(`[LDAP] Habilitado: ${LDAP_ENABLED}`);
        console.log(`[LDAP] Servidor: ${LDAP_URL}`);
        console.log(`[LDAP] Base DN: ${LDAP_BASE_DN}`);
        console.log(`[LDAP] Domínio: ${LDAP_DOMAIN}`);
        console.log(`[LDAP] NetBIOS: ${LDAP_NETBIOS_DOMAIN}`);

        await bindWithFallback(client, rawInput, password);

        const userData = await searchUser(client, username);

        closeClient(client);

        if (!settled) {
          settled = true;
          resolve(
            userData || {
              username,
              displayName: username,
              email: `${username}@${LDAP_DOMAIN}`,
              department: "",
              jobTitle: "",
              groups: [],
              source: "ldap",
            }
          );
        }
      } catch (err) {
        closeClient(client);

        if (!settled) {
          settled = true;

          if (String(err.message || "").includes("LDAP_CONNECTION_FAILED")) {
            reject(err);
          } else {
            reject(new Error("LDAP_INVALID_CREDENTIALS"));
          }
        }
      }
    })();
  });
}