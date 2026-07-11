import { useEffect, useState } from "react";
import { Settings, Trash2, FileText, Upload, X, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";

export default function AdminDocumentsPage() {
  const { user } = useAuth();

  const canManageAll = ["admin", "qualidade", "rh"].includes(user?.role);
  const isAdmin = user?.role === "admin";

  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    Promise.all([
      api.documents.list().catch(() => []),
      api.folders.list().catch(() => []),
    ]).then(([docs, flds]) => {
      setDocuments(docs);
      setFolders(flds);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await api.documents.upload(formData);
      toast.success("Documento enviado");
      setUploadOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este documento?")) return;

    try {
      await api.documents.delete(id);
      toast.success("Documento excluído");
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const parent_id = formData.get("parent_id") || null;

    try {
      await api.folders.create({
        name: formData.get("name"),
        department: formData.get("department"),
        parent_id,
      });

      toast.success("Pasta criada");
      setFolderOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Gestão de Documentos"
        description="Somente TI cria setores. RH/Qualidade criam subpastas."
        icon={Settings}
        action={
          canManageAll && (
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => setFolderOpen(true)}>
                <FolderPlus className="h-4 w-4" /> Nova Pasta
              </button>

              <button className="btn-primary" onClick={() => setUploadOpen(true)}>
                <Upload className="h-4 w-4" /> Enviar Documento
              </button>
            </div>
          )
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <div className="card">
          <div className="divide-y divide-gray-100">
            {documents.map((d) => (
              <div key={d.id} className="flex items-center gap-4 p-4">
                <FileText className="h-5 w-5 text-brand-600" />

                <div className="flex-1">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-gray-400">
                    {d.folder_name || "Sem pasta"} · {d.department} · {d.is_public ? "Público" : "Interno"}
                  </div>
                </div>

                {canManageAll && (
                  <button
                    className="btn-secondary btn-sm text-red-600"
                    onClick={() => handleDelete(d.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL CRIAR PASTA */}
      {folderOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm">
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input name="name" placeholder="Nome da pasta" required />

              {/* 🔥 TI pode criar setor */}
              {isAdmin && (
                <select name="parent_id">
                  <option value="">Criar como SETOR (raiz)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      Subpasta de {f.name}
                    </option>
                  ))}
                </select>
              )}

              {/* 🔥 RH / QUALIDADE só subpasta */}
              {!isAdmin && (
                <select name="parent_id" required>
                  <option value="">Selecione o setor</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}

              <button type="submit">Criar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD */}
      {uploadOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form onSubmit={handleUpload}>
              <input type="file" name="file" required />

              <select name="folder_id">
                <option value="">Selecione a pasta</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="is_public" value="true" />
                Exibir este documento também na tela pública
              </label>

              <button type="submit">Enviar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}