import { useState, useEffect } from "react";
import { Users, X, Trash2, Edit, Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api, uploadUrl } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";

export default function DirectoryPage() {
  const { user } = useAuth();
  const canEdit = ["admin", "rh", "qualidade"].includes(user?.role);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    role: "",
    area: "",
    photoFile: null,
    photoPreview: "",
    active: true,
    shape: "circle",
    zoom: 1,
  });

  const loadMembers = () => {
    setLoading(true);
    api.directory
      .list()
      .then(setMembers)
      .catch(() => toast.error("Erro ao carregar diretoria"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const openNewMember = () => {
    setEditingMember(null);
    setForm({ name: "", role: "", area: "", photoFile: null, photoPreview: "", active: true, shape: "circle", zoom: 1 });
    setMemberModalOpen(true);
  };

  const openEditMember = (member) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      role: member.role,
      area: member.area || "",
      photoFile: null,
      photoPreview: member.photo ? uploadUrl(member.photo) : "",
      active: member.active,
      shape: member.shape || "circle",
      zoom: member.zoom || 1,
    });
    setMemberModalOpen(true);
  };

  const saveMember = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      toast.error("Preencha nome e cargo");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("role", form.role.trim());
      fd.append("area", form.area.trim());
      fd.append("active", String(form.active));
      fd.append("shape", form.shape);
      fd.append("zoom", String(form.zoom));
      if (form.photoFile) fd.append("photo", form.photoFile);

      if (editingMember) {
        await api.directory.update(editingMember.id, fd);
        toast.success("Membro atualizado");
      } else {
        await api.directory.create(fd);
        toast.success("Membro criado");
      }

      setMemberModalOpen(false);
      loadMembers();
    } catch (err) {
      toast.error(err.message || "Erro ao salvar membro");
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (id) => {
    if (!confirm("Excluir este membro da diretoria?")) return;
    try {
      await api.directory.delete(id);
      toast.success("Membro excluído");
      loadMembers();
    } catch (err) {
      toast.error(err.message || "Erro ao excluir");
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, photoFile: file, photoPreview: url }));
    setCropModalOpen(true);
  };

  const imageShapeClass = (shape) => {
    if (shape === "circle") return "rounded-full";
    if (shape === "square") return "rounded-xl";
    return "rounded-md";
  };

  const imageSizeClass = (shape) =>
    shape === "rectangle" ? "h-28 w-44" : "h-28 w-28";

  const cardPhotoSizeClass = (shape) =>
    shape === "rectangle" ? "h-24 w-36" : "h-24 w-24";

  return (
    <div>
      <PageHeader
        title={canEdit ? "Diretoria — Editor" : "Diretoria Interna"}
        description={canEdit ? "Gerencie os membros da diretoria" : "Contatos diretos da liderança executiva"}
        icon={Users}
        action={
          canEdit && (
            <button className="btn-primary" onClick={openNewMember}>
              <Plus className="h-4 w-4" /> Novo Membro
            </button>
          )
        }
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : members.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          Nenhum membro cadastrado.{" "}
          {canEdit && (
            <button className="text-brand-600 underline" onClick={openNewMember}>
              Adicionar primeiro membro
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="relative rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm"
            >
              {canEdit && (
                <GripVertical className="absolute right-5 top-5 h-5 w-5 text-gray-300" />
              )}

              <div className="mb-5 flex justify-center">
                {member.photo ? (
                  <div
                    className={`${cardPhotoSizeClass(member.shape)} overflow-hidden border border-gray-200 bg-gray-100 ${imageShapeClass(member.shape)}`}
                  >
                    <img
                      src={uploadUrl(member.photo)}
                      alt={member.name}
                      className="h-full w-full object-cover"
                      style={{ transform: `scale(${member.zoom || 1})` }}
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-500 text-xl font-bold text-white">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{member.role}</p>
              {member.area && (
                <p className="mt-1 text-xs text-gray-400">{member.area}</p>
              )}

              <div className="mt-3 text-xs text-green-700">
                • {member.active ? "Ativo" : "Inativo"}
              </div>

              {canEdit && (
                <div className="mt-5 flex justify-center gap-2">
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => openEditMember(member)}
                  >
                    <Edit className="h-4 w-4" /> Editar
                  </button>
                  <button
                    className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                    onClick={() => deleteMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modal criar/editar ── */}
      {memberModalOpen && (
        <div className="modal-overlay" onClick={() => setMemberModalOpen(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingMember ? "Editar Membro" : "Novo Membro"}
              </h3>
              <button
                onClick={() => setMemberModalOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveMember} className="space-y-5">
              {/* Foto */}
              <div className="flex flex-col items-center">
                <div
                  className={`${imageSizeClass(form.shape)} overflow-hidden border border-gray-200 bg-gray-100 ${imageShapeClass(form.shape)}`}
                >
                  {form.photoPreview ? (
                    <img
                      src={form.photoPreview}
                      alt="foto"
                      className="h-full w-full object-cover"
                      style={{ transform: `scale(${form.zoom || 1})` }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                      Sem foto
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <label className="btn-secondary cursor-pointer">
                    Escolher foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                  </label>
                  {form.photoPreview && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, photoFile: null, photoPreview: "", zoom: 1, shape: "circle" }))
                      }
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Nome completo *</label>
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label">Cargo / Função *</label>
                <input
                  className="input-field"
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label">Área / Departamento</label>
                <input
                  className="input-field"
                  value={form.area}
                  onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
                  placeholder="Ex: Diretoria Assistencial"
                />
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  className="input-field"
                  value={form.active ? "true" : "false"}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, active: e.target.value === "true" }))
                  }
                >
                  <option value="true">✅ Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setMemberModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal ajuste de foto ── */}
      {cropModalOpen && (
        <div className="modal-overlay z-[80]">
          <div className="rounded-2xl bg-[#1f1f1f] p-8 text-white shadow-2xl">
            <h3 className="mb-5 text-center text-xl font-bold">Ajustar foto</h3>

            <div className="mb-5 flex justify-center gap-3">
              {["circle", "square", "rectangle"].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`rounded-lg border px-4 py-2 ${
                    form.shape === s ? "border-[#3b5f6b] bg-[#3b5f6b]" : "border-gray-500"
                  }`}
                  onClick={() => setForm((prev) => ({ ...prev, shape: s }))}
                >
                  {s === "circle" ? "● Círculo" : s === "square" ? "■ Quadrado" : "▬ Retângulo"}
                </button>
              ))}
            </div>

            <div
              className={`mx-auto overflow-hidden border-2 border-cyan-200 bg-white ${imageShapeClass(form.shape)} ${imageSizeClass(form.shape)}`}
            >
              {form.photoPreview && (
                <img
                  src={form.photoPreview}
                  alt="ajuste"
                  className="h-full w-full object-cover"
                  style={{ transform: `scale(${form.zoom})` }}
                />
              )}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <span>A-</span>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                value={form.zoom}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, zoom: Number(e.target.value) }))
                }
                className="w-72"
              />
              <span>A+</span>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                type="button"
                className="rounded-lg bg-gray-600 px-10 py-3 font-bold text-white"
                onClick={() => setCropModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#3b5f6b] px-10 py-3 font-bold text-white"
                onClick={() => setCropModalOpen(false)}
              >
                ✓ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
