import { Outlet, Link, useLocation } from "react-router-dom";
import { Mail, MapPin, Menu, Phone, X, ArrowLeftRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { getSwitchUrl, getSwitchLabel } from "@/lib/env";

const navLinks = [
  { to: "/", label: "Home", exact: true },
  { to: "/quem-somos", label: "Quem Somos" },
  { to: "/missao", label: "Missão & Visão" },
  { to: "/diretoria", label: "Diretoria" },
  { to: "/documentos", label: "Documentos" },
];

function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.512 5.26l-.999 3.648 3.736-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
    </svg>
  );
}

function Header() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const switchUrl = getSwitchUrl();
  const switchLabel = getSwitchLabel();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Logo da empresa" className="h-10 object-contain" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => {
            const active = l.exact ? pathname === l.to : pathname.startsWith(l.to);
            return (
              <Link key={l.to} to={l.to} className={`rounded-md px-3 py-2 text-sm font-medium ${active ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:text-gray-900"}`}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {switchUrl && switchUrl !== "#" ? (
            <a href={switchUrl} rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-teal-600/40 px-3 py-1.5 text-sm font-medium text-teal-700 transition hover:border-teal-600 hover:bg-teal-50 hover:text-teal-800">
              <ArrowLeftRight className="h-4 w-4" />
              {switchLabel}
            </a>
          ) : (
            <span title="URL do Portal não configurada" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-teal-600/20 px-3 py-1.5 text-sm font-medium text-teal-700/40">
              <ArrowLeftRight className="h-4 w-4" />
              {switchLabel}
            </span>
          )}
          <Link to={isAuthenticated ? "/portal" : "/login"} className="btn-primary">
            {isAuthenticated ? "Acessar Portal" : "Entrar"}
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm">
                {l.label}
              </Link>
            ))}
            {switchUrl && switchUrl !== "#" && (
              <a href={switchUrl} rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-700">
                <ArrowLeftRight className="h-4 w-4" />
                {switchLabel}
              </a>
            )}
            <Link to={isAuthenticated ? "/portal" : "/login"} className="btn-primary mt-2 w-full" onClick={() => setOpen(false)}>
              {isAuthenticated ? "Acessar Portal" : "Entrar"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const whatsappHref = "https://wa.me/5500000000000";
  const whatsappLabel = "(00) 00000-0000";

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <img src="/logo.svg" alt="Logo da empresa" className="h-12 object-contain" />
          <p className="mt-4 max-w-md text-sm leading-6 text-gray-600">
            Portal corporativo interno, promovendo comunicação e acesso a sistemas com qualidade e eficiência.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Navegação</h2>
          <div className="mt-4 grid gap-2 text-sm">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-gray-600 transition hover:text-brand-700">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">Contato</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 text-gray-600 transition hover:text-[#25D366]">
              <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]" />
              <span>
                <span className="font-medium group-hover:underline">{whatsappLabel}</span>
                <span className="ml-1 text-gray-500">• Seg-Dom, 9h-21h</span>
              </span>
            </a>
            <div className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span>Departamento de informática</span>
            </div>
            <div className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span>Ramal 4314</span>
            </div>
            <div className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span>contato@exemplo.local</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 py-4">
        <p className="mx-auto max-w-7xl text-xs text-gray-500">Desenvolvido pelo departamento de informática</p>
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
