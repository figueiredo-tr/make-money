"use client";

import { useEffect, useState } from "react";
import {
  getPerfilAtual,
  atualizarMeuNome,
  contarMeusAssociados,
} from "@/lib/perfil";
import Card from "@/components/ui/Card";

export default function PerfilPage() {
  const [perfil, setPerfil] = useState(null);
  const [totalAssociados, setTotalAssociados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [editando, setEditando] = useState(false);
  const [nomeInput, setNomeInput] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  async function carregar() {
    setCarregando(true);
    const p = await getPerfilAtual();
    setPerfil(p);
    setNomeInput(p?.nome || "");

    if (p?.role === "contratante") {
      const total = await contarMeusAssociados();
      setTotalAssociados(total);
    }
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSalvar() {
    setErro(null);
    setSalvando(true);
    try {
      await atualizarMeuNome(nomeInput.trim());
      await carregar();
      setEditando(false);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="eyebrow">Carregando…</p>
      </main>
    );
  }

  if (!perfil) {
    return (
      <div className="px-8 py-8">
        <p className="text-faint">Não foi possível carregar seu perfil.</p>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-8 max-w-2xl">
      <header className="mb-8">
        <p className="eyebrow mb-1">Meu Perfil</p>
        <h1 className="font-display italic text-3xl text-ink">
          {perfil.nomeExibicao}
        </h1>
      </header>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <p className="eyebrow">Nome</p>
          {!editando && (
            <button
              onClick={() => setEditando(true)}
              className="text-xs text-gold hover:text-gold-dim transition-colors"
            >
              Editar
            </button>
          )}
        </div>

        {editando ? (
          <div className="space-y-3">
            <input
              type="text"
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
              placeholder="Seu nome"
              className="w-full bg-transparent border border-line rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold-dim"
              autoFocus
            />
            {erro && <p className="text-xs text-red-400">{erro}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="btn btn-primary !py-1.5 !px-4 !text-xs"
              >
                {salvando ? "Salvando…" : "Salvar"}
              </button>
              <button
                onClick={() => {
                  setEditando(false);
                  setNomeInput(perfil.nome || "");
                  setErro(null);
                }}
                className="btn btn-ghost !py-1.5 !px-4 !text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-ink text-lg">{perfil.nomeExibicao}</p>
        )}

        <div className="mt-6 pt-6 border-t border-line-soft">
          <p className="eyebrow mb-2">E-mail</p>
          <p className="text-muted text-sm">{perfil.email}</p>
        </div>

        <div className="mt-6 pt-6 border-t border-line-soft">
          <p className="eyebrow mb-2">Tipo de acesso</p>
          <p className="text-muted text-sm capitalize">
            {perfil.role === "admin" ? "Administrador" : "Contratante"}
          </p>
        </div>

        {perfil.role === "contratante" && (
          <div className="mt-6 pt-6 border-t border-line-soft">
            <p className="eyebrow mb-2">Associados cadastrados</p>
            <p className="font-mono text-2xl text-gold">
              {totalAssociados ?? "—"}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
