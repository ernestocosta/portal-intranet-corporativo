import { query } from "../config/database.js";

export async function recordAccess(userId, username, action, req, metadata = {}) {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    await query(
      `INSERT INTO access_logs (user_id, username, action, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, username, action, ip, userAgent, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error("[Log] Failed to record access:", err.message);
  }
}

export async function fetchLogs(limit = 50, offset = 0) {
  const result = await query(
    `SELECT id, username, action, ip_address, created_at
     FROM access_logs
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}
