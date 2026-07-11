import { query } from "../config/database.js";
import { fetchLogs } from "../services/logService.js";

export async function dashboardStats(req, res) {
  try {
    const [notices, docs, users, todayLogs] = await Promise.all([
      query(`SELECT COUNT(*) AS count FROM notices`),
      query(`SELECT COUNT(*) AS count FROM documents`),
      query(`SELECT COUNT(*) AS count FROM users`),
      query(`SELECT COUNT(*) AS count FROM access_logs WHERE created_at >= CURRENT_DATE`),
    ]);

    return res.json({
      noticeCount: parseInt(notices.rows[0].count, 10),
      documentCount: parseInt(docs.rows[0].count, 10),
      userCount: parseInt(users.rows[0].count, 10),
      todayAccessCount: parseInt(todayLogs.rows[0].count, 10),
    });
  } catch (err) {
    console.error("[Dashboard] Stats error:", err.message);
    return res.status(500).json({ error: "Erro ao carregar estatísticas" });
  }
}

export async function getAccessLogs(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const offset = parseInt(req.query.offset || "0", 10);
    const logs = await fetchLogs(limit, offset);
    return res.json(logs);
  } catch (err) {
    console.error("[Admin] Logs error:", err.message);
    return res.status(500).json({ error: "Erro ao listar logs" });
  }
}
