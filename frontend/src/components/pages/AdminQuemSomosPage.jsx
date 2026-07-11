import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  X,
  BarChart2,
} from "lucide-react";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { api, uploadUrl } from "@/lib/api";

// ─── Valores iniciais dos formulários ────────────────────────
const emptyBlock = {
  title: "",
  text: "",
  image_position: "abaixo",
  active: true,
};

const emptyBar = { label: "", value: 0, color: "#3f7f73" };

const emptyChart = {
  title: "",
  description: "",
  bars: [{ ...emptyBar }],
};

// ─── Item arrastável — Bloco ──────────────────────────────────
function SortableBlock({ block, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
        type="button"
      >
        <GripVertical className="h-5 w-5 text-gray-300" />
      </button>

      <div className="h-14 w-24 overflow-hidden rounded-md bg-gray-100 shrink-0">
        {block.image_path ? (
          <img
            src={uploadUrl(block.image_path)}
            alt={block.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            Sem imagem
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-900 truncate">
          {block.title || "Sem título"}
        </div>
        <div className="mt-1 text-xs text-gray-500 line-clamp-1">{block.text}</div>
        <div className="mt-1 flex gap-2 text-xs">
          <span className="rounded bg-gray-100 px-2 py-0.5">
            imagem {block.image_position}
          </span>
          <span className={block.active ? "text-green-700" : "text-gray-400"}>
            • {block.active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      <button
        className="btn-secondary btn-sm shrink-0"
        onClick={() => onEdit(block)}
        type="button"
      >
        <Edit className="h-4 w-4" /> Editar
      </button>

      <button
        className="btn-secondary btn-sm text-red-600 hover:bg-red-50 shrink-0"
        onClick={() => onDelete(block.id)}
        type="button"
      >
        <Trash2 className="h-4 w-4" /> Excluir
      </button>
    </div>
  );
}

// ─── Item arrastável — Gráfico ────────────────────────────────
function SortableChart({ chart, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: chart.id });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const bars = Array.isArray(chart.bars) ? chart.bars : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
        type="button"
      >
        <GripVertical className="h-5 w-5 text-gray-300" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-900 truncate">{chart.title}</div>
        <div className="mt-1 text-xs text-gray-500 line-clamp-1">
          {chart.description}
        </div>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
          {bars.map((bar, i) => (
            <span key={i} className="flex items-center gap-1">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: bar.color }}
              />
              {bar.label}: {bar.value}%
            </span>
          ))}
        </div>
      </div>

      <button
        className="btn-secondary btn-sm shrink-0"
        onClick={() => onEdit(chart)}
        type="button"
      >
        <Edit className="h-4 w-4" /> Editar
      </button>

      <button
        className="btn-secondary btn-sm text-red-600 hover:bg-red-50 shrink-0"
        onClick={() => onDelete(chart.id)}
        type="button"
      >
        <Trash2 className="h-4 w-4" /> Excluir
      </button>
    </div>
  );
}

