"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { calcularParcela } from "@/lib/calculos";
import { gerarParcelas } from "@/lib/parcelas";
import Card from "@/components/ui/Card";
import ClienteCombobox from "@/components/ui/ClienteCombobox";

function formatBRL(value) {
  return (value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function hojeISO() {
  return new Date().toISOString().split("T")[0];
}

export default function NovoEmprestimoPage() {
  const router = useRouter();

  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");

  const [valorPrincipal, setValorPrincipal] = useState("");
  const [taxaJuros, setTaxaJuros] = useState("");
  const [tipoJuros, setTipoJuros] = useState("fixo");
  const [periodicidade, setPeriodicidade] = useState("mensal");
  const [jurosDia, setJurosDia] = useState("");
  const [numeroParcelas, setNumeroParcelas] = useState("");
  const [dataPrimeiroVencimento, setDataPrimeiroVencimento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function carregarClientes() {
      const { data } = await supabase
        .from("clientes")
        .select("id, nome, telefone")
        .eq("ativo", true)
        .order("nome");
      setClientes(data || []);
    }
    carregarClientes();
  }, []);

  const preview = useMemo(() => {
    const p = parseFloat(valorPrincipal);
    const t = parseFloat(taxaJuros);
    const n = parseInt(numeroParcelas, 10);

    if (!p || !t || !n || p <= 0 || n <= 0) return null;

    return calcularParcela(p, t, n, tipoJuros);
  }, [valorPrincipal, taxaJuros, numeroParcelas, tipoJuros]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (!clienteId) {
      setErro("Selecione um associado.");
      return;
    }

    setSalvando(true);

    const payload = {
      cliente_id: clienteId,
      valor_principal: parseFloat(valorPrincipal),
      taxa_juros: parseFloat(taxaJuros),
      tipo_juros: tipoJuros,
      periodicidade,
      juros_dia: parseFloat(jurosDia) || 0,
      numero_parcelas: parseInt(numeroParcelas, 10),
      data_primeiro_vencimento: dataPrimeiroVencimento,
      observacoes: observacoes.trim() || null,
    };

    const { data: emprestimo, error: erroInsert } = await supabase
      .from("emprestimos")
      .insert(payload)
      .select()
      .single();

    if (erroInsert) {
      setErro(erroInsert.message);
      setSalvando(false);
      return;
    }

    try {
      await gerarParcelas(emprestimo);
    } catch (erroParcelas) {
      setErro(
        `Empréstimo criado, mas houve erro ao gerar as parcelas: ${erroParcelas.message}. Avise a Conta A/C.`,
      );
      setSalvando(false);
      return;
    }

    setSalvando(false);
    router.push(`/clientes?emprestimo=${emprestimo.id}`);
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <header className="mb-8">
        <p className="eyebrow mb-1">Novo lançamento</p>
        <h1 className="font-display italic text-3xl text-ink">
          Registrar empréstimo
        </h1>
      </header>

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label" htmlFor="cliente-combobox">
              Associado *
            </label>
            <ClienteCombobox
              clientes={clientes}
              value={clienteId}
              onChange={setClienteId}
            />
            {clientes.length === 0 && (
              <p className="text-xs text-faint mt-2">
                Nenhum associado ativo cadastrado ainda. Cadastre um associado
                primeiro.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="valor">
                Valor emprestado (R$) *
              </label>
              <input
                id="valor"
                type="number"
                min="0.01"
                step="0.01"
                required
                className="input font-mono"
                value={valorPrincipal}
                onChange={(e) => setValorPrincipal(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="taxa">
                Taxa de juros (%) —{" "}
                {tipoJuros === "fixo" ? "total sobre o valor" : "ao mês"} *
              </label>
              <input
                id="taxa"
                type="number"
                min="0"
                step="0.01"
                required
                className="input font-mono"
                value={taxaJuros}
                onChange={(e) => setTaxaJuros(e.target.value)}
                placeholder={tipoJuros === "fixo" ? "30" : "5"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="tipo-juros">
                Tipo de juros *
              </label>
              <select
                id="tipo-juros"
                className="input"
                value={tipoJuros}
                onChange={(e) => setTipoJuros(e.target.value)}
              >
                <option value="fixo">Fixo (sobre o valor)</option>
                <option value="simples">Simples (ao mês)</option>
                <option value="composto">Composto (ao mês)</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="periodicidade">
                Periodicidade das parcelas *
              </label>
              <select
                id="periodicidade"
                className="input"
                value={periodicidade}
                onChange={(e) => setPeriodicidade(e.target.value)}
              >
                <option value="mensal">Mensal</option>
                <option value="semanal">Semanal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="juros-dia">
              Juros ao dia por atraso (%)
            </label>
            <input
              id="juros-dia"
              type="number"
              min="0"
              step="0.01"
              className="input font-mono max-w-[10rem]"
              value={jurosDia}
              onChange={(e) => setJurosDia(e.target.value)}
              placeholder="0,33"
            />
            <p className="text-xs text-faint mt-1.5">
              Aplicado sobre o valor restante da parcela, multiplicado pelos dias de atraso.
            </p>
          </div>

          <div>
            <label className="field-label" htmlFor="parcelas">
              Nº de parcelas *
            </label>
            <input
              id="parcelas"
              type="number"
              min="1"
              step="1"
              required
              className="input font-mono max-w-[10rem]"
              value={numeroParcelas}
              onChange={(e) => setNumeroParcelas(e.target.value)}
              placeholder="12"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="vencimento">
              Data do 1º vencimento *
            </label>
            <input
              id="vencimento"
              type="date"
              required
              min={hojeISO()}
              className="input font-mono"
              value={dataPrimeiroVencimento}
              onChange={(e) => setDataPrimeiroVencimento(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="observacoes">
              Observações
            </label>
            <textarea
              id="observacoes"
              className="input min-h-[70px] resize-y"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="opcional"
            />
          </div>

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
              {salvando ? "Registrando…" : "Registrar empréstimo"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => router.push("/clientes")}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Card>

      {preview && (
        <Card>
          <p className="eyebrow mb-4">Prévia do cálculo</p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-muted mb-1">Valor da parcela</p>
              <p className="font-mono text-lg text-gold">
                {formatBRL(preview.valorParcela)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Total de juros</p>
              <p className="font-mono text-lg text-ink">
                {formatBRL(preview.totalJuros)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Montante total</p>
              <p className="font-mono text-lg text-ink">
                {formatBRL(preview.montanteTotal)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
