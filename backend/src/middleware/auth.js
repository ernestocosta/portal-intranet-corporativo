export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Sessão não autenticada" });
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: "Sessão não autenticada" });
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: "Acesso não autorizado para este perfil" });
    }
    next();
  };
}
