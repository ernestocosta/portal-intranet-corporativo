import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";

import PublicLayout from "./components/layout/PublicLayout";
import PrivateLayout from "./components/layout/PrivateLayout";

import HomePage from "./components/pages/HomePage";
import LoginPage from "./components/pages/LoginPage";
import AboutPage from "./components/pages/AboutPage";
import MissionPage from "./components/pages/MissionPage";
import BoardPage from "./components/pages/BoardPage";
import PublicDocsPage from "./components/pages/PublicDocsPage";
import PublicIndicatorsPage from "./components/pages/PublicIndicatorsPage";

import DashboardPage from "./components/pages/DashboardPage";
import NoticesPage from "./components/pages/NoticesPage";
import DocumentsPage from "./components/pages/DocumentsPage";
import DirectoryPage from "./components/pages/DirectoryPage";
import IndicatorsPage from "./components/pages/IndicatorsPage";

import AdminPage from "./components/pages/AdminPage";
import AdminQuemSomosPage from "./components/pages/AdminQuemSomosPage";
import AdminMissaoPage from "./components/pages/AdminMissaoPage";
import AdminNoticesPage from "./components/pages/AdminNoticesPage";
import AdminDocumentsPage from "./components/pages/AdminDocumentsPage";
import AdminShortcutsPage from "./components/pages/AdminShortcutsPage";
import AdminLogsPage from "./components/pages/AdminLogsPage";

import BannerPage from "./components/pages/BannerPage";

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(...roles)) {
    return <Navigate to="/portal" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="quem-somos" element={<AboutPage />} />
        <Route path="missao" element={<MissionPage />} />
        <Route path="diretoria" element={<BoardPage />} />
        <Route path="documentos" element={<PublicDocsPage />} />
        <Route path="indicadores" element={<PublicIndicatorsPage />} />
      </Route>

      <Route path="login" element={<LoginPage />} />

      {/* PORTAL */}
      <Route
        path="portal"
        element={
          <ProtectedRoute>
            <PrivateLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        <Route path="banner" element={<BannerPage />} />
        <Route path="avisos" element={<NoticesPage />} />
        <Route path="documentos" element={<DocumentsPage />} />
        <Route path="diretoria" element={<DirectoryPage />} />
        <Route path="indicadores" element={<IndicatorsPage />} />

        {/* ADMIN */}
        <Route
          path="admin"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/avisos"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <AdminNoticesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/documentos"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDocumentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/atalhos"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminShortcutsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/logs"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <AdminLogsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/quem-somos"
          element={
            <ProtectedRoute roles={["admin", "manager", "rh", "qualidade"]}>
              <AdminQuemSomosPage />
            </ProtectedRoute>
          }
        />

        {/* ← NOVO */}
        <Route
          path="admin/missao"
          element={
            <ProtectedRoute roles={["admin", "manager", "rh", "qualidade"]}>
              <AdminMissaoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/diretoria"
          element={
            <ProtectedRoute roles={["admin", "rh", "qualidade"]}>
              <DirectoryPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
