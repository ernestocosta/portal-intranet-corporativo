import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  BarChart3,
  Megaphone,
  ShieldCheck,
  Bell,
  Settings,
  LogOut,
  Building2,
  Menu,
  X,
  ArrowLeftRight,
  BookOpen,
  Target,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { getSwitchUrl, getSwitchLabel } from "@/lib/env";

const getMainNav = (user) => {
  const isRhOrQualidade = ["rh", "qualidade"].includes(user?.role);

  return [
    { to: "/portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/portal/banner", label: "Banner", icon: Megaphone },
    { to: "/portal/documentos", label: "Documentos", icon: FolderOpen },
    { to: "/portal/diretoria", label: "Diretoria", icon: Users },

    ...(!isRhOrQualidade
      ? [{ to: "/portal/indicadores", label: "Indicadores", icon: BarChart3 }]
      : []),

    ...(isRhOrQualidade
      ? [
          { to: "/portal/admin/quem-somos", label: "Editor Quem Somos", icon: BookOpen },
          { to: "/portal/admin/missao",     label: "Editor Missão & Visão", icon: Target },
        ]
      : []),
  ];
};

const adminNav = [
  {
    to: "/portal/admin",
    label: "Administração",
    icon: ShieldCheck,
    roles: ["admin", "manager"],
    exact: true,
  },
  {
    to: "/portal/admin/avisos",
    label: "Gestão de Avisos",
    icon: Bell,
    roles: ["admin", "manager"],
  },
  {
    to: "/portal/admin/atalhos",
    label: "Atalhos",
    icon: Settings,
    roles: ["admin"],
  },
  {
    to: "/portal/admin/quem-somos",
    label: "Quem Somos",
    icon: BookOpen,
    roles: ["admin", "manager"],
  },
  {
    to: "/portal/admin/missao",
    label: "Missão & Visão",
    icon: Target,
    roles: ["admin", "manager"],
  },
];

export default function PrivateLayout() {
  const { user, logout, hasRole } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const switchUrl   = getSwitchUrl();
  const switchLabel = getSwitchLabel();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (item) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to);

  const visibleMainNav = getMainNav(user);
  const visibleAdmin = adminNav.filter((i) => hasRole(...i.roles));

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">HBP Intranet</div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400">
            Portal Interno
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Principal
        </div>

        {visibleMainNav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={`sidebar-link ${isActive(item) ? "active" : ""}`}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}

        {visibleAdmin.length > 0 && (
          <>
            <div className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Administração
            </div>
            {visibleAdmin.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${isActive(item) ? "active" : ""}`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 rounded-md bg-white/5 p-3">
          <div className="text-sm font-semibold text-white">{user?.displayName}</div>
          <div className="truncate text-xs text-gray-400">{user?.jobTitle}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">
            {user?.role}
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full">
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-brand-900 md:flex">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex h-full w-64 flex-col bg-brand-900">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md p-2 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="text-xs text-gray-400">{user?.department}</div>
              <div className="text-sm font-semibold text-gray-900">
                Olá, {user?.displayName?.split(" ")[0]}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Intranet
            </span>

            {switchUrl && switchUrl !== "#" ? (
              <a
                href={switchUrl}
                rel="noopener noreferrer"
                className="btn-secondary btn-sm inline-flex items-center gap-1.5"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{switchLabel}</span>
              </a>
            ) : (
              <span
                title="URL do Portal não configurada"
                className="btn-secondary btn-sm inline-flex cursor-not-allowed items-center gap-1.5 opacity-40"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{switchLabel}</span>
              </span>
            )}

            <Link to="/" className="btn-secondary btn-sm hidden sm:inline-flex">
              Site Público
            </Link>

            <button onClick={handleLogout} className="btn-secondary btn-sm md:hidden">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
