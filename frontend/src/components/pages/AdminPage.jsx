import { Link } from "react-router-dom";
import { ShieldCheck, Bell, Activity, Link2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AdminPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.dashboard.stats().then(setStats).catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader
        title="Administração"
        description="Gestão de conteúdo do portal"
        icon={ShieldCheck}
      />

      <div className="grid gap-4 md:grid-cols-3 mt-6">

        {/* AVISOS */}
        <Link to="/portal/admin/avisos" className="card p-6 hover:shadow-md">
          <Bell className="h-6 w-6 text-brand-500" />
          <h3 className="mt-3 font-semibold">Gestão de Avisos</h3>
          <p className="text-sm text-gray-500">
            Total: {stats?.noticeCount ?? 0}
          </p>
        </Link>

        {/* ATALHOS */}
        <Link to="/portal/admin/atalhos" className="card p-6 hover:shadow-md">
          <Link2 className="h-6 w-6 text-brand-500" />
          <h3 className="mt-3 font-semibold">Atalhos</h3>
          <p className="text-sm text-gray-500">
            Links rápidos do painel
          </p>
        </Link>

        {/* LOGS */}
        <Link to="/portal/admin/logs" className="card p-6 hover:shadow-md">
          <Activity className="h-6 w-6 text-gray-600" />
          <h3 className="mt-3 font-semibold">Logs de Acesso</h3>
          <p className="text-sm text-gray-500">
            Visualizar histórico
          </p>
        </Link>

      </div>
    </div>
  );
}