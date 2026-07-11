import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate("/portal", { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(username, password);
      toast.success("Bem-vindo!");
      navigate("/portal");
    } catch {
      toast.error("Usuário ou senha inválidos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      
      {/* CARD CENTRAL */}
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl shadow-lg">

        {/* LADO ESQUERDO (VERDE/AZUL) */}
        <div className="hidden w-1/2 flex-col items-center justify-center bg-gradient-to-br from-[#2f4858] to-[#3a7d5c] p-8 text-white md:flex">
          
          <div className="mb-6 text-4xl font-bold">PD</div>

          <h2 className="text-center text-xl font-semibold">
            Portal Demo
          </h2>

          <div className="my-4 h-1 w-10 bg-white/40 rounded" />

          <p className="text-center text-sm text-white/80">
            Portal interno de acesso a sistemas,
            documentos e comunicados do hospital.
          </p>
        </div>

        {/* LADO DIREITO (LOGIN) */}
        <div className="w-full bg-white p-8 md:w-1/2">
          
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo de volta
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Use suas credenciais de rede para entrar
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            
            <div>
              <label className="text-sm text-gray-600">
                Usuário de rede
              </label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="ex: joao.silva"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Senha
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Senha de rede"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#3e6573] py-2 text-white transition hover:opacity-90"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Problemas de acesso? Contate a TI — Ramal 4314
          </p>

        </div>
      </div>
    </div>
  );
}