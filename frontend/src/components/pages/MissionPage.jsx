import { useEffect, useState } from "react";
import { Target, Eye, Heart, Star, Shield, Award, Zap, Globe } from "lucide-react";
import { api } from "@/lib/api";

// Mapa de ícones disponíveis (deve coincidir com o CHECK do banco)
const ICON_MAP = {
  Target,
  Eye,
  Heart,
  Star,
  Shield,
  Award,
  Zap,
  Globe,
};

// Fallback enquanto não há dados no banco
const FALLBACK = [
  { id: "f1", icon: "Target", title: "Missão",  text: "Promover saúde com excelência, humanização e responsabilidade social, oferecendo assistência de qualidade a todos os pacientes." },
  { id: "f2", icon: "Eye",    title: "Visão",   text: "Ser referência nacional em assistência hospitalar, inovação médica e gestão sustentável até 2030." },
  { id: "f3", icon: "Heart",  title: "Valores", text: "Humanização, ética, transparência, inovação, qualidade, responsabilidade social e respeito à vida." },
];

export default function MissionPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.public.mission()
      .then((data) => setItems(data.length > 0 ? data : FALLBACK))
      .catch(() => setItems(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <h1 className="text-4xl font-bold md:text-5xl">Missão & Visão</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            O que nos move e para onde vamos.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {items.map((item) => {
              const Icon = ICON_MAP[item.icon] ?? Target;
              return (
                <div key={item.id} className="card p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-3 text-gray-500">{item.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
