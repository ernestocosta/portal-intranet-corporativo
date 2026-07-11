import { query } from "../config/database.js";
import { recordAccess } from "../services/logService.js";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// ────────────────────────────────────────────────────────────
//  PÚBLICO — qualquer visitante vê membros ativos
// ────────────────────────────────────────────────────────────
export async function listDirectoryPublic(req, res) {
  try {
    const result = await query(
      `SELECT id, name, role, area, photo, shape, zoom, sort_order
       FROM directory_members
       WHERE active = TRUE
       ORDER BY sort_order, created_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[Directory] List public error:", err.message);
    return res.status(500).json({ error: "Erro ao listar diretoria" });
  }
}

// ────────────────────────────────────────────────────────────
//  PORTAL INTERNO — lista todos (incluindo inativos para admin)
// ────────────────────────────────────────────────────────────
export async function listDirectory(req, res) {
  try {
    const result = await query(
      `SELECT id, name, role, area, photo, shape, zoom, active, sort_order, created_at
       FROM directory_members
       ORDER BY sort_order, created_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[Directory] List error:", err.message);
    return res.status(500).json({ error: "Erro ao listar diretoria" });
  }
}

// ────────────────────────────────────────────────────────────
//  CRIAR membro
// ────────────────────────────────────────────────────────────
export async function createMember(req, res) {
  const { name, role, area, active, shape, zoom } = req.body;
  const userId = req.session.user.id;

  if (!name?.trim() || !role?.trim()) {
    return res.status(400).json({ error: "Nome e cargo são obrigatórios" });
  }

  let photo = "";
  if (req.file) {
    photo = req.file.filename;
  }

  try {
    const result = await query(
      `INSERT INTO directory_members (name, role, area, photo, shape, zoom, active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name.trim(),
        role.trim(),
        area?.trim() || "",
        photo,
        shape || "circle",
        parseFloat(zoom) || 1.0,
        active === "true" || active === true || active === undefined,
        userId,
      ]
    );

    await recordAccess(userId, req.session.user.username, "directory.create", req, {
      memberId: result.rows[0].id,
    });

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[Directory] Create error:", err.message);
    return res.status(500).json({ error: "Erro ao criar membro" });
  }
}

// ────────────────────────────────────────────────────────────
//  ATUALIZAR membro
// ────────────────────────────────────────────────────────────
export async function updateMember(req, res) {
  const { id } = req.params;
  const { name, role, area, active, shape, zoom } = req.body;

  let photo = undefined;
  if (req.file) {
    photo = req.file.filename;

    // Apagar foto antiga do disco
    const old = await query(`SELECT photo FROM directory_members WHERE id = $1`, [id]);
    if (old.rows[0]?.photo) {
      const oldFile = path.join(UPLOAD_DIR, old.rows[0].photo);
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }
  }

  try {
    const result = await query(
      `UPDATE directory_members SET
         name   = COALESCE($1, name),
         role   = COALESCE($2, role),
         area   = COALESCE($3, area),
         active = COALESCE($4, active),
         shape  = COALESCE($5, shape),
         zoom   = COALESCE($6, zoom),
         photo  = COALESCE($7, photo)
       WHERE id = $8
       RETURNING *`,
      [
        name?.trim() || undefined,
        role?.trim() || undefined,
        area?.trim() ?? undefined,
        active === "true" ? true : active === "false" ? false : undefined,
        shape || undefined,
        zoom != null ? parseFloat(zoom) : undefined,
        photo,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Membro não encontrado" });
    }

    await recordAccess(req.session.user.id, req.session.user.username, "directory.update", req, {
      memberId: id,
    });

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("[Directory] Update error:", err.message);
    return res.status(500).json({ error: "Erro ao atualizar membro" });
  }
}

// ────────────────────────────────────────────────────────────
//  EXCLUIR membro
// ────────────────────────────────────────────────────────────
export async function deleteMember(req, res) {
  const { id } = req.params;

  try {
    const result = await query(
      `DELETE FROM directory_members WHERE id = $1 RETURNING photo`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Membro não encontrado" });
    }

    // Apagar foto do disco
    if (result.rows[0].photo) {
      const filePath = path.join(UPLOAD_DIR, result.rows[0].photo);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await recordAccess(req.session.user.id, req.session.user.username, "directory.delete", req, {
      memberId: id,
    });

    return res.json({ message: "Membro excluído" });
  } catch (err) {
    console.error("[Directory] Delete error:", err.message);
    return res.status(500).json({ error: "Erro ao excluir membro" });
  }
}
