"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Card from "@/components/ui/Card";

const VAZIO = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  endereco: "",
  observacoes: "",
  ativo: true,
};

export default function EditarClientePage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setErro(error.message);
      } else {
        setForm({
          nome: data.nome || "",
          cpf: data.cpf || "",
          telefone: data.telefone || "",
          email: data.email || "",
          endereco: data.endereco || "",
          observacoes: data.observacoes || "",
          ativo: data.ativo,
        });
      }
      setCarregando(false);
    }
    if (id) carregar();
  }, [id]);

  function handleChange(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const payload = {
      nome: form.nome.trim(),
      cpf: form.cpf.trim() || null,
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      endereco: form.endereco.trim() || null,
      observacoes: form.observacoes.trim() || null,
      ativo: form.ativo,
    };

    const { error } = await supabase
      .from("clientes")
      .update(payload)
      .eq("id", id);

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    router.push(`/clientes/${id}`);
  }

  if (carregando) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm text-faint">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <header className="mb-8">
        <p className="eyebrow mb-1">Editar registro</p>
        <h1 className="font-display italic text-3xl text-ink">
          Editar associado
        </h1>
      </header>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label" htmlFor="nome">
              Nome completo *
            </label>
            <input
              id="nome"
              required
              className="input"
              value={form.nome}
              onChange={handleChange("nome")}
              placeholder="Nome do associado"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="cpf">
                CPF
              </label>
              <input
                id="cpf"
                className="input font-mono"
                value={form.cpf}
                onChange={handleChange("cpf")}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="telefone">
                Telefone
              </label>
              <input
                id="telefone"
                className="input font-mono"
                value={form.telefone}
                onChange={handleChange("telefone")}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="opcional"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="endereco">
              Endereço
            </label>
            <input
              id="endereco"
              className="input"
              value={form.endereco}
              onChange={handleChange("endereco")}
              placeholder="opcional"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="observacoes">
              Observações
            </label>
            <textarea
              id="observacoes"
              className="input min-h-[80px] resize-y"
              value={form.observacoes}
              onChange={handleChange("observacoes")}
              placeholder="opcional"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) =>
                setForm((f) => ({ ...f, ativo: e.target.checked }))
              }
            />
            Associado ativo
          </label>

          {erro && (
            <p className="text-sm text-wine bg-wine/10 border border-wine/30 rounded-sm px-3 py-2">
              {erro}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={salvando}
              className="btn btn-primary"
            >
              {salvando ? "Salvando…" : "Salvar alterações"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => router.push(`/clientes/${id}`)}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
