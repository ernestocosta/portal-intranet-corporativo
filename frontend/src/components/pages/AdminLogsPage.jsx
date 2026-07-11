import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Activity } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.admin.logs(50)
      .then(setLogs)
      .catch(() => alert("Erro ao carregar logs"));
  }, []);

  return (
    <div>
      <PageHeader
        title="Logs de Acesso"
        description="Histórico de acessos do sistema"
        icon={Activity}
      />

      <div className="card mt-6">
        {logs.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            Nenhum log encontrado
          </div>
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id} className="flex justify-between p-4 text-sm">
                <div>
                  <div className="font-semibold text-gray-900">
                    {log.username}
                  </div>
                  <div className="text-gray-500">{log.action}</div>
                </div>

                <div className="text-gray-400">
                  {new Date(log.created_at).toLocaleString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}