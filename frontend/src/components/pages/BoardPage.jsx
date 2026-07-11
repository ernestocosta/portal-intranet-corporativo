import { useEffect, useState } from "react";
import { api, uploadUrl } from "@/lib/api";

export default function BoardPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.directory
      .listPublic()
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const imageShapeClass = (shape) => {
    if (shape === "circle") return "rounded-full";
    if (shape === "square") return "rounded-xl";
    return "rounded-md";
  };

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <>
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">Diretoria</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-500">
            Conheça a liderança executiva que conduz nossa instituição.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : members.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">
            Nenhum membro cadastrado.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {members.map((d) => (
              <div key={d.id} className="card flex items-center gap-4 p-5">
                {d.photo ? (
                  <div
                    className={`h-14 w-14 shrink-0 overflow-hidden border border-gray-200 bg-gray-100 ${imageShapeClass(d.shape)}`}
                  >
                    <img
                      src={uploadUrl(d.photo)}
                      alt={d.name}
                      className="h-full w-full object-cover"
                      style={{ transform: `scale(${d.zoom || 1})` }}
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
                    {getInitials(d.name)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900">{d.name}</div>
                  <div className="text-sm text-brand-600">{d.role}</div>
                  {d.area && <div className="text-xs text-gray-400">{d.area}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
