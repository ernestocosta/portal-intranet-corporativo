import { useEffect, useState } from "react";
import { LayoutDashboard, Megaphone, FolderOpen, Users, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [notices, setNotices] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    api.dashboard.stats().then(setStats).catch(() => {});
    api.notices.list().then((data) => setNotices(data.slice(0, 5))).catch(() => {});
    api.documents.list().then((data) => setDocuments(data.slice(0, 5))).catch(() => {});
  }, []);

  const statCards = [
    { label: "Avisos Ativos", value: stats?.noticeCount ?? "—", icon: Megaphone, trend: "+12%", up: true, color: "text-blue-600" },
    { label: "Documentos", value: stats?.documentCount ?? "—", icon: FolderOpen, trend: "+3", up: true, color: "text-brand-600" },
    { label: "Colaboradores", value: stats?.userCount ?? "—", icon: Users, trend: "+18", up: true, color: "text-green-600" },
    { label: "Acessos Hoje", value: stats?.todayAccessCount ?? "—", icon: LayoutDashboard, trend: "—", up: false, color: "text-amber-600" },
  ];

  const priorityClass = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-green-500" };
  const priorityLabel = { high: "Alta", medium: "Média", low: "Baixa" };

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral da instituição e principais atualizações" icon={LayoutDashboard} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${s.up ? "text-green-600" : "text-gray-400"}`}>
                {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {s.trend}
              </div>
            </div>
            <div className="mt-4 text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Avisos Recentes</h3>
            <span className="text-xs text-gray-400">{notices.length} exibidos</span>
          </div>
          <div className="divide-y divide-gray-100">
            {notices.length === 0 && (
              <div className="p-5 text-center text-sm text-gray-400">Nenhum aviso disponível</div>
            )}
            {notices.map((a) => (
              <div key={a.id} className="flex gap-4 p-5">
                <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityClass[a.priority] || "bg-gray-300"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-medium text-gray-900">{a.title}</h4>
                    <span className="badge bg-gray-100 text-gray-600">{priorityLabel[a.priority] || a.priority}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{a.content}</p>
                  <div className="mt-2 text-xs text-gray-400">{a.author} · {a.published_at}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Documentos Recentes</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {documents.length === 0 && (
              <div className="p-5 text-center text-sm text-gray-400">Nenhum documento</div>
            )}
            {documents.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">{d.name}</div>
                  <div className="text-xs text-gray-400">{d.folder_name || "Geral"} · {d.updated_at?.slice(0, 10)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-gray-900">Seu Perfil</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <InfoItem label="Nome" value={user?.displayName} />
          <InfoItem label="Email" value={user?.email} />
          <InfoItem label="Departamento" value={user?.department} />
          <InfoItem label="Cargo" value={user?.jobTitle} />
          <InfoItem label="Perfil" value={user?.role} />
          <InfoItem label="Grupos" value={user?.groups?.join(", ") || "—"} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-gray-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-gray-900">{value || "—"}</div>
    </div>
  );
}
