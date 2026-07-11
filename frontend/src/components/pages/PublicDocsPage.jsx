import { FolderOpen, FileText, Download, ArrowLeft } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";

export default function PublicDocsPage() {
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    Promise.all([
      api.documents.listPublic().catch(() => []),
      api.folders.listPublic().catch(() => []),
    ])
      .then(([docs, flds]) => {
        setDocuments(Array.isArray(docs) ? docs : []);
        setFolders(Array.isArray(flds) ? flds : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const currentFolder = useMemo(
    () => folders.find((f) => f.id === currentFolderId) || null,
    [folders, currentFolderId]
  );

  const visibleFolders = useMemo(
    () => folders.filter((f) => (currentFolderId ? f.parent_id === currentFolderId : !f.parent_id)),
    [folders, currentFolderId]
  );

  const visibleDocuments = useMemo(
    () => documents.filter((d) => (currentFolderId ? d.folder_id === currentFolderId : !d.folder_id)),
    [documents, currentFolderId]
  );

  function openFolder(folder) {
    setHistory((prev) => [...prev, currentFolderId]);
    setCurrentFolderId(folder.id);
  }

  function goBack() {
    setHistory((prev) => {
      const copy = [...prev];
      const previous = copy.pop() || null;
      setCurrentFolderId(previous);
      return copy;
    });
  }

  return (
    <>
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">Documentos Públicos</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-500">
            Documentos institucionais disponíveis para consulta aberta.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : folders.length === 0 && documents.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">
            Nenhum documento público disponível no momento.
          </div>
        ) : (
          <div className="space-y-8">
            {currentFolder && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">Pasta atual</p>
                  <h2 className="text-2xl font-bold text-gray-900">{currentFolder.name}</h2>
                </div>

                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
              </div>
            )}

            {visibleFolders.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                {visibleFolders.map((folder) => (
                  <button
                    type="button"
                    key={folder.id}
                    onClick={() => openFolder(folder)}
                    className="flex items-center gap-3 rounded-xl bg-[#465f6b] p-5 text-left font-semibold text-white shadow-sm transition hover:bg-[#3d535d] focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <FolderOpen className="h-5 w-5 shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))}
              </div>
            )}

            {visibleDocuments.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleDocuments.map((d) => (
                  <div key={d.id} className="card flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-gray-900">{d.name || d.original_name}</div>
                      <div className="text-xs text-gray-400">
                        {d.folder_name || "Geral"} · {Math.round((d.file_size || 0) / 1024)} KB
                      </div>
                    </div>
                    <a href={api.documents.downloadUrl(d.id)} className="btn-secondary btn-sm" download>
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {visibleFolders.length === 0 && visibleDocuments.length === 0 && (
              <div className="card p-8 text-center text-gray-400">
                Esta pasta ainda não possui documentos ou subpastas públicas.
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
