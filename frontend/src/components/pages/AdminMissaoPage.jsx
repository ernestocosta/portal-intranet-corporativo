import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Target,
  X,
  Eye,
  Heart,
  Star,
  Shield,
  Award,
  Zap,
  Globe,
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
import { api } from "@/lib/api";

// Ícones disponíveis (mesmo set do banco)
const ICON_OPTIONS = [
  { value: "Target", label: "Alvo (Missão)",    Icon: Target  },
  { value: "Eye",    label: "Olho (Visão)",     Icon: Eye     },
  { value: "Heart",  label: "Coração (Valores)",Icon: Heart   },
  { value: "Star",   label: "Estrela",          Icon: Star    },
  { value: "Shield", label: "Escudo",           Icon: Shield  },
  { value: "Award",  label: "Prêmio",           Icon: Award   },
  { value: "Zap",    label: "Raio",             Icon: Zap     },
  { value: "Globe",  label: "Globo",            Icon: Globe   },
];

const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map((o) => [o.value, o.Icon]));

const emptyForm = { title: "", text: "", icon: "Target", active: true };

// ─── Item arrastável ──────────────────────────────────────────
function SortableItem({ item, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = ICON_MAP[item.icon] ?? Target;

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

      {/* Ícone preview */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-900 truncate">{item.title || "Sem título"}</div>
        <div className="mt-0.5 text-sm text-gray-500 line-clamp-2">{item.text}</div>
        <div className="mt-1 text-xs">
          <span className={item.active ? "text-green-700" : "text-gray-400"}>
            • {item.active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      <button
        className="btn-secondary btn-sm shrink-0"
        onClick={() => onEdit(item)}
        type="button"
      >
        <Edit className="h-4 w-4" /> Editar
      </button>

      <button
        className="btn-secondary btn-sm text-red-600 hover:bg-red-50 shrink-0"
        onClick={() => onDelete(item.id)}
        type="button"
      >
        <Trash2 className="h-4 w-4" /> Excluir
      </button>
    </div>
  );
}

// ─── Modal de edição / criação ────────────────────────────────
function ItemModal({ editing, onClose, onSaved }) {
  const [form, setForm] = useState(
    editing
      ? { title: editing.title, text: editing.text, icon: editing.icon, active: editing.active ?? true }
      : { ...emptyForm }
  );
  const [saving, setSaving] = useState(false);

  const SelectedIcon = ICON_MAP[form.icon] ?? Target;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.cms.mission.update(editing.id, form);
        toast.success("Item atualizado");
      } else {
        await api.cms.mission.create(form);
        toast.success("Item criado");
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
        className="modal-content max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {editing ? "Editar Item" : "Novo Item"}
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
          {/* Título */}
          <div>
            <label className="label">Título *</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={200}
              placeholder="Ex: Missão"
              required
            />
          </div>

          {/* Texto */}
          <div>
            <label className="label">Texto</label>
            <textarea
              className="input-field min-h-[100px]"
              rows={4}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="Descrição do item..."
            />
          </div>

          {/* Ícone */}
          <div>
            <label className="label">Ícone</label>
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, icon: value })}
                  title={label}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-xs transition ${
                    form.icon === value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="leading-tight text-center">{label.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
                <SelectedIcon className="h-5 w-5" />
              </div>
              <span className="text-sm text-gray-600">
                Prévia: <strong>{form.title || "Título"}</strong>
              </span>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <select
              className="input-field"
              value={form.active ? "true" : "false"}
              onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar" : "Criar Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function AdminMissaoPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadData = () => {
    setLoading(true);
    api.cms.mission.list()
      .then(setItems)
      .catch(() => toast.error("Erro ao carregar itens"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setModal(true); };
  const openEdit = (item) => { setEditing(item); setModal(true); };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este item?")) return;
    try {
      await api.cms.mission.delete(id);
      toast.success("Item excluído");
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const updated = arrayMove(items, oldIndex, newIndex);
    setItems(updated);
    try {
      await api.cms.mission.reorder(updated.map((i) => i.id));
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader
          title="Missão & Visão — Editor"
          description="Gerencie os cards exibidos na página pública de Missão & Visão"
          icon={Target}
        />
        <button className="btn-primary" onClick={openNew} type="button">
          <Plus className="h-4 w-4" /> Novo Item
        </button>
      </div>

      <Link
        to="/missao"
        target="_blank"
        className="mb-6 inline-flex items-center gap-2 rounded-md bg-cyan-50 px-4 py-2 text-sm font-semibold text-[#3b5f6b] hover:bg-cyan-100"
      >
        ↗ Ver página pública
      </Link>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          Nenhum item cadastrado.{" "}
          <button className="text-brand-600 underline" onClick={openNew} type="button">
            Criar o primeiro
          </button>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {items.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {modal && (
        <ItemModal
          editing={editing}
          onClose={() => setModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
