import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

export default function PublicIndicatorsPage() {
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.public
      .indicators()
      .then((data) => setIndicators(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    return indicators.reduce((acc, item) => {
      if (!acc[item.sector]) acc[item.sector] = [];
      acc[item.sector].push(item);
      return acc;
    }, {});
  }, [indicators]);

  if (loading) {
    return <div className="py-20 text-center">Carregando indicadores...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid grid-cols-1 gap-x-12 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(grouped).map(([sector, items]) => (
          <div key={sector} className="text-center">
            <h2 className="mb-6 text-2xl font-black uppercase text-black">
              {sector}
            </h2>

            <div className="space-y-4">
              {items.map((indicator) => (
                <a
                  key={indicator.id}
                  href={indicator.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md bg-[#345d7c] px-5 py-4 text-lg font-bold text-white shadow hover:bg-[#2d526d]"
                >
                  {indicator.title}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
