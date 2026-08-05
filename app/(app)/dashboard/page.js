"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import Seal from "@/components/ui/Seal";

export default function DashboardPage() {
  const [resumo, setResumo] = useState(null);
  const [vencimentos, setVencimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErro(null);

      const [resumoRes, vencimentosRes] = await Promise.all([
        supabase.from("resumo_geral").select("*").single(),
        supabase.from("proximos_vencimentos").select("*").limit(8),
      ]);

      if (resumoRes.error) setErro(resumoRes.error.message);
      else setResumo(resumoRes.data);

      if (!vencimentosRes.error) setVencimentos(vencimentosRes.data || []);

      setCarregando(false);
    }

    carregar();
  }, []);

  return (
    <div className="px-8 py-8 max-w-6xl">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-1">Visão geral</p>
          <h1 className="font-display italic text-3xl text-ink">Libretto</h1>
        </div>
        <Link href="/emprestimos/novo" className="btn btn-primary">
          + Novo empréstimo
        </Link>
      </header>

      {erro && (
        <p className="text-sm text-wine bg-wine/10 border border-wine/30 rounded-sm px-3 py-2 mb-6">
          Erro ao carregar dados: {erro}
        </p>
      )}

      {carregando ? (
        <p className="text-sm text-faint">Carregando…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Total emprestado"
              value={resumo?.total_emprestado}
              tone="gold"
            />
            <StatCard label="A receber" value={resumo?.total_a_receber} />
            <StatCard
              label="Já recebido"
              value={resumo?.total_recebido}
              tone="sage"
            />
            <StatCard
              label="Empréstimos em aberto"
              value={resumo?.emprestimos_ativos}
              format="number"
            />
            <StatCard
              label="Empréstimos quitados"
              value={resumo?.emprestimos_quitados}
              format="number"
              tone="sage"
            />
            <StatCard
              label="Valor em atraso"
              value={resumo?.valor_total_atrasado}
              tone="wine"
            />
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="eyebrow">Próximos vencimentos (7 dias)</p>
              {resumo?.parcelas_atrasadas > 0 && (
                <Seal
                  status="atrasado"
                  label={`${resumo.parcelas_atrasadas} parcela(s) atrasada(s)`}
                />
              )}
            </div>

            {vencimentos.length === 0 ? (
              <p className="text-sm text-faint py-4">
                Nenhum vencimento nos próximos 7 dias.
              </p>
            ) : (
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Associado</th>
                    <th>Parcela</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vencimentos.map((v) => (
                    <tr key={v.parcela_id}>
                      <td>{v.cliente_nome}</td>
                      <td className="font-mono text-muted">
                        #{v.numero_parcela}
                      </td>
                      <td className="font-mono">
                        {new Date(
                          v.data_vencimento + "T00:00:00",
                        ).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="font-mono">
                        {(
                          v.valor_previsto - (v.valor_pago || 0)
                        ).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td>
                        <Seal status={v.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