// ─── Modal de Bloco ───────────────────────────────────────────
function BlockModal({ editing, onClose, onSaved }) {
  const [form, setForm] = useState(
    editing
      ? {
          title: editing.title || "",
          text: editing.text || "",
          image_position: editing.image_position || "abaixo",
          active: editing.active ?? true,
        }
      : { ...emptyBlock }
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    editing?.image_path ? uploadUrl(editing.image_path) : ""
  );
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setSaving(true);

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("text", form.text);
    fd.append("image_position", form.image_position);
    fd.append("active", String(form.active));
    if (imageFile) fd.append("image", imageFile);

    try {
      if (editing) {
        await api.cms.blocks.update(editing.id, fd);
        toast.success("Bloco atualizado");
      } else {
        await api.cms.blocks.create(fd);
        toast.success("Bloco criado");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {editing ? "Editar Bloco" : "Novo Bloco"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Título *</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="label">Texto</label>
            <textarea
              className="input-field min-h-[120px]"
              rows={5}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Posição da imagem</label>
              <select
                className="input-field"
                value={form.image_position}
                onChange={(e) =>
                  setForm({ ...form, image_position: e.target.value })
                }
              >
                <option value="acima">Acima do texto</option>
                <option value="abaixo">Abaixo do texto</option>
                <option value="esquerda">À esquerda</option>
                <option value="direita">À direita</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input-field"
                value={form.active ? "true" : "false"}
                onChange={(e) =>
                  setForm({ ...form, active: e.target.value === "true" })
                }
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Imagem</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="input-field"
              onChange={handleImage}
            />
          </div>

          {imagePreview && (
            <div>
              <label className="label">Pré-visualização</label>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="max-h-48 w-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar" : "Criar Bloco"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal de Gráfico ─────────────────────────────────────────
function ChartModal({ editing, onClose, onSaved }) {
  const [form, setForm] = useState(
    editing
      ? {
          title: editing.title || "",
          description: editing.description || "",
          bars: Array.isArray(editing.bars) && editing.bars.length > 0
            ? editing.bars.map((b) => ({ ...b }))
            : [{ ...emptyBar }],
        }
      : { ...emptyChart, bars: [{ ...emptyBar }] }
  );
  const [saving, setSaving] = useState(false);

  const setBars = (bars) => setForm((f) => ({ ...f, bars }));

  const addBar = () => setBars([...form.bars, { ...emptyBar }]);

  const removeBar = (i) =>
    setBars(form.bars.filter((_, idx) => idx !== i));

  const updateBar = (i, key, value) => {
    const updated = form.bars.map((b, idx) =>
      idx === i ? { ...b, [key]: key === "value" ? Number(value) : value } : b
    );
    setBars(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        bars: form.bars,
      };
      if (editing) {
        await api.cms.charts.update(editing.id, payload);
        toast.success("Gráfico atualizado");
      } else {
        await api.cms.charts.create(payload);
        toast.success("Gráfico criado");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {editing ? "Editar Gráfico" : "Novo Gráfico"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Título *</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="label">Descrição</label>
            <textarea
              className="input-field min-h-[80px]"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Barras do gráfico</label>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={addBar}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar barra
              </button>
            </div>

            <div className="space-y-2">
              {form.bars.map((bar, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Rótulo
                      </label>
                      <input
                        className="input-field py-1 text-sm"
                        value={bar.label}
                        onChange={(e) => updateBar(i, "label", e.target.value)}
                        placeholder="Ex: SUS"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Valor (%)
                      </label>
                      <input
                        className="input-field py-1 text-sm"
                        type="number"
                        min={0}
                        max={100}
                        value={bar.value}
                        onChange={(e) => updateBar(i, "value", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Cor
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="h-9 w-12 cursor-pointer rounded border border-gray-200 p-0.5"
                          value={bar.color}
                          onChange={(e) => updateBar(i, "color", e.target.value)}
                        />
                        <span className="text-xs text-gray-400">{bar.color}</span>
                      </div>
                    </div>
                  </div>

                  {form.bars.length > 1 && (
                    <button
                      type="button"
                      className="ml-1 rounded p-1 text-red-400 hover:bg-red-50"
                      onClick={() => removeBar(i)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? "Salvando..."
                : editing
                ? "Salvar"
                : "Criar Gráfico"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function AdminQuemSomosPage() {
  const [blocks, setBlocks] = useState([]);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [blockModal, setBlockModal] = useState(false);
  const [blockEditing, setBlockEditing] = useState(null);
  const [chartModal, setChartModal] = useState(false);
  const [chartEditing, setChartEditing] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.cms.blocks.list().catch(() => []),
      api.cms.charts.list().catch(() => []),
    ])
      .then(([b, c]) => {
        setBlocks(b);
        setCharts(c);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Blocos ──
  const openNewBlock = () => {
    setBlockEditing(null);
    setBlockModal(true);
  };

  const openEditBlock = (block) => {
    setBlockEditing(block);
    setBlockModal(true);
  };

  const deleteBlock = async (id) => {
    if (!confirm("Excluir este bloco de conteúdo?")) return;
    try {
      await api.cms.blocks.delete(id);
      toast.success("Bloco excluído");
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBlocksDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const updated = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(updated);
    try {
      await api.cms.blocks.reorder(updated.map((b) => b.id));
      toast.success("Ordem atualizada");
    } catch {
      toast.error("Erro ao salvar ordem");
      loadData();
    }
  };

  // ── Gráficos ──
  const openNewChart = () => {
    setChartEditing(null);
    setChartModal(true);
  };

  const openEditChart = (chart) => {
    setChartEditing(chart);
    setChartModal(true);
  };

  const deleteChart = async (id) => {
    if (!confirm("Excluir este gráfico?")) return;
    try {
      await api.cms.charts.delete(id);
      toast.success("Gráfico excluído");
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleChartsDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = charts.findIndex((c) => c.id === active.id);
    const newIndex = charts.findIndex((c) => c.id === over.id);
    const updated = arrayMove(charts, oldIndex, newIndex);
    setCharts(updated);
    try {
      await api.cms.charts.reorder(updated.map((c) => c.id));
      toast.success("Ordem atualizada");
    } catch {
      toast.error("Erro ao salvar ordem");
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader
          title="Quem Somos — Editor"
          description="Gerencie blocos de conteúdo e gráficos da página pública"
          icon={ImageIcon}
        />

        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={openNewChart}
            type="button"
          >
            <BarChart2 className="h-4 w-4" /> Novo Gráfico
          </button>

          <button className="btn-primary" onClick={openNewBlock} type="button">
            <Plus className="h-4 w-4" /> Novo Bloco
          </button>
        </div>
      </div>

      <Link
        to="/quem-somos"
        target="_blank"
        className="mb-6 inline-flex items-center gap-2 rounded-md bg-cyan-50 px-4 py-2 text-sm font-semibold text-[#3b5f6b] hover:bg-cyan-100"
      >
        ↗ Ver página pública
      </Link>

      {/* ── Blocos de conteúdo ── */}
      <h2 className="mb-3 text-lg font-bold text-gray-900">
        Blocos de Conteúdo
      </h2>

      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          Nenhum bloco cadastrado.{" "}
          <button
            className="text-brand-600 underline"
            onClick={openNewBlock}
            type="button"
          >
            Criar o primeiro
          </button>
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleBlocksDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  onEdit={openEditBlock}
                  onDelete={deleteBlock}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* ── Gráficos ── */}
      <h2 className="mb-3 mt-10 text-lg font-bold text-gray-900">Gráficos</h2>

      {charts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          Nenhum gráfico cadastrado.{" "}
          <button
            className="text-brand-600 underline"
            onClick={openNewChart}
            type="button"
          >
            Criar o primeiro
          </button>
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleChartsDragEnd}
        >
          <SortableContext
            items={charts.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {charts.map((chart) => (
                <SortableChart
                  key={chart.id}
                  chart={chart}
                  onEdit={openEditChart}
                  onDelete={deleteChart}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* ── Modais ── */}
      {blockModal && (
        <BlockModal
          editing={blockEditing}
          onClose={() => setBlockModal(false)}
          onSaved={loadData}
        />
      )}

      {chartModal && (
        <ChartModal
          editing={chartEditing}
          onClose={() => setChartModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
