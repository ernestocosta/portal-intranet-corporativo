import { query } from "../config/database.js";
import { recordAccess } from "../services/logService.js";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

function canManageAll(user) {
  return ["admin", "qualidade", "rh"].includes(user.role);
}

// 🔥 ROTA PÚBLICA — lista apenas documentos com is_public = TRUE (sem autenticação)
export async function listDocumentsPublic(req, res) {
  try {
    const result = await query(
      `SELECT d.id, d.name, d.original_name, d.mime_type, d.file_size,
              d.department, d.is_public, d.created_at, d.updated_at,
              f.name AS folder_name, f.id AS folder_id,
              u.display_name AS uploaded_by_name
       FROM documents d
       LEFT JOIN folders f ON d.folder_id = f.id
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.is_public = TRUE
       ORDER BY d.updated_at DESC`
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("[Docs] Public list error:", err.message);
    return res.status(500).json({ error: "Erro ao listar documentos públicos" });
  }
}

export async function listDocuments(req, res) {
  try {
    const user = req.session.user;
    let filterClause;
    const params = [];

    if (canManageAll(user)) {
      filterClause = "1=1";
    } else {
      filterClause = `(d.is_public = TRUE OR d.department = $1 OR d.department = 'Geral')`;
      params.push(user.department);
    }

    const result = await query(
      `SELECT d.id, d.name, d.original_name, d.mime_type, d.file_size,
              d.department, d.is_public, d.created_at, d.updated_at,
              f.name AS folder_name, f.id AS folder_id,
              u.display_name AS uploaded_by_name
       FROM documents d
       LEFT JOIN folders f ON d.folder_id = f.id
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE ${filterClause}
       ORDER BY d.updated_at DESC`,
      params
    );

    return res.json(result.rows);
  } catch (err) {
    console.error("[Docs] List error:", err.message);
    return res.status(500).json({ error: "Erro ao listar documentos" });
  }
}

export async function uploadDocument(req, res) {
  const user = req.session.user;

  if (!canManageAll(user)) {
    return res.status(403).json({ error: "Sem permissão para enviar documentos" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado" });
  }

  const { folder_id, department, is_public } = req.body;
  const file = req.file;

  try {
    const storagePath = path.relative(UPLOAD_DIR, file.path);

    const result = await query(
      `INSERT INTO documents (name, original_name, mime_type, file_size, storage_path, folder_id, department, is_public, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        file.originalname,
        file.originalname,
        file.mimetype,
        file.size,
        storagePath,
        folder_id || null,
        department || "Geral",
        is_public === "true" || is_public === true,
        user.id,
      ]
    );

    await recordAccess(user.id, user.username, "document.upload", req, {
      documentId: result.rows[0].id,
      fileName: file.originalname,
    });

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[Docs] Upload error:", err.message);
    return res.status(500).json({ error: "Erro ao salvar documento" });
  }
}

// 🔥 Download público para documentos marcados como is_public
// Download privado para documentos internos (exige sessão)
export async function downloadDocument(req, res) {
  const { id } = req.params;

  try {
    const result = await query(
      `SELECT d.*, f.name AS folder_name
       FROM documents d
       LEFT JOIN folders f ON d.folder_id = f.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Documento não encontrado" });
    }

    const doc = result.rows[0];
    const user = req.session?.user;

    // Se o documento NÃO é público, exigir autenticação
    if (!doc.is_public) {
      if (!user) {
        return res.status(401).json({ error: "Autenticação necessária" });
      }

      if (!canManageAll(user) && doc.department !== user.department && doc.department !== "Geral") {
        return res.status(403).json({ error: "Acesso negado a este documento" });
      }
    }

    const filePath = path.join(UPLOAD_DIR, doc.storage_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Arquivo não encontrado no servidor" });
    }

    if (user) {
      await recordAccess(user.id, user.username, "document.download", req, {
        documentId: id,
      });
    }

    res.setHeader("Content-Type", doc.mime_type);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.original_name)}"`);

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("[Docs] Download error:", err.message);
    return res.status(500).json({ error: "Erro ao baixar documento" });
  }
}

export async function deleteDocument(req, res) {
  const user = req.session.user;

  if (!canManageAll(user)) {
    return res.status(403).json({ error: "Sem permissão para excluir documentos" });
  }

  const { id } = req.params;

  try {
    const result = await query(
      `DELETE FROM documents WHERE id = $1 RETURNING storage_path, original_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Documento não encontrado" });
    }

    const filePath = path.join(UPLOAD_DIR, result.rows[0].storage_path);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await recordAccess(user.id, user.username, "document.delete", req, {
      documentId: id,
      fileName: result.rows[0].original_name,
    });

    return res.json({ message: "Documento excluído" });
  } catch (err) {
    console.error("[Docs] Delete error:", err.message);
    return res.status(500).json({ error: "Erro ao excluir documento" });
  }
}

export async function listFoldersPublic(req, res) {
  try {
    const result = await query(
      `SELECT id, name, department, parent_id, created_at FROM folders ORDER BY name`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[Docs] Public folder list error:", err.message);
    return res.status(500).json({ error: "Erro ao listar pastas públicas" });
  }
}

export async function listFolders(req, res) {
  try {
    const result = await query(
      `SELECT id, name, department, parent_id, created_at FROM folders ORDER BY name`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("[Docs] Folder list error:", err.message);
    return res.status(500).json({ error: "Erro ao listar pastas" });
  }
}

export async function createFolder(req, res) {
  const user = req.session.user;

  const isRoot = !req.body.parent_id;

  if (isRoot && user.role !== "admin") {
    return res.status(403).json({ error: "Somente TI pode criar setores" });
  }

  if (!canManageAll(user)) {
    return res.status(403).json({ error: "Sem permissão para criar pasta" });
  }

  const { name, department, parent_id } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: "Nome da pasta é obrigatório" });
  }

  try {
    const result = await query(
      `INSERT INTO folders (name, department, parent_id, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), department || "Geral", parent_id || null, user.id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[Docs] Folder create error:", err.message);
    return res.status(500).json({ error: "Erro ao criar pasta" });
  }
}

export async function deleteFolder(req, res) {
  const user = req.session.user;

  if (user.role !== "admin") {
    return res.status(403).json({ error: "Somente TI pode excluir pastas" });
  }

  const { id } = req.params;

  try {
    // Busca todos os documentos nessa pasta (e subpastas via CASCADE no DB)
    // Remove arquivos físicos dos documentos desta pasta
    const docs = await query(
      `SELECT storage_path FROM documents WHERE folder_id = $1`, [id]
    );

    for (const doc of docs.rows) {
      const filePath = path.join(UPLOAD_DIR, doc.storage_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // O CASCADE no banco cuida de subpastas e documentos vinculados
    const result = await query(
      `DELETE FROM folders WHERE id = $1 RETURNING name`, [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pasta não encontrada" });
    }

    await recordAccess(user.id, user.username, "folder.delete", req, { folderId: id });

    return res.json({ message: `Pasta "${result.rows[0].name}" excluída` });
  } catch (err) {
    console.error("[Docs] Folder delete error:", err.message);
    return res.status(500).json({ error: "Erro ao excluir pasta" });
  }
}
