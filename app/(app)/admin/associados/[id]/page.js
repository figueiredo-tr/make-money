"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getPerfilAtual } from "@/lib/perfil";
import Card from "@/components/ui/Card";
import Seal from "@/components/ui/Seal";
import AnotacoesAssociado from "@/components/ui/AnotacoesAssociado";

function formatBRL(value) {
  return (value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatData(dataISO) {
  if (!dataISO) return "—";
  return new Date(dataISO + "T00:00:00").toLocaleDateString("pt-BR");
}

const TIPO_JUROS_LABEL = {
  fixo: "Fixo sobre o valor",
  simples: "Simples a.m.",
  composto: "Composto a.m.",
};
const PERIODICIDADE_LABEL = { mensal: "Mensal", semanal: "Semanal" };

export default function AdminAssociadoDetalhePage() {
  const { id } = useParams(); // aqui id = cliente_id
  const router = useRouter();

  const [autorizado, setAutorizado] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [emprestimos, setEmprestimos] = useState([]);
  const [parcelas, setParcelas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function checarEBuscar() {
      const perfil = await getPerfilAtual();
      if (!perfil || perfil.role !== "admin") {
        setAutorizado(false);
        router.replace("/dashboard");
        return;
      }
      setAutorizado(true);

      const { data: clienteData, error: erroCliente } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", id)
        .single();

      if (erroCliente) {
        setErro(erroCliente.message);
        setCarregando(false);
        return;
      }
      setCliente(clienteData);

      const { data: emprestimosData, error: erroEmprestimos } = await supabase
        .from("emprestimos")
        .select("*")
        .eq("cliente_id", id)
        .order("created_at", { ascending: false });

      if (erroEmprestimos) {
        setErro(erroEmprestimos.message);
        setCarregando(false);
        return;
      }
      setEmprestimos(emprestimosData || []);

      const idsEmprestimos = (emprestimosData || []).map((e) => e.id);
      if (idsEmprestimos.length > 0) {
        const { data: parcelasData, error: erroParcelas } = await supabase
          .from("parcelas")
          .select("*")
          .in("emprestimo_id", idsEmprestimos)
          .order("numero_parcela", { ascending: true });

        if (erroParcelas) setErro(erroParcelas.message);
        else setParcelas(parcelasData || []);
      } else {
        setParcelas([]);
      }

      setCarregando(false);
    }
    if (id) checarEBuscar();
  }, [id, router]);

  const parcelasPorEmprestimo = useMemo(() => {
    const mapa = {};
    for (const p of parcelas) {
      if (!mapa[p.emprestimo_id]) mapa[p.emprestimo_id] = [];
      mapa[p.emprestimo_id].push(p);
    }
    return mapa;
  }, [parcelas]);

  if (autorizado === null || carregando) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="eyebrow">Carregando…</p>
      </main>
    );
  }

  if (!autorizado) return null;

  if (erro) {
    return (
      <div className="px-8 py-8">
        <p className="text-wine">Erro: {erro}</p>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-8 max-w-5xl">
      <header className="mb-8">
        <Link href="/admin" className="text-xs text-faint hover:text-muted">
          ← Contratantes
        </Link>
        <p className="eyebrow mb-1 mt-3">
          Visão administrativa · somente leitura
        </p>
        <h1 className="font-display italic text-3xl text-ink">
          {cliente?.nome}
        </h1>
        <p className="text-sm text-muted mt-1">{cliente?.telefone}</p>
      </header>

      {emprestimos.length === 0 ? (
        <Card>
          <p className="text-sm text-faint py-4">
            Nenhum empréstimo cadastrado ainda.
          </p>
        </Card>
      ) : (
        <div className="space-y-6 mb-6">
          {emprestimos.map((emp) => {
            const parcelasDoEmprestimo = parcelasPorEmprestimo[emp.id] || [];
            return (
              <Card key={emp.id}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="eyebrow mb-1">
                      {TIPO_JUROS_LABEL[emp.tipo_juros] || emp.tipo_juros} ·{" "}
                      {PERIODICIDADE_LABEL[emp.periodicidade] ||
                        emp.periodicidade}
                    </p>
                    <p className="font-mono text-xl text-ink">
                      {formatBRL(emp.valor_principal)}
                    </p>
                    <p className="text-xs text-faint mt-1">
                      {emp.numero_parcelas} parcelas · taxa {emp.taxa_juros}% ·
                      início {formatData(emp.data_inicio)}
                    </p>
                  </div>
                  <Seal status={emp.status} />
                </div>

                {parcelasDoEmprestimo.length > 0 && (
                  <div className="table-scroll">
                    <table className="ledger">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Vencimento</th>
                          <th>Valor previsto</th>
                          <th>Valor pago</th>
                          <th>Situação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parcelasDoEmprestimo.map((p) => (
                          <tr key={p.id}>
                            <td>#{p.numero_parcela}</td>
                            <td className="text-muted">
                              {formatData(p.data_vencimento)}
                            </td>
                            <td className="font-mono">
                              {formatBRL(p.valor_previsto)}
                            </td>
                            <td className="font-mono text-muted">
                              {formatBRL(p.valor_pago)}
                            </td>
                            <td>
                              <Seal status={p.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <AnotacoesAssociado clienteId={id} />
    </div>
  );
}
