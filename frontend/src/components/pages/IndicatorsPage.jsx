import { useEffect, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit, GripVertical, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

function SortableItem({ indicator, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: indicator.id });

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
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="font-bold text-gray-900">{indicator.title}</div>

        <div className="mt-1 inline-flex rounded-full bg-cyan-50 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-[#3b5f6b]">
          {indicator.sector}
        </div>

        <div className="mt-2 truncate text-sm text-green-700">
          {indicator.active ? "Ativo" : "Inativo"} — {indicator.url}
        </div>
      </div>

      <button className="btn-secondary btn-sm" onClick={() => onEdit(indicator)}>
        <Edit className="h-4 w-4" />
        Editar
      </button>

      <button
        className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
        onClick={() => onDelete(indicator.id)}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function IndicatorsPage() {
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    sector: "",
    title: "",
    url: "",
    active: true,
  });

  async function loadIndicators() {
    try {
      const data = await api.cms.indicators.list();
      setIndicators(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Erro ao carregar indicadores");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIndicators();
  }, []);

  async function handleDragEnd(event) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = indicators.findIndex((item) => item.id === active.id);
    const newIndex = indicators.findIndex((item) => item.id === over.id);

    const reordered = arrayMove(indicators, oldIndex, newIndex);

    setIndicators(reordered);

    try {
      await api.cms.indicators.reorder(reordered.map((item) => item.id));
      toast.success("Ordem atualizada");
    } catch (err) {
      toast.error("Erro ao salvar ordem");
      loadIndicators();
    }
  }

  function openNew() {
    setEditing(null);
    setForm({
      sector: "",
      title: "",
      url: "",
      active: true,
    });
    setModalOpen(true);
  }

  function openEdit(indicator) {
    setEditing(indicator);
    setForm({
      sector: indicator.sector || "",
      title: indicator.title || "",
      url: indicator.url || "",
      active: indicator.active ?? true,
    });
    setModalOpen(true);
  }

  async function save(e) {
    e.preventDefault();

    if (!form.sector.trim() || !form.title.trim() || !form.url.trim()) {
      toast.error("Preencha setor, título e URL");
      return;
    }

    setSaving(true);

    try {
      if (editing) {
        await api.cms.indicators.update(editing.id, form);
        toast.success("Indicador atualizado");
      } else {
        await api.cms.indicators.create(form);
        toast.success("Indicador criado");
      }

      setModalOpen(false);
      loadIndicators();
    } catch (err) {
      toast.error(err.message || "Erro ao salvar indicador");
    } finally {
      setSaving(false);
    }
  }

  async function deleteIndicator(id) {
    if (!confirm("Excluir indicador?")) return;

    try {
      await api.cms.indicators.delete(id);
      toast.success("Indicador excluído");
      loadIndicators();
    } catch (err) {
      toast.error("Erro ao excluir indicador");
    }
  }

  if (loading) {
    return <div className="py-12 text-center">Carregando...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gerenciar Indicadores
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Adicione, edite, exclua e arraste para reorganizar
          </p>

          <a
            href="/indicadores"
            target="_blank"
            className="mt-4 inline-flex rounded-md bg-cyan-50 px-4 py-2 text-sm font-semibold text-[#3b5f6b] hover:bg-cyan-100"
          >
            Ver página pública
          </a>
        </div>

        <button className="btn-primary" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Novo Indicador
        </button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={indicators.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {indicators.map((indicator) => (
              <SortableItem
                key={indicator.id}
                indicator={indicator}
                onEdit={openEdit}
                onDelete={deleteIndicator}
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
                {editing ? "Editar Indicador" : "Novo Indicador"}
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
                <label className="label">Setor</label>
                <input
                  className="input-field"
                  value={form.sector}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sector: e.target.value }))
                  }
                  placeholder="Ex: ENFERMAGEM"
                />
              </div>

              <div>
                <label className="label">Título</label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Ex: Monitoramento"
                />
              </div>

              <div>
                <label className="label">URL</label>
                <input
                  className="input-field"
                  value={form.url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="http://..."
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
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
