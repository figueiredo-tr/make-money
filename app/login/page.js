"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Card from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="eyebrow mb-2">Acesso restrito</p>
          <h1 className="font-display italic text-3xl text-ink">Libretto</h1>
          <p className="text-sm text-faint mt-2">
            Não há cadastro público. Contas criadas manualmente.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="senha">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                autoComplete="current-password"
                className="input"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {erro && (
              <p className="text-sm text-wine bg-wine/10 border border-wine/30 rounded-sm px-3 py-2">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="btn btn-primary w-full mt-2"
            >
              {carregando ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}
