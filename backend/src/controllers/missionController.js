import { query } from "../config/database.js";

// ── PÚBLICO ──────────────────────────────────────────────────
export async function listMissionPublic(req, res) {
  try {
    const result = await query(
      `SELECT id, title, text, icon
       FROM mission_items
       WHERE active = TRUE
       ORDER BY sort_order, created_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[Mission] Public list error:", err.message);
    return res.status(500).json({ error: "Erro ao listar itens" });
  }
}

// ── ADMIN ─────────────────────────────────────────────────────
export async function listMission(req, res) {
  try {
    const result = await query(
      `SELECT id, title, text, icon, sort_order, active, created_at
       FROM mission_items
       ORDER BY sort_order, created_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[Mission] List error:", err.message);
    return res.status(500).json({ error: "Erro ao listar itens" });
  }
}

export async function createMissionItem(req, res) {
  try {
    const { title, text, icon = "Target", active = true } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: "Título é obrigatório" });
    }

    const result = await query(
      `INSERT INTO mission_items (title, text, icon, active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title.trim(), text || "", icon, active === "false" ? false : true]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[Mission] Create error:", err.message);
    return res.status(500).json({ error: "Erro ao criar item" });
  }
}

export async function updateMissionItem(req, res) {
  try {
    const { id } = req.params;
    const { title, text, icon, active } = req.body;

    const activeVal =
      active === "true" ? true : active === "false" ? false : active;

    const result = await query(
      `UPDATE mission_items
       SET title  = COALESCE($1, title),
           text   = COALESCE($2, text),
           icon   = COALESCE($3, icon),
           active = COALESCE($4, active)
       WHERE id = $5
       RETURNING *`,
      [title, text, icon, activeVal, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item não encontrado" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("[Mission] Update error:", err.message);
    return res.status(500).json({ error: "Erro ao atualizar item" });
  }
}

export async function deleteMissionItem(req, res) {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM mission_items WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item não encontrado" });
    }

    return res.json({ message: "Item excluído" });
  } catch (err) {
    console.error("[Mission] Delete error:", err.message);
    return res.status(500).json({ error: "Erro ao excluir item" });
  }
}

export async function reorderMission(req, res) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Lista inválida" });
    }

    for (let i = 0; i < items.length; i++) {
      await query(
        `UPDATE mission_items SET sort_order = $1 WHERE id = $2`,
        [i, items[i]]
      );
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("[Mission] Reorder error:", err.message);
    return res.status(500).json({ error: "Erro ao reordenar itens" });
  }
}
