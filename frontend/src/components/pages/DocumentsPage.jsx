import { useEffect, useState } from "react";
import {
  FolderOpen,
  FolderPlus,
  Upload,
  ArrowLeft,
  FileText,
  Download,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";

export default function DocumentsPage() {
  const { user } = useAuth();

  const canUpload = ["admin", "qualidade", "rh"].includes(user?.role);
  const isAdmin = user?.role === "admin";

  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [subfolderOpen, setSubfolderOpen] = useState(false);
  const [rootFolderOpen, setRootFolderOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadData = () => {
    Promise.all([
      api.folders.list().catch(() => []),
      api.documents.list().catch(() => []),
    ]).then(([flds, docs]) => {
      setFolders(flds);
      setDocuments(docs);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Se a pasta selecionada foi deletada, volta para raiz
  useEffect(() => {
    if (selectedFolder && folders.length > 0) {
      const still = folders.find((f) => f.id === selectedFolder.id);
      if (!still) setSelectedFolder(null);
    }
  }, [folders]);

  const rootFolders = folders.filter((f) => !f.parent_id);

  const subFolders = selectedFolder
    ? folders.filter((f) => String(f.parent_id) === String(selectedFolder.id))
    : [];

  const folderDocs = selectedFolder
    ? documents.filter((d) => String(d.folder_id) === String(selectedFolder.id))
    : [];

  // ── Upload ──────────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.target);

    if (selectedFolder?.id) {
      formData.set("folder_id", selectedFolder.id);
      formData.set("department", selectedFolder.department || selectedFolder.name);
    }

    try {
      await api.documents.upload(formData);
      toast.success("Documento enviado");
      setUploadOpen(false);
      e.target.reset();
      loadData();
    } catch (err) {
      toast.error(err.message || "Erro ao enviar documento");
    } finally {
      setUploading(false);
    }
  };

  // ── Excluir documento ────────────────────────────────
  const handleDeleteDoc = async (id, name) => {
    if (!confirm(`Excluir o documento "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.documents.delete(id);
      toast.success("Documento excluído");
      loadData();
    } catch (err) {
      toast.error(err.message || "Erro ao excluir documento");
    }
  };

  // ── Excluir pasta ────────────────────────────────────
  const handleDeleteFolder = async (folder, e) => {
    e.stopPropagation(); // não abre a pasta ao clicar no lixo
    if (
      !confirm(
        `Excluir a pasta "${folder.name}" e todo seu conteúdo?\n\nEsta ação removerá também todas as subpastas e documentos dentro dela.`
      )
    )
      return;
    try {
      await api.folders.delete(folder.id);
      toast.success(`Pasta "${folder.name}" excluída`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Erro ao excluir pasta");
    }
  };

  // ── Criar pasta raiz ─────────────────────────────────
  const handleCreateRootFolder = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    try {
      await api.folders.create({ name, department: name, parent_id: null });
      toast.success("Pasta de setor criada");
      setRootFolderOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Erro ao criar pasta");
    }
  };

  // ── Criar subpasta ───────────────────────────────────
  const handleCreateSubfolder = async (e) => {
    e.preventDefault();
    if (!selectedFolder?.id) { toast.error("Selecione uma pasta primeiro"); return; }
    const formData = new FormData(e.target);
    const name = formData.get("name");
    try {
      await api.folders.create({
        name,
        parent_id: selectedFolder.id,
        department: selectedFolder.department || selectedFolder.name,
      });
      toast.success("Subpasta criada");
      setSubfolderOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || "Erro ao criar subpasta");
    }
  };

  // ── Componente de card de pasta com botão excluir ────
  const FolderCard = ({ folder, onClick }) => (
    <div className="relative group">
      <button
        type="button"
        className="w-full rounded-lg bg-[#3b5f6b] p-4 text-left font-semibold text-white transition hover:bg-[#2f4f59]"
        onClick={onClick}
      >
        {folder.name}
      </button>
      {isAdmin && (
        <button
          type="button"
          title="Excluir pasta"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/50 opacity-0 transition hover:bg-red-600 hover:text-white group-hover:opacity-100"
          onClick={(e) => handleDeleteFolder(folder, e)}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Documentos Institucionais"
        description={selectedFolder ? selectedFolder.name : "Organizados por setor"}
        icon={FolderOpen}
        action={
          <div className="flex gap-2">
            {isAdmin && !selectedFolder && (
              <button className="btn-secondary" onClick={() => setRootFolderOpen(true)}>
                <FolderPlus className="h-4 w-4" /> Nova Pasta
              </button>
            )}

            {canUpload && selectedFolder && (
              <>
                <button className="btn-secondary" onClick={() => setSubfolderOpen(true)}>
                  <FolderPlus className="h-4 w-4" /> Criar Subpasta
                </button>
                <button className="btn-primary" onClick={() => setUploadOpen(true)}>
                  <Upload className="h-4 w-4" /> Enviar Documento
                </button>
              </>
            )}
          </div>
        }
      />

      {selectedFolder && (
        <button
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          onClick={() => setSelectedFolder(null)}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para setores
        </button>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : !selectedFolder ? (
        /* ── Lista de pastas raiz ── */
        <div className="grid gap-4 md:grid-cols-3">
          {rootFolders.length === 0 ? (
            <div className="col-span-3 card p-8 text-center text-gray-400">
              Nenhuma pasta criada ainda.
              {isAdmin && (
                <button
                  className="ml-2 text-brand-600 underline"
                  onClick={() => setRootFolderOpen(true)}
                >
                  Criar primeira pasta
                </button>
              )}
            </div>
          ) : (
            rootFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onClick={() => setSelectedFolder(folder)}
              />
            ))
          )}
        </div>
      ) : (
        /* ── Dentro de uma pasta ── */
        <div className="space-y-6">
          {subFolders.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">Subpastas</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {subFolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={() => setSelectedFolder(folder)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header font-semibold text-gray-700">
              Documentos em {selectedFolder.name}
            </div>

            {folderDocs.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                Nenhum documento nesta pasta
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {folderDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 p-4">
                    <FileText className="h-5 w-5 shrink-0 text-brand-600" />

                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-gray-900">
                        {doc.name || doc.original_name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{doc.department}</span>
                        {doc.is_public && (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700 font-medium">
                            Público
                          </span>
                        )}
                        {doc.file_size && (
                          <span>{Math.round(doc.file_size / 1024)} KB</span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <a
                        href={api.documents.downloadUrl(doc.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary btn-sm"
                      >
                        <Download className="h-4 w-4" /> Baixar
                      </a>

                      {isAdmin && (
                        <button
                          className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteDoc(doc.id, doc.name || doc.original_name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Nova pasta raiz ── */}
      {rootFolderOpen && (
        <div className="modal-overlay" onClick={() => setRootFolderOpen(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Nova Pasta de Setor</h3>
              <button onClick={() => setRootFolderOpen(false)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateRootFolder} className="space-y-4">
              <div>
                <label className="label">Nome do setor/pasta</label>
                <input name="name" required maxLength={120} className="input-field" placeholder="Ex: Departamento Pessoal" />
              </div>
              <div className="text-xs text-gray-500">
                Esta pasta será criada na raiz. Apenas TI pode criar setores.
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setRootFolderOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Criar subpasta ── */}
      {subfolderOpen && (
        <div className="modal-overlay" onClick={() => setSubfolderOpen(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Criar Subpasta</h3>
              <button onClick={() => setSubfolderOpen(false)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubfolder} className="space-y-4">
              <div>
                <label className="label">Nome da subpasta</label>
                <input name="name" required maxLength={120} className="input-field" placeholder="Ex: Normas internas" />
              </div>
              <div className="text-xs text-gray-500">
                Será criada dentro de: <strong>{selectedFolder?.name}</strong>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setSubfolderOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Enviar Documento ── */}
      {uploadOpen && (
        <div className="modal-overlay" onClick={() => setUploadOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Enviar Documento</h3>
              <button onClick={() => setUploadOpen(false)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="label">Arquivo</label>
                <input type="file" name="file" required className="input-field" />
              </div>

              <input type="hidden" name="folder_id" value={selectedFolder?.id || ""} />
              <input type="hidden" name="department" value={selectedFolder?.department || selectedFolder?.name || "Geral"} />

              {/* ── Checkbox is_public ── */}
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <input
                  type="checkbox"
                  name="is_public"
                  id="is_public"
                  value="true"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-brand-500"
                />
                <div>
                  <label htmlFor="is_public" className="cursor-pointer text-sm font-medium text-gray-900">
                    Disponível no site público
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Marque se este documento deve aparecer na página "Documentos" do site público, sem exigir login.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setUploadOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
