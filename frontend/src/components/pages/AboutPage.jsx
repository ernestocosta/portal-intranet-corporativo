import { useEffect, useState } from "react";
import { Building2, Users, Award } from "lucide-react";
import { api, uploadUrl } from "@/lib/api";

const fallbackCards = [
  { icon: Building2, title: "Nossa História", text: "Empresa fictícia criada para fins de demonstração deste projeto de portfólio, com presença consolidada e atendimento de excelência." },
  { icon: Users, title: "Nossa Equipe", text: "Mais de 3.000 profissionais dedicados à saúde, comprometidos com acolhimento, inovação e integridade no cuidado ao paciente." },
  { icon: Award, title: "Reconhecimentos", text: "Certificações de qualidade que atestam o compromisso com a excelência (conteúdo ilustrativo)." },
];

export default function AboutPage() {
  const [blocks, setBlocks] = useState([]);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.public.blocks().catch(() => []),
      api.public.charts().catch(() => []),
    ])
      .then(([b, c]) => {
        setBlocks(b);
        setCharts(c);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasContent = blocks.length > 0 || charts.length > 0;

  return (
    <>
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">Quem Somos</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-500">
            Uma instituição com mais de 160 anos de história, referência em saúde e inovação.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : hasContent ? (
        <>
          {/* Blocos de conteúdo do CMS */}
          <section className="mx-auto max-w-7xl px-4 py-16">
            <div className="space-y-12">
              {blocks.map((block) => {
                const imgSrc = block.image_path ? uploadUrl(block.image_path) : null;
                const pos = block.image_position || "abaixo";

                return (
                  <div key={block.id} className="card p-8">
                    <h2 className="mb-4 text-2xl font-bold text-[#3b5f6b]">
                      {block.title}
                    </h2>

                    {["acima", "esquerda"].includes(pos) && imgSrc && (
                      <img
                        src={imgSrc}
                        alt={block.title}
                        className={`mb-4 rounded-lg object-cover ${
                          pos === "esquerda"
                            ? "float-left mr-4 h-40 w-56"
                            : "max-h-72 w-full"
                        }`}
                      />
                    )}

                    <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                      {block.text}
                    </p>

                    {["abaixo", "direita"].includes(pos) && imgSrc && (
                      <img
                        src={imgSrc}
                        alt={block.title}
                        className={`mt-4 rounded-lg object-cover ${
                          pos === "direita"
                            ? "float-right ml-4 h-40 w-56"
                            : "max-h-72 w-full"
                        }`}
                      />
                    )}

                    <div className="clear-both" />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Gráficos do CMS */}
          {charts.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 pb-16">
              <div className="space-y-10">
                {charts.map((chart) => {
                  const bars = Array.isArray(chart.bars) ? chart.bars : [];
                  const max = Math.max(...bars.map((b) => Number(b.value) || 0), 1);

                  return (
                    <div key={chart.id} className="card p-8">
                      <h3 className="text-xl font-bold text-[#3b5f6b]">
                        {chart.title}
                      </h3>

                      {chart.description && (
                        <p className="mt-2 text-gray-500">{chart.description}</p>
                      )}

                      <div className="mt-6 flex min-h-56 items-end justify-center gap-8">
                        {bars.map((bar, index) => {
                          const height = Math.max(20, (Number(bar.value) / max) * 150);

                          return (
                            <div key={index} className="text-center">
                              <div className="mb-2 text-xl font-bold">{bar.value}%</div>
                              <div
                                className="flex w-24 items-end justify-center rounded-t-md text-sm font-bold text-white"
                                style={{
                                  height,
                                  backgroundColor: bar.color,
                                }}
                              >
                                {bar.label}
                              </div>
                              <div className="mt-2 font-semibold text-gray-600">
                                {bar.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      ) : (
        /* Fallback estático quando não há conteúdo no CMS */
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {fallbackCards.map((b) => (
              <div key={b.title} className="card p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{b.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{b.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
