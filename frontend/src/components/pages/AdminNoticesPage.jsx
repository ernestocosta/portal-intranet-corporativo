import { useEffect, useState } from "react";
import { Bell, Plus, Edit2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";

const emptyForm = { title: "", content: "", author: "", priority: "medium", visibility: "all" };

export default function AdminNoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const loadNotices = () => {
    api.notices.list()
      .then(setNotices)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadNotices(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyForm, author: user?.displayName || "" });
    setModalOpen(true);
  };

  const openEdit = (n) => {
    setEditId(n.id);
    setForm({ title: n.title, content: n.content, author: n.author, priority: n.priority, visibility: n.visibility });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Título e conteúdo são obrigatórios");
      return;
    }
    try {
      if (editId) {
        await api.notices.update(editId, form);
        toast.success("Aviso atualizado");
      } else {
        await api.notices.create(form);
        toast.success("Aviso publicado");
      }
      setModalOpen(false);
      loadNotices();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este aviso?")) return;
    try {
      await api.notices.delete(id);
      toast.success("Aviso excluído");
      loadNotices();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const priorityLabel = { high: "Alta", medium: "Média", low: "Baixa" };
  const visibilityLabel = { all: "Todos", managers: "Gestores", admins: "Admins" };

  return (
    <div>
      <PageHeader
        title="Gestão de Avisos"
        description="Criar, editar e excluir comunicados da instituição"
        icon={Bell}
        action={
          <button className="btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo Aviso
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <div className="card">
          <div className="divide-y divide-gray-100">
            {notices.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-400">Nenhum aviso cadastrado</div>
            )}
            {notices.map((a) => (
              <div key={a.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-gray-900">{a.title}</h3>
                    <span className="badge bg-gray-100 text-gray-600">{priorityLabel[a.priority]}</span>
                    <span className="text-xs text-gray-400">Para: {visibilityLabel[a.visibility]}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{a.content}</p>
                  <div className="mt-2 text-xs text-gray-400">{a.author} · {a.published_at}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary btn-sm" onClick={() => openEdit(a)}>
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="btn-secondary btn-sm text-red-600 hover:bg-red-50" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{editId ? "Editar Aviso" : "Novo Aviso"}</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="label">Título</label>
                <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} required />
              </div>
              <div>
                <label className="label">Conteúdo</label>
                <textarea className="input-field min-h-[120px]" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} maxLength={5000} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prioridade</label>
                  <select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="label">Visível Para</label>
                  <select className="input-field" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                    <option value="all">Todos</option>
                    <option value="managers">Gestores</option>
                    <option value="admins">Apenas Admins</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Autor</label>
                <input className="input-field" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">{editId ? "Salvar" : "Publicar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
