import { authenticate, formatSessionUser } from "../services/authService.js";
import { recordAccess } from "../services/logService.js";

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }

  try {
    const result = await authenticate(username, password);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    const sessionUser = formatSessionUser(result.user);
    req.session.user = sessionUser;

    await recordAccess(sessionUser.id, sessionUser.username, "login", req);

    return res.json({ user: sessionUser });
  } catch (err) {
    console.error("[Auth] Login error:", err.message);
    return res.status(500).json({ error: "Erro interno de autenticação" });
  }
}

export function logout(req, res) {
  const username = req.session?.user?.username || "unknown";

  req.session.destroy((err) => {
    if (err) {
      console.error("[Auth] Logout error:", err.message);
    }
    res.clearCookie("hbp.sid");
    res.json({ message: "Sessão encerrada" });
  });
}

export function currentUser(req, res) {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  return res.json({ user: req.session.user });
}
