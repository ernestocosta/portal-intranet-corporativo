import { useEffect, useState } from "react";
import { Image, Plus, Edit, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { api, uploadUrl } from "@/lib/api";

export default function BannerPage() {
  const [banners, setBanners] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Texto",
    active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const loadBanners = () => {
    api.cms.banners
      .list()
      .then(setBanners)
      .catch(() => toast.error("Erro ao carregar banners"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", description: "", type: "Texto", active: true });
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  const openEdit = (banner) => {
    setEditing(banner);
    setForm({
      title: banner.title || "",
      description: banner.description || "",
      type: banner.type || "Texto",
      active: banner.active ?? true,
    });
    setImageFile(null);
    setImagePreview(banner.image_path ? uploadUrl(banner.image_path) : "");
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("type", form.type);
    formData.append("active", String(form.active));
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      if (editing) {
        await api.cms.banners.update(editing.id, formData);
        toast.success("Banner atualizado");
      } else {
        await api.cms.banners.create(formData);
        toast.success("Banner criado");
      }

      setModalOpen(false);
      loadBanners();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Excluir este banner?")) return;

    try {
      await api.cms.banners.delete(id);
      toast.success("Banner excluído");
      loadBanners();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, type: "Imagem" }));
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
      <PageHeader
        title="Gerenciar Banner"
        description="Controle os banners exibidos na página inicial"
        icon={Image}
        action={
          <button className="btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo Banner
          </button>
        }
      />

      <div className="space-y-4">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="h-24 w-40 overflow-hidden rounded-lg bg-gray-100">
              {banner.image_path ? (
                <img
                  src={uploadUrl(banner.image_path)}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                  Sem imagem
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="font-bold text-gray-900">
                {banner.title || "(Sem título)"}
              </div>

              <div className="text-sm text-gray-500">
                {banner.description || "Sem descrição"}
              </div>

              <div className="mt-1 text-xs">
                <span className="rounded-full bg-cyan-50 px-2 py-1 font-semibold text-[#3b5f6b]">
                  {banner.type}
                </span>

                <span className="ml-2 text-green-700">
                  • {banner.active ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>

            <button className="btn-secondary btn-sm" onClick={() => openEdit(banner)}>
              <Edit className="h-4 w-4" /> Editar
            </button>

            <button
              className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
              onClick={() => remove(banner.id)}
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="modal-content max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editing ? "Editar Banner" : "Novo Banner"}
              </h2>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={save} className="space-y-4">
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

              <div>
                <label className="label">Tipo</label>
                <select
                  className="input-field"
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                >
                  <option value="Texto">Texto</option>
                  <option value="Imagem">Imagem</option>
                </select>
              </div>

              <div>
                <label className="label">Título</label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Ex: Bem-vindo à Nossa Intranet"
                />
              </div>

              <div>
                <label className="label">Descrição</label>
                <textarea
                  className="input-field min-h-24"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Texto do banner"
                />
              </div>

              <div>
                <label className="label">Imagem</label>
                <input
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
                      className="max-h-72 w-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
