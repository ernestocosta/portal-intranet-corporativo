import { useEffect, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit, GripVertical, Monitor, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, uploadUrl } from "@/lib/api";

function ShortcutIcon({ item }) {
  if (item.icon_path) {
    return (
      <img
        src={uploadUrl(item.icon_path)}
        alt={item.title}
        className="h-10 w-10 rounded-lg object-contain"
      />
    );
  }

  return <Monitor className="h-5 w-5 text-[#026873]" />;
}

function SortableShortcut({ item, openEdit, remove }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab rounded-md p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-500 active:cursor-grabbing"
        title="Arrastar para reordenar"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100">
        <ShortcutIcon item={item} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-bold text-gray-900">{item.title}</div>

        <div className="text-sm text-gray-500">
          {item.description || "Sem descrição"}
        </div>

        <div className="mt-1 truncate text-sm text-green-700">
          {item.url || "#"}
        </div>

        <div className="mt-1 text-xs text-green-700">
          • {item.active ? "Ativo" : "Inativo"}
        </div>
      </div>

      <button className="btn-secondary btn-sm" onClick={() => openEdit(item)}>
        <Edit className="h-4 w-4" />
        Editar
      </button>

      <button
        className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
        onClick={() => remove(item.id)}
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </button>
    </div>
  );
}

export default function AdminShortcutsPage() {
  const [shortcuts, setShortcuts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    icon: "",
    iconFile: null,
    url: "",
    active: true,
  });

  const loadShortcuts = () => {
    api.cms.shortcuts
      .list()
      .then((data) => setShortcuts(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Erro ao carregar atalhos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadShortcuts();
  }, []);

  async function handleDragEnd(event) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = shortcuts.findIndex((item) => item.id === active.id);
    const newIndex = shortcuts.findIndex((item) => item.id === over.id);

    const reordered = arrayMove(shortcuts, oldIndex, newIndex);

    setShortcuts(reordered);

    try {
      await api.cms.shortcuts.reorder(reordered.map((item) => item.id));
      toast.success("Ordem atualizada");
    } catch (err) {
      toast.error("Erro ao salvar ordem");
      loadShortcuts();
    }
  }

  const openNew = () => {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      icon: "",
      iconFile: null,
      url: "",
      active: true,
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || "",
      description: item.description || "",
      icon: item.icon || "",
      iconFile: null,
      url: item.url || "",
      active: item.active ?? true,
    });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Informe o título do atalho");
      return;
    }

    const data = new FormData();
    data.append("title", form.title.trim());
    data.append("description", form.description || "");
    data.append("icon", form.icon || "");
    data.append("url", form.url || "#");
    data.append("active", String(form.active));

    if (form.iconFile) {
      data.append("icon_file", form.iconFile);
    }

    setSaving(true);

    try {
      if (editing) {
        await api.cms.shortcuts.update(editing.id, data);
        toast.success("Atalho atualizado");
      } else {
        await api.cms.shortcuts.create(data);
        toast.success("Atalho criado");
      }

      setModalOpen(false);
      loadShortcuts();
    } catch (err) {
      toast.error(err.message || "Erro ao salvar atalho");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Excluir este atalho?")) return;

    try {
      await api.cms.shortcuts.delete(id);
      toast.success("Atalho excluído");
      loadShortcuts();
    } catch (err) {
      toast.error(err.message || "Erro ao excluir atalho");
    }
  };

  if (loading) {
    return <div className="py-12 text-center">Carregando...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gerenciar Atalhos
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Arraste os itens pelos pontinhos para reorganizar
          </p>
        </div>

        <button className="btn-primary" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={shortcuts.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {shortcuts.map((item) => (
              <SortableShortcut
                key={item.id}
                item={item}
                openEdit={openEdit}
                remove={remove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="modal-content max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editing ? "Editar Atalho" : "Novo Atalho"}
              </h2>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="label">Ícone em imagem</label>
                <input
                  type="file"
                  accept="image/*"
                  className="input-field"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      iconFile: e.target.files?.[0] || null,
                    }))
                  }
                />
              </div>

              <div>
                <label className="label">Título *</label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="label">Descrição</label>
                <input
                  className="input-field"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="label">URL / Link</label>
                <input
                  className="input-field"
                  value={form.url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  className="input-field"
                  value={form.active ? "true" : "false"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      active: e.target.value === "true",
                    }))
                  }
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Salvando..." : editing ? "Salvar" : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
