import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { api } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";

const priorityBadge = {
  high: "badge-high",
  medium: "badge-medium",
  low: "badge-low",
};
const priorityLabel = { high: "Alta", medium: "Média", low: "Baixa" };
const visibilityLabel = { all: "Todos", managers: "Gestores", admins: "Administradores" };

export default function NoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.notices.list()
      .then(setNotices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Avisos" description="Comunicados oficiais da instituição" icon={Megaphone} />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {notices.length === 0 && (
            <div className="card p-8 text-center text-gray-400">Nenhum aviso disponível</div>
          )}
          {notices.map((a) => (
            <article key={a.id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{a.title}</h2>
                  <div className="mt-1 text-xs text-gray-400">
                    {a.author} · {a.published_at} · Visibilidade: {visibilityLabel[a.visibility] || a.visibility}
                  </div>
                </div>
                <span className={`badge ${priorityBadge[a.priority] || "badge-medium"}`}>
                  {priorityLabel[a.priority] || a.priority}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-500">{a.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
