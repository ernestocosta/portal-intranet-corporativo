import { query } from "../config/database.js";
import { recordAccess } from "../services/logService.js";

export async function listNotices(req, res) {
  try {
    const userRole = req.session.user.role;

    let visibilityFilter;
    if (userRole === "admin") {
      visibilityFilter = "1=1";
    } else if (userRole === "manager") {
      visibilityFilter = "visibility IN ('all', 'managers')";
    } else {
      visibilityFilter = "visibility = 'all'";
    }

    const result = await query(
      `SELECT id, title, content, author, priority, visibility, published_at, created_at
       FROM notices
       WHERE ${visibilityFilter}
       ORDER BY published_at DESC`
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("[Notices] List error:", err.message);
    return res.status(500).json({ error: "Erro ao listar avisos" });
  }
}

export async function createNotice(req, res) {
  const { title, content, author, priority, visibility } = req.body;
  const userId = req.session.user.id;

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ error: "Título e conteúdo são obrigatórios" });
  }

  if (title.length > 200 || content.length > 5000) {
    return res.status(400).json({ error: "Título ou conteúdo excedem o limite de caracteres" });
  }

  try {
    const result = await query(
      `INSERT INTO notices (title, content, author, priority, visibility, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        title.trim(),
        content.trim(),
        author || req.session.user.displayName,
        priority || "medium",
        visibility || "all",
        userId,
      ]
    );

    await recordAccess(userId, req.session.user.username, "notice.create", req, {
      noticeId: result.rows[0].id,
    });

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[Notices] Create error:", err.message);
    return res.status(500).json({ error: "Erro ao criar aviso" });
  }
}

export async function updateNotice(req, res) {
  const { id } = req.params;
  const { title, content, author, priority, visibility } = req.body;

  try {
    const result = await query(
      `UPDATE notices
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           author = COALESCE($3, author),
           priority = COALESCE($4, priority),
           visibility = COALESCE($5, visibility)
       WHERE id = $6
       RETURNING *`,
      [title, content, author, priority, visibility, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Aviso não encontrado" });
    }

    await recordAccess(req.session.user.id, req.session.user.username, "notice.update", req, {
      noticeId: id,
    });

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("[Notices] Update error:", err.message);
    return res.status(500).json({ error: "Erro ao atualizar aviso" });
  }
}

export async function deleteNotice(req, res) {
  const { id } = req.params;

  try {
    const result = await query(`DELETE FROM notices WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Aviso não encontrado" });
    }

    await recordAccess(req.session.user.id, req.session.user.username, "notice.delete", req, {
      noticeId: id,
    });

    return res.json({ message: "Aviso excluído" });
  } catch (err) {
    console.error("[Notices] Delete error:", err.message);
    return res.status(500).json({ error: "Erro ao excluir aviso" });
  }
}
