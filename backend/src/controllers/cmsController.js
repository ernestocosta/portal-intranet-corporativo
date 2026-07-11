import { query } from "../config/database.js";
import { recordAccess } from "../services/logService.js";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// ════════════════════════════════════════════════════════════
//  BANNERS
// ════════════════════════════════════════════════════════════

// PÚBLICO — qualquer visitante pode ver banners ativos
export async function listBannersPublic(req, res) {
  try {
    const result = await query(
      `SELECT id, title, description, image_path, type, active
       FROM banners
       WHERE active = TRUE
       ORDER BY sort_order, created_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[CMS] List banners public error:", err.message);
    return res.status(500).json({ error: "Erro ao listar banners" });
  }
}

// ADMIN — todos os banners
export async function listBanners(req, res) {
  try {
    const result = await query(
      `SELECT id, title, description, image_path, type, active, sort_order, created_at
       FROM banners
       ORDER BY sort_order, created_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[CMS] List banners error:", err.message);
    return res.status(500).json({ error: "Erro ao listar banners" });
  }
}

export async function createBanner(req, res) {
  const { title, description, type, active } = req.body;
  const userId = req.session.user.id;

  let imagePath = "";
  if (req.file) {
    imagePath = req.file.filename;
  }

  try {
    const result = await query(
      `INSERT INTO banners (title, description, image_path, type, active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        title || "",
        description || "",
        imagePath,
        type || "Texto",
        active === "true" || active === true,
        userId,
      ]
    );

    await recordAccess(userId, req.session.user.username, "banner.create", req, {
      bannerId: result.rows[0].id,
    });

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[CMS] Create banner error:", err.message);
    return res.status(500).json({ error: "Erro ao criar banner" });
  }
}

export async function updateBanner(req, res) {
  const { id } = req.params;
  const { title, description, type, active } = req.body;

  let imagePath = undefined;
  if (req.file) {
    imagePath = req.file.filename;
  }

  try {
    // Se tem imagem nova, apagar a antiga
    if (imagePath) {
      const old = await query(`SELECT image_path FROM banners WHERE id = $1`, [id]);
      if (old.rows[0]?.image_path) {
        const oldFile = path.join(UPLOAD_DIR, old.rows[0].image_path);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
    }

    const result = await query(
      `UPDATE banners SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         type = COALESCE($3, type),
         active = COALESCE($4, active),
         image_path = COALESCE($5, image_path)
       WHERE id = $6
       RETURNING *`,
      [
        title,
        description,
        type,
        active === "true" ? true : active === "false" ? false : undefined,
        imagePath,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Banner não encontrado" });
    }

    await recordAccess(req.session.user.id, req.session.user.username, "banner.update", req, {
      bannerId: id,
    });

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("[CMS] Update banner error:", err.message);
    return res.status(500).json({ error: "Erro ao atualizar banner" });
  }
}

export async function deleteBanner(req, res) {
  const { id } = req.params;

  try {
    const result = await query(
      `DELETE FROM banners WHERE id = $1 RETURNING image_path`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Banner não encontrado" });
    }

    // Apagar imagem do disco
    if (result.rows[0].image_path) {
      const filePath = path.join(UPLOAD_DIR, result.rows[0].image_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await recordAccess(req.session.user.id, req.session.user.username, "banner.delete", req, {
      bannerId: id,
    });

    return res.json({ message: "Banner excluído" });
  } catch (err) {
    console.error("[CMS] Delete banner error:", err.message);
    return res.status(500).json({ error: "Erro ao excluir banner" });
  }
}

// ════════════════════════════════════════════════════════════
//  ATALHOS (SHORTCUTS)
// ════════════════════════════════════════════════════════════

// PÚBLICO
export async function listShortcutsPublic(req, res) {
  try {
    const result = await query(
      `SELECT id, title, description, icon, icon_path, url, active
       FROM shortcuts
       WHERE active = TRUE
       ORDER BY sort_order, created_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[CMS] List shortcuts public error:", err.message);
    return res.status(500).json({ error: "Erro ao listar atalhos" });
  }
}

// ADMIN
export async function listShortcuts(req, res) {
  try {
    const result = await query(
      `SELECT id, title, description, icon, icon_path, url, active, sort_order, created_at
       FROM shortcuts
       ORDER BY sort_order, created_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[CMS] List shortcuts error:", err.message);
    return res.status(500).json({ error: "Erro ao listar atalhos" });
  }
}

export async function createShortcut(req, res) {
  const { title, description, icon, url, active } = req.body;
  const userId = req.session.user.id;
  const iconPath = req.file ? req.file.filename : "";

  if (!title?.trim()) {
    return res.status(400).json({ error: "Título do atalho é obrigatório" });
  }

  try {
    const result = await query(
      `INSERT INTO shortcuts (title, description, icon, icon_path, url, active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title.trim(),
        description || "",
        icon || "",
        iconPath,
        url || "#",
        active !== "false" && active !== false,
        userId,
      ]
    );

    await recordAccess(userId, req.session.user.username, "shortcut.create", req, {
      shortcutId: result.rows[0].id,
    });

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[CMS] Create shortcut error:", err.message);
    return res.status(500).json({ error: "Erro ao criar atalho" });
  }
}

export async function updateShortcut(req, res) {
  const { id } = req.params;
  const { title, description, icon, url, active } = req.body;
  const iconPath = req.file ? req.file.filename : undefined;

  try {
    if (iconPath) {
      const old = await query(`SELECT icon_path FROM shortcuts WHERE id = $1`, [id]);
      if (old.rows[0]?.icon_path) {
        const oldFile = path.join(UPLOAD_DIR, old.rows[0].icon_path);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
    }

    const activeValue = active === "true" ? true : active === "false" ? false : active;

    const result = await query(
      `UPDATE shortcuts SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         icon = COALESCE($3, icon),
         icon_path = COALESCE($4, icon_path),
         url = COALESCE($5, url),
         active = COALESCE($6, active)
       WHERE id = $7
       RETURNING *`,
      [title, description, icon, iconPath, url, activeValue, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Atalho não encontrado" });
    }

    await recordAccess(req.session.user.id, req.session.user.username, "shortcut.update", req, {
      shortcutId: id,
    });

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("[CMS] Update shortcut error:", err.message);
    return res.status(500).json({ error: "Erro ao atualizar atalho" });
  }
}

export async function deleteShortcut(req, res) {
  const { id } = req.params;

  try {
    const result = await query(
      `DELETE FROM shortcuts WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Atalho não encontrado" });
    }

    await recordAccess(req.session.user.id, req.session.user.username, "shortcut.delete", req, {
      shortcutId: id,
    });

    return res.json({ message: "Atalho excluído" });
  } catch (err) {
    console.error("[CMS] Delete shortcut error:", err.message);
    return res.status(500).json({ error: "Erro ao excluir atalho" });
  }
}

// ════════════════════════════════════════════════════════════
//  BLOCOS DE CONTEÚDO (Quem Somos)
// ════════════════════════════════════════════════════════════

// PÚBLICO
export async function listBlocksPublic(req, res) {
  try {
    const result = await query(
      `SELECT id, title, text, image_path, image_position, active
       FROM content_blocks
       WHERE active = TRUE
       ORDER BY sort_order, created_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[CMS] List blocks public error:", err.message);
    return res.status(500).json({ error: "Erro ao listar blocos" });
  }
}

// ADMIN
export async function listBlocks(req, res) {
  try {
    const result = await query(
      `SELECT id, title, text, image_path, image_position, active, sort_order, created_at
       FROM content_blocks
       ORDER BY sort_order, created_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[CMS] List blocks error:", err.message);
    return res.status(500).json({ error: "Erro ao listar blocos" });
  }
}

export async function createBlock(req, res) {
  const { title, text, image_position, active } = req.body;
  const userId = req.session.user.id;

  let imagePath = "";
  if (req.file) {
    imagePath = req.file.filename;
  }

  try {
    const result = await query(
      `INSERT INTO content_blocks (title, text, image_path, image_position, active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        title || "",
        text || "",
        imagePath,
        image_position || "abaixo",
        active === "true" || active === true || active === undefined,
        userId,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[CMS] Create block error:", err.message);
    return res.status(500).json({ error: "Erro ao criar bloco" });
  }
}

export async function updateBlock(req, res) {
  const { id } = req.params;
  const { title, text, image_position, active } = req.body;

  let imagePath = undefined;
  if (req.file) {
    imagePath = req.file.filename;

    // Apagar imagem antiga
    const old = await query(`SELECT image_path FROM content_blocks WHERE id = $1`, [id]);
    if (old.rows[0]?.image_path) {
      const oldFile = path.join(UPLOAD_DIR, old.rows[0].image_path);
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }
  }

  try {
    const result = await query(
      `UPDATE content_blocks SET
         title = COALESCE($1, title),
         text = COALESCE($2, text),
         image_position = COALESCE($3, image_position),
         active = COALESCE($4, active),
         image_path = COALESCE($5, image_path)
       WHERE id = $6
       RETURNING *`,
      [
        title,
        text,
        image_position,
        active === "true" ? true : active === "false" ? false : undefined,
        imagePath,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bloco não encontrado" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("[CMS] Update block error:", err.message);
    return res.status(500).json({ error: "Erro ao atualizar bloco" });
  }
}

export async function deleteBlock(req, res) {
  const { id } = req.params;

  try {
    const result = await query(
      `DELETE FROM content_blocks WHERE id = $1 RETURNING image_path`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bloco não encontrado" });
    }

    if (result.rows[0].image_path) {
      const filePath = path.join(UPLOAD_DIR, result.rows[0].image_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    return res.json({ message: "Bloco excluído" });
  } catch (err) {
    console.error("[CMS] Delete block error:", err.message);
    return res.status(500).json({ error: "Erro ao excluir bloco" });
  }
}

// ════════════════════════════════════════════════════════════
//  GRÁFICOS (Quem Somos)
// ════════════════════════════════════════════════════════════

// PÚBLICO
export async function listChartsPublic(req, res) {
  try {
    const result = await query(
      `SELECT id, title, description, bars
       FROM content_charts
       ORDER BY sort_order, created_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[CMS] List charts public error:", err.message);
    return res.status(500).json({ error: "Erro ao listar gráficos" });
  }
}

// ADMIN
export async function listCharts(req, res) {
  try {
    const result = await query(
      `SELECT id, title, description, bars, sort_order, created_at
       FROM content_charts
       ORDER BY sort_order, created_at`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[CMS] List charts error:", err.message);
    return res.status(500).json({ error: "Erro ao listar gráficos" });
  }
}

export async function createChart(req, res) {
  const { title, description, bars } = req.body;
  const userId = req.session.user.id;

  try {
    const result = await query(
      `INSERT INTO content_charts (title, description, bars, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        title || "",
        description || "",
        JSON.stringify(bars || []),
        userId,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[CMS] Create chart error:", err.message);
    return res.status(500).json({ error: "Erro ao criar gráfico" });
  }
}

export async function updateChart(req, res) {
  const { id } = req.params;
  const { title, description, bars } = req.body;

  try {
    const result = await query(
      `UPDATE content_charts SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         bars = COALESCE($3, bars)
       WHERE id = $4
       RETURNING *`,
      [title, description, bars ? JSON.stringify(bars) : undefined, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Gráfico não encontrado" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("[CMS] Update chart error:", err.message);
    return res.status(500).json({ error: "Erro ao atualizar gráfico" });
  }
}

export async function deleteChart(req, res) {
  const { id } = req.params;

  try {
    const result = await query(
      `DELETE FROM content_charts WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Gráfico não encontrado" });
    }

    return res.json({ message: "Gráfico excluído" });
  } catch (err) {
    console.error("[CMS] Delete chart error:", err.message);
    return res.status(500).json({ error: "Erro ao excluir gráfico" });
  }
}
export async function reorderShortcuts(req, res) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: "Lista inválida",
      });
    }

    for (let index = 0; index < items.length; index++) {
      await query(
        `UPDATE shortcuts
         SET sort_order = $1
         WHERE id = $2`,
        [index, items[index]]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[CMS] Reorder shortcuts error:", err.message);

    res.status(500).json({
      error: "Erro ao reordenar atalhos",
    });
  }
}
export async function reorderBlocks(req, res) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: "Lista inválida",
      });
    }

    for (let index = 0; index < items.length; index++) {
      await query(
        `UPDATE content_blocks
         SET sort_order = $1
         WHERE id = $2`,
        [index, items[index]]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[CMS] Reorder blocks error:", err.message);

    res.status(500).json({
      error: "Erro ao reordenar blocos",
    });
  }
}

export async function reorderCharts(req, res) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: "Lista inválida",
      });
    }

    for (let index = 0; index < items.length; index++) {
      await query(
        `UPDATE content_charts
         SET sort_order = $1
         WHERE id = $2`,
        [index, items[index]]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[CMS] Reorder charts error:", err.message);

    res.status(500).json({
      error: "Erro ao reordenar gráficos",
    });
  }
}
