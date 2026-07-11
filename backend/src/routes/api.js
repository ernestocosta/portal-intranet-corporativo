import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

import { requireAuth, requireRole } from "../middleware/auth.js";

import { login, logout, currentUser } from "../controllers/authController.js";

import {
  listNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from "../controllers/noticeController.js";

import {
  listDocuments,
  listDocumentsPublic,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  listFolders,
  listFoldersPublic,
  createFolder,
  deleteFolder,
} from "../controllers/documentController.js";

import {
  listDirectoryPublic,
  listDirectory,
  createMember,
  updateMember,
  deleteMember,
} from "../controllers/directoryController.js";

import { dashboardStats, getAccessLogs } from "../controllers/adminController.js";

import {
  listIndicatorsPublic,
  listIndicators,
  createIndicator,
  updateIndicator,
  deleteIndicator,
  reorderIndicators,
} from "../controllers/indicatorController.js";

import {
  listBannersPublic,
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,

  listShortcutsPublic,
  listShortcuts,
  createShortcut,
  updateShortcut,
  deleteShortcut,
  reorderShortcuts,

  listBlocksPublic,
  listBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,

  listChartsPublic,
  listCharts,
  createChart,
  updateChart,
  deleteChart,
  reorderCharts,
} from "../controllers/cmsController.js";

import {
  listMissionPublic,
  listMission,
  createMissionItem,
  updateMissionItem,
  deleteMissionItem,
  reorderMission,
} from "../controllers/missionController.js";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const blocked = [".exe", ".bat", ".cmd", ".sh", ".ps1"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (blocked.includes(ext)) return cb(new Error("Tipo de arquivo não permitido"));
    cb(null, true);
  },
});

const router = Router();

router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/me", currentUser);

router.get("/notices", requireAuth, listNotices);
router.post("/notices", requireAuth, requireRole("admin", "manager"), createNotice);
router.put("/notices/:id", requireAuth, requireRole("admin", "manager"), updateNotice);
router.delete("/notices/:id", requireAuth, requireRole("admin", "manager"), deleteNotice);

router.get("/documents", requireAuth, listDocuments);
router.get("/documents/public", listDocumentsPublic);
router.post("/documents/upload", requireAuth, requireRole("admin", "manager", "qualidade", "rh"), upload.single("file"), uploadDocument);
router.get("/documents/:id/download", downloadDocument);
router.delete("/documents/:id", requireAuth, requireRole("admin"), deleteDocument);

router.get("/folders/public", listFoldersPublic);
router.get("/folders", requireAuth, listFolders);
router.post("/folders", requireAuth, requireRole("admin", "manager", "qualidade", "rh"), createFolder);
router.delete("/folders/:id", requireAuth, requireRole("admin"), deleteFolder);

router.get("/directory/public", listDirectoryPublic);
router.get("/directory", requireAuth, listDirectory);
router.post("/directory", requireAuth, requireRole("admin", "manager", "rh", "qualidade"), upload.single("photo"), createMember);
router.put("/directory/:id", requireAuth, requireRole("admin", "manager", "rh", "qualidade"), upload.single("photo"), updateMember);
router.delete("/directory/:id", requireAuth, requireRole("admin", "manager", "rh", "qualidade"), deleteMember);

router.get("/dashboard/stats", requireAuth, dashboardStats);
router.get("/admin/logs", requireAuth, requireRole("admin", "manager"), getAccessLogs);

// ── Públicos ──────────────────────────────────────────────────
router.get("/public/banners",    listBannersPublic);
router.get("/public/shortcuts",  listShortcutsPublic);
router.get("/public/blocks",     listBlocksPublic);
router.get("/public/charts",     listChartsPublic);
router.get("/public/indicators", listIndicatorsPublic);
router.get("/public/mission",    listMissionPublic);   // ← NOVO

