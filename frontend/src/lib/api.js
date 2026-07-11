const BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const url = `${BASE_URL}/api${path}`;

  const config = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  if (
    options.body &&
    typeof options.body === "object" &&
    !(options.body instanceof FormData)
  ) {
    config.body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    delete config.headers["Content-Type"];
    config.body = options.body;
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Erro ${response.status}`);
  }

  return response.json();
}

export function uploadUrl(filename) {
  if (!filename) return "";
  return `${BASE_URL}/uploads/${filename}`;
}

export const api = {
  auth: {
    login: (username, password) =>
      request("/auth/login", { method: "POST", body: { username, password } }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () => request("/auth/me"),
  },

  notices: {
    list: () => request("/notices"),
    create: (data) => request("/notices", { method: "POST", body: data }),
    update: (id, data) => request(`/notices/${id}`, { method: "PUT", body: data }),
    delete: (id) => request(`/notices/${id}`, { method: "DELETE" }),
  },

  documents: {
    list: () => request("/documents"),
    listPublic: () => request("/documents/public"),
    upload: (formData) => request("/documents/upload", { method: "POST", body: formData }),
    downloadUrl: (id) => `${BASE_URL}/api/documents/${id}/download`,
    delete: (id) => request(`/documents/${id}`, { method: "DELETE" }),
  },

  directory: {
    listPublic: () => request("/directory/public"),
    list: () => request("/directory"),
    create: (formData) => request("/directory", { method: "POST", body: formData }),
    update: (id, formData) => request(`/directory/${id}`, { method: "PUT", body: formData }),
    delete: (id) => request(`/directory/${id}`, { method: "DELETE" }),
  },

  folders: {
    list: () => request("/folders"),
    listPublic: () => request("/folders/public"),
    create: (data) => request("/folders", { method: "POST", body: data }),
    delete: (id) => request(`/folders/${id}`, { method: "DELETE" }),
  },

  dashboard: {
    stats: () => request("/dashboard/stats"),
  },

  admin: {
    logs: (limit = 50) => request(`/admin/logs?limit=${limit}`),
  },

  public: {
    banners: () => request("/public/banners"),
    shortcuts: () => request("/public/shortcuts"),
    blocks: () => request("/public/blocks"),
    charts: () => request("/public/charts"),
    indicators: () => request("/public/indicators"),
    mission: () => request("/public/mission"),   // ← NOVO
  },

  cms: {
    indicators: {
      list: () => request("/cms/indicators"),
      create: (data) => request("/cms/indicators", { method: "POST", body: data }),
      update: (id, data) => request(`/cms/indicators/${id}`, { method: "PUT", body: data }),
      reorder: (items) => request("/cms/indicators/reorder", { method: "PUT", body: { items } }),
      delete: (id) => request(`/cms/indicators/${id}`, { method: "DELETE" }),
    },

    banners: {
      list: () => request("/cms/banners"),
      create: (formData) => request("/cms/banners", { method: "POST", body: formData }),
      update: (id, formData) => request(`/cms/banners/${id}`, { method: "PUT", body: formData }),
      delete: (id) => request(`/cms/banners/${id}`, { method: "DELETE" }),
    },

    shortcuts: {
      list: () => request("/cms/shortcuts"),
      create: (data) => request("/cms/shortcuts", { method: "POST", body: data }),
      update: (id, data) => request(`/cms/shortcuts/${id}`, { method: "PUT", body: data }),
      reorder: (items) => request("/cms/shortcuts/reorder", { method: "PUT", body: { items } }),
      delete: (id) => request(`/cms/shortcuts/${id}`, { method: "DELETE" }),
    },

    blocks: {
      list: () => request("/cms/blocks"),
      create: (formData) => request("/cms/blocks", { method: "POST", body: formData }),
      update: (id, formData) => request(`/cms/blocks/${id}`, { method: "PUT", body: formData }),
      reorder: (items) => request("/cms/blocks/reorder", { method: "PUT", body: { items } }),  // ← CORRIGIDO
      delete: (id) => request(`/cms/blocks/${id}`, { method: "DELETE" }),
    },

    charts: {
      list: () => request("/cms/charts"),
      create: (data) => request("/cms/charts", { method: "POST", body: data }),
      update: (id, data) => request(`/cms/charts/${id}`, { method: "PUT", body: data }),
      reorder: (items) => request("/cms/charts/reorder", { method: "PUT", body: { items } }),  // ← CORRIGIDO
      delete: (id) => request(`/cms/charts/${id}`, { method: "DELETE" }),
    },

    mission: {
      list: () => request("/cms/mission"),
      create: (data) => request("/cms/mission", { method: "POST", body: data }),
      update: (id, data) => request(`/cms/mission/${id}`, { method: "PUT", body: data }),
      reorder: (items) => request("/cms/mission/reorder", { method: "PUT", body: { items } }),
      delete: (id) => request(`/cms/mission/${id}`, { method: "DELETE" }),
    },
  },
};
