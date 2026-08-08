"use client";

import { useEffect, useState } from "react";
import {
  listarAnotacoes,
  criarAnotacao,
  excluirAnotacao,
} from "@/lib/anotacoes";
import Card from "./Card";

function formatDataHora(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnotacoesAssociado({
  clienteId,
  somenteLeitura = false,
}) {
  const [anotacoes, setAnotacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  async function carregar() {
    setCarregando(true);
    try {
      const data = await listarAnotacoes(clienteId);
      setAnotacoes(data);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (clienteId) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  async function handleAdicionar() {
    if (!texto.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      await criarAnotacao(clienteId, texto.trim());
      setTexto("");
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(id) {
    try {
      await excluirAnotacao(id);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <Card>
      <h2 className="text-sm text-gold-dim uppercase tracking-widest mb-4">
        Anotações
      </h2>

      {!somenteLeitura && (
        <div className="mb-5">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva uma anotação sobre esse associado…"
            rows={3}
            className="w-full bg-transparent border border-line rounded-sm px-3 py-2 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-gold-dim resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAdicionar}
              disabled={salvando || !texto.trim()}
              className="btn btn-primary !py-1.5 !px-4 !text-xs"
            >
              {salvando ? "Salvando…" : "Adicionar anotação"}
            </button>
          </div>
        </div>
      )}

      {erro && <p className="text-xs text-wine mb-3">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-faint">Carregando…</p>
      ) : anotacoes.length === 0 ? (
        <p className="text-sm text-faint">Nenhuma anotação registrada ainda.</p>
      ) : (
        <div className="space-y-3">
          {anotacoes.map((a) => (
            <div
              key={a.id}
              className="border-b border-line-soft pb-3 last:border-0 last:pb-0"
            >
              <p className="text-sm text-ink whitespace-pre-wrap">{a.texto}</p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-faint">
                  {formatDataHora(a.created_at)}
                </p>
                {!somenteLeitura && (
                  <button
                    onClick={() => handleExcluir(a.id)}
                    className="text-xs text-faint hover:text-wine transition-colors"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