// ── CMS — Indicadores ────────────────────────────────────────
router.get("/cms/indicators",          requireAuth, requireRole("admin", "manager"), listIndicators);
router.post("/cms/indicators",         requireAuth, requireRole("admin", "manager"), createIndicator);
router.put("/cms/indicators/reorder",  requireAuth, requireRole("admin", "manager"), reorderIndicators);
router.put("/cms/indicators/:id",      requireAuth, requireRole("admin", "manager"), updateIndicator);
router.delete("/cms/indicators/:id",   requireAuth, requireRole("admin", "manager"), deleteIndicator);

// ── CMS — Banners ────────────────────────────────────────────
router.get("/cms/banners",     requireAuth, requireRole("admin", "manager", "qualidade", "rh"), listBanners);
router.post("/cms/banners",    requireAuth, requireRole("admin", "manager", "qualidade", "rh"), upload.single("image"), createBanner);
router.put("/cms/banners/:id", requireAuth, requireRole("admin", "manager", "qualidade", "rh"), upload.single("image"), updateBanner);
router.delete("/cms/banners/:id", requireAuth, requireRole("admin", "manager", "qualidade", "rh"), deleteBanner);

// ── CMS — Atalhos ─────────────────────────────────────────────
router.get("/cms/shortcuts",          requireAuth, requireRole("admin", "manager"), listShortcuts);
router.post("/cms/shortcuts",         requireAuth, requireRole("admin", "manager"), upload.single("icon_file"), createShortcut);
router.put("/cms/shortcuts/reorder",  requireAuth, requireRole("admin", "manager"), reorderShortcuts);
router.put("/cms/shortcuts/:id",      requireAuth, requireRole("admin", "manager"), upload.single("icon_file"), updateShortcut);
router.delete("/cms/shortcuts/:id",   requireAuth, requireRole("admin", "manager"), deleteShortcut);

// ── CMS — Blocos (Quem Somos) ─────────────────────────────────
router.get("/cms/blocks",         requireAuth, requireRole("admin", "manager", "qualidade", "rh"), listBlocks);
router.post("/cms/blocks",        requireAuth, requireRole("admin", "manager", "qualidade", "rh"), upload.single("image"), createBlock);
router.put("/cms/blocks/reorder", requireAuth, requireRole("admin", "manager", "qualidade", "rh"), reorderBlocks);
router.put("/cms/blocks/:id",     requireAuth, requireRole("admin", "manager", "qualidade", "rh"), upload.single("image"), updateBlock);
router.delete("/cms/blocks/:id",  requireAuth, requireRole("admin", "manager", "qualidade", "rh"), deleteBlock);

// ── CMS — Gráficos (Quem Somos) ───────────────────────────────
router.get("/cms/charts",         requireAuth, requireRole("admin", "manager", "qualidade", "rh"), listCharts);
router.post("/cms/charts",        requireAuth, requireRole("admin", "manager", "qualidade", "rh"), createChart);
router.put("/cms/charts/reorder", requireAuth, requireRole("admin", "manager", "qualidade", "rh"), reorderCharts);
router.put("/cms/charts/:id",     requireAuth, requireRole("admin", "manager", "qualidade", "rh"), updateChart);
router.delete("/cms/charts/:id",  requireAuth, requireRole("admin", "manager", "qualidade", "rh"), deleteChart);

// ── CMS — Missão & Visão ──────────────────────────────────────
router.get("/cms/mission",          requireAuth, requireRole("admin", "manager", "qualidade", "rh"), listMission);
router.post("/cms/mission",         requireAuth, requireRole("admin", "manager", "qualidade", "rh"), createMissionItem);
router.put("/cms/mission/reorder",  requireAuth, requireRole("admin", "manager", "qualidade", "rh"), reorderMission);
router.put("/cms/mission/:id",      requireAuth, requireRole("admin", "manager", "qualidade", "rh"), updateMissionItem);
router.delete("/cms/mission/:id",   requireAuth, requireRole("admin", "manager", "qualidade", "rh"), deleteMissionItem);

export default router;
