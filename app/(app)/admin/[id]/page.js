"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { getPerfilAtual } from "@/lib/perfil";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";

function formatBRL(value) {
  return (value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function AdminContratantePage() {
  const { id } = useParams();
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(null);
  const [contratante, setContratante] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [clientes, setClientes] = useState([]);
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

      const [
        { data: contratanteData, error: erroContratante },
        { data: resumoData, error: erroResumo },
        { data: clientesData, error: erroClientes },
      ] = await Promise.all([
        supabase.from("contratantes").select("*").eq("id", id).single(),
        supabase.rpc("resumo_por_contratante", { p_contratante_id: id }),
        supabase
          .from("clientes_com_saldo")
          .select("*")
          .eq("contratante_id", id)
          .order("nome"),
      ]);

      if (erroContratante || erroResumo || erroClientes) {
        setErro(
          erroContratante?.message ||
            erroResumo?.message ||
            erroClientes?.message,
        );
      } else {
        setContratante(contratanteData);
        setResumo(resumoData?.[0] || null);
        setClientes(clientesData || []);
      }
      setCarregando(false);
    }
    checarEBuscar();
  }, [id, router]);

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
        <p className="text-red-400">Erro: {erro}</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-5xl">
      <header className="mb-8">
        <Link href="/admin" className="text-xs text-faint hover:text-muted">
          ← Contratantes
        </Link>
        <p className="eyebrow mb-1 mt-3">Visão administrativa</p>
        <h1 className="font-display italic text-3xl text-ink">
          {contratante?.nome}
        </h1>
      </header>

      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total emprestado" value={resumo.total_emprestado} />
          <StatCard
            label="A receber"
            value={resumo.total_a_receber}
            tone="gold"
          />
          <StatCard
            label="Já recebido"
            value={resumo.total_recebido}
            tone="sage"
          />
          <StatCard
            label="Em atraso"
            value={resumo.valor_total_atrasado}
            tone="wine"
          />
        </div>
      )}

      <Card>
        <h2 className="text-sm text-gold-dim uppercase tracking-widest mb-4">
          Associados
        </h2>
        {clientes.length === 0 ? (
          <p className="text-sm text-faint py-4">
            Nenhum associado cadastrado por este contratante ainda.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Empréstimos</th>
                  <th>Saldo devedor</th>
                  <th>Parcelas atrasadas</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.cliente_id}>
                    <td className="text-ink">
                      <Link
                        href={`/admin/associado/${c.cliente_id}`}
                        className="hover:text-gold underline decoration-line-soft underline-offset-2"
                      >
                        {c.nome}
                      </Link>
                    </td>
                    <td className="text-muted">{c.telefone}</td>
                    <td className="text-muted">{c.total_emprestimos}</td>
                    <td className="text-muted">{formatBRL(c.saldo_devedor)}</td>
                    <td
                      className={
                        c.parcelas_atrasadas > 0 ? "text-red-400" : "text-muted"
                      }
                    >
                      {c.parcelas_atrasadas}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
