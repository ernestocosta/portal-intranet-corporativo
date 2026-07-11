import { query } from "../config/database.js";

export async function listIndicatorsPublic(req, res) {
  try {
    const result = await query(
      `SELECT id, sector, title, url, active, sort_order, created_at
       FROM indicators
       WHERE active = TRUE
       ORDER BY sort_order, created_at`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("[Indicators] Public list error:", err.message);

    res.status(500).json({
      error: "Erro ao listar indicadores",
    });
  }
}

export async function listIndicators(req, res) {
  try {
    const result = await query(
      `SELECT id, sector, title, url, active, sort_order, created_at
       FROM indicators
       ORDER BY sort_order, created_at`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("[Indicators] List error:", err.message);

    res.status(500).json({
      error: "Erro ao listar indicadores",
    });
  }
}

export async function createIndicator(req, res) {
  try {
    const { sector, title, url, active = true } = req.body;

    const result = await query(
      `INSERT INTO indicators (
        sector,
        title,
        url,
        active
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [sector, title, url, active]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[Indicators] Create error:", err.message);

    res.status(500).json({
      error: "Erro ao criar indicador",
    });
  }
}

export async function updateIndicator(req, res) {
  try {
    const { id } = req.params;

    const {
      sector,
      title,
      url,
      active = true,
    } = req.body;

    const result = await query(
      `UPDATE indicators
       SET sector = $1,
           title = $2,
           url = $3,
           active = $4
       WHERE id = $5
       RETURNING *`,
      [sector, title, url, active, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[Indicators] Update error:", err.message);

    res.status(500).json({
      error: "Erro ao atualizar indicador",
    });
  }
}

export async function deleteIndicator(req, res) {
  try {
    const { id } = req.params;

    await query(
      `DELETE FROM indicators
       WHERE id = $1`,
      [id]
    );

    res.json({
      success: true,
    });
  } catch (err) {
    console.error("[Indicators] Delete error:", err.message);

    res.status(500).json({
      error: "Erro ao excluir indicador",
    });
  }
}

export async function reorderIndicators(req, res) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: "Lista inválida",
      });
    }

    for (let index = 0; index < items.length; index++) {
      await query(
        `UPDATE indicators
         SET sort_order = $1
         WHERE id = $2`,
        [index, items[index]]
      );
    }

    res.json({
      success: true,
    });
  } catch (err) {
    console.error("[Indicators] Reorder error:", err.message);

    res.status(500).json({
      error: "Erro ao reordenar indicadores",
    });
  }
}
