import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Monitor } from "lucide-react";
import { api, uploadUrl } from "@/lib/api";

const FALLBACK_SLIDES = [
  {
    title: "Portal corporativo integrado para toda a equipe.",
    description:
      "Acesso rápido aos principais sistemas, documentos institucionais, indicadores e comunicados internos.",
    active: true,
  },
];

const FALLBACK_SHORTCUTS = [
  {
    title: "Laboratório Ruth Brazão",
    description: "Exames e resultados",
    icon_path: "",
    icon: "",
    url: "https://exemplo.com/laboratorio",
    active: true,
  },
];

function ShortcutIcon({ item }) {
  if (item.icon_path) {
    return (
      <img
        src={uploadUrl(item.icon_path)}
        alt={item.title}
        className="h-10 w-10 rounded-lg object-contain"
      />
    );
  }

  return <Monitor className="h-5 w-5 text-[#026873]" />;
}

function QuickCard({ item }) {
  const description = item.description || item.desc || "";

  const content = (
    <>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
        <ShortcutIcon item={item} />
      </div>

      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900">{item.title}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>

      <ArrowRight className="h-4 w-4 text-gray-400" />
    </>
  );

  const className =
    "flex items-center gap-3 rounded-xl border bg-white px-4 py-4 shadow-sm transition hover:shadow-md";

  if (item.to) {
    return (
      <Link to={item.to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={item.url || "#"}
      target={item.url && item.url !== "#" ? "_blank" : "_self"}
      rel="noreferrer"
      className={className}
    >
      {content}
    </a>
  );
}

// Skeleton de carregamento (mesma altura/forma do conteúdo real)
function HomePageSkeleton() {
  return (
    <>
      <section className="bg-gray-100 px-4 pb-8 pt-6">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-xl bg-white shadow">
          <div className="h-[clamp(300px,28vw,430px)] w-full animate-pulse bg-gradient-to-r from-gray-100 to-gray-200" />
          <div className="flex justify-center gap-2 bg-white py-3">
            <div className="h-3 w-7 rounded-full bg-gray-200" />
            <div className="h-3 w-3 rounded-full bg-gray-200" />
            <div className="h-3 w-3 rounded-full bg-gray-200" />
          </div>
        </div>
      </section>

      <section className="bg-gray-100 px-4 pb-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Acesso Rápido</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-xl border bg-white px-4 py-4 shadow-sm"
              >
                <div className="h-12 w-12 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-gray-200" />
                  <div className="h-2 w-1/2 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default function HomePage() {
  const [active, setActive] = useState(0);
  const [slides, setSlides] = useState(null);
  const [shortcuts, setShortcuts] = useState(null);

  useEffect(() => {
    // Carrega ambos em paralelo e só revela a UI quando os dois chegarem
    Promise.allSettled([
      api.public.banners(),
      api.public.shortcuts(),
    ]).then(([bannersRes, shortcutsRes]) => {
      const banners =
        bannersRes.status === "fulfilled" && bannersRes.value.length > 0
          ? bannersRes.value
          : FALLBACK_SLIDES;

      const sc =
        shortcutsRes.status === "fulfilled" && shortcutsRes.value.length > 0
          ? shortcutsRes.value
          : FALLBACK_SHORTCUTS;

      setSlides(banners);
      setShortcuts(sc);
    });
  }, []);

  const currentSlide = useMemo(
    () => (slides && slides.length > 0 ? slides[active] || slides[0] : null),
    [slides, active]
  );

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const timer = setInterval(
      () => setActive((i) => (i + 1) % slides.length),
      5000
    );
    return () => clearInterval(timer);
  }, [slides]);

  // Enquanto não chegou tudo, mostra skeleton (sem flash de conteúdo "errado")
  if (slides === null || shortcuts === null) {
    return <HomePageSkeleton />;
  }

  return (
    <>
      <section className="bg-gray-100 px-4 pb-8 pt-6">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-xl bg-white shadow">
          {currentSlide?.image_path ? (
            <div className="flex h-[clamp(300px,28vw,430px)] w-full items-center justify-center overflow-hidden bg-white">
              <img
                src={uploadUrl(currentSlide.image_path)}
                alt={currentSlide.title}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#3AA637] to-[#026873] p-10 text-white">
              <h1 className="max-w-4xl text-4xl font-bold">{currentSlide?.title}</h1>
              <p className="mt-4 max-w-3xl text-lg">{currentSlide?.description}</p>
              <div className="mt-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#026873]"
                >
                  Entrar <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {slides.length > 1 && (
            <div className="flex justify-center gap-2 bg-white py-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActive(index)}
                  className={`h-3 rounded-full transition-all ${
                    active === index ? "w-7 bg-[#026873]" : "w-3 bg-gray-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-gray-100 px-4 pb-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Acesso Rápido</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shortcuts.map((item) => (
              <QuickCard key={item.id || item.title} item={item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
