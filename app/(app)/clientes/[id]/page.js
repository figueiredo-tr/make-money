'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Card from '@/components/ui/Card';
import Seal from '@/components/ui/Seal';
import ModalPagamento from '@/components/ui/ModalPagamento';

function formatBRL(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatData(dataISO) {
  if (!dataISO) return '—';
  return new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');
}

const TIPO_JUROS_LABEL = { fixo: 'Fixo sobre o valor', simples: 'Simples a.m.', composto: 'Composto a.m.' };
const PERIODICIDADE_LABEL = { mensal: 'Mensal', semanal: 'Semanal' };

export default function ClienteDetalhePage() {
  const { id } = useParams();
  const router = useRouter();

  const [cliente, setCliente] = useState(null);
  const [emprestimos, setEmprestimos] = useState([]);
  const [parcelas, setParcelas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [parcelaSelecionada, setParcelaSelecionada] = useState(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);

    const { data: clienteData, error: erroCliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (erroCliente) {
      setErro(erroCliente.message);
      setCarregando(false);
      return;
    }
    setCliente(clienteData);

    const { data: emprestimosData, error: erroEmprestimos } = await supabase
      .from('emprestimos')
      .select('*')
      .eq('cliente_id', id)
      .order('created_at', { ascending: false });

    if (erroEmprestimos) {
      setErro(erroEmprestimos.message);
      setCarregando(false);
      return;
    }
    setEmprestimos(emprestimosData || []);

    const idsEmprestimos = (emprestimosData || []).map((e) => e.id);
    if (idsEmprestimos.length > 0) {
      const { data: parcelasData, error: erroParcelas } = await supabase
        .from('parcelas')
        .select('*')
        .in('emprestimo_id', idsEmprestimos)
        .order('numero_parcela', { ascending: true });

      if (erroParcelas) setErro(erroParcelas.message);
      else setParcelas(parcelasData || []);
    } else {
      setParcelas([]);
    }

    setCarregando(false);
  }

  useEffect(() => {
    if (id) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!mensagem) return;
    const t = setTimeout(() => setMensagem(null), 5000);
    return () => clearTimeout(t);
  }, [mensagem]);

  const parcelasPorEmprestimo = useMemo(() => {
    const mapa = {};
    for (const p of parcelas) {
      if (!mapa[p.emprestimo_id]) mapa[p.emprestimo_id] = [];
      mapa[p.emprestimo_id].push(p);
    }
    return mapa;
  }, [parcelas]);

  const resumo = useMemo(() => {
    const saldoDevedor = parcelas.reduce(
      (soma, p) => soma + Math.max(p.valor_previsto - (p.valor_pago || 0), 0),
      0
    );
    const atrasadas = parcelas.filter((p) => p.status === 'atrasado').length;
    return { saldoDevedor, atrasadas };
  }, [parcelas]);

  async function handleSucessoPagamento(resultado) {
    setMensagem(
      resultado.emprestimoQuitado
        ? `Pagamento registrado — empréstimo quitado! 🎉`
        : 'Pagamento registrado com sucesso.'
    );
    setParcelaSelecionada(null);
    await carregar();
  }

  if (carregando) {
    return (
      <div className="px-8 py-8">
        <p className="text-sm text-faint">Carregando…</p>
      </div>
    );
  }

  if (erro || !cliente) {
    return (
      <div className="px-8 py-8 max-w-2xl">
        <p className="text-sm text-wine bg-wine/10 border border-wine/30 rounded-sm px-3 py-2">
          {erro || 'Associado não encontrado.'}
        </p>
        <button className="btn btn-ghost mt-4" onClick={() => router.push('/clientes')}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-5xl">
      <Link href="/clientes" className="text-xs text-faint hover:text-muted transition-colors">
        ← Associados
      </Link>

      <header className="mt-3 mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-1">Ficha do associado</p>
          <h1 className="font-display italic text-3xl text-ink">{cliente.nome}</h1>
          <p className="text-sm text-muted font-mono mt-1">
            {cliente.telefone || '—'} {cliente.cpf ? `· ${cliente.cpf}` : ''}
          </p>
        </div>
        <Link href={`/emprestimos/novo`} className="btn btn-primary">
          + Novo empréstimo
        </Link>
      </header>

      {mensagem && (
        <p className="text-sm text-sage bg-sage/10 border border-sage/30 rounded-sm px-3 py-2 mb-6">{mensagem}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="eyebrow mb-2">Saldo devedor</p>
          <p className="font-mono text-xl text-gold">{formatBRL(resumo.saldoDevedor)}</p>
        </Card>
        <Card>
          <p className="eyebrow mb-2">Empréstimos</p>
          <p className="font-mono text-xl text-ink">{emprestimos.length}</p>
        </Card>
        <Card>
          <p className="eyebrow mb-2">Parcelas atrasadas</p>
          <p className={`font-mono text-xl ${resumo.atrasadas > 0 ? 'text-wine' : 'text-ink'}`}>
            {resumo.atrasadas}
          </p>
        </Card>
      </div>

      {emprestimos.length === 0 ? (
        <Card>
          <p className="text-sm text-faint py-2">Esse associado ainda não tem empréstimos registrados.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {emprestimos.map((emp) => {
            const parcelasDoEmprestimo = parcelasPorEmprestimo[emp.id] || [];
            return (
              <Card key={emp.id}>
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <p className="eyebrow mb-1">
                      Empréstimo · {formatData(emp.data_primeiro_vencimento)}
                    </p>
                    <p className="font-mono text-lg text-ink">{formatBRL(emp.valor_principal)}</p>
                    <p className="text-xs text-muted mt-1">
                      {TIPO_JUROS_LABEL[emp.tipo_juros] || emp.tipo_juros} · {emp.taxa_juros}% ·{' '}
                      {emp.numero_parcelas}x {PERIODICIDADE_LABEL[emp.periodicidade] || emp.periodicidade}
                    </p>
                  </div>
                  <Seal status={emp.status} />
                </div>

                {parcelasDoEmprestimo.length === 0 ? (
                  <p className="text-sm text-faint py-2">Nenhuma parcela gerada pra esse empréstimo.</p>
                ) : (
                  <table className="ledger">
                    <thead>
                      <tr>
                        <th>Parcela</th>
                        <th>Vencimento</th>
                        <th>Valor previsto</th>
                        <th>Pago</th>
                        <th>Restante</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcelasDoEmprestimo.map((p) => {
                        const restante = p.valor_previsto - (p.valor_pago || 0);
                        return (
                          <tr key={p.id} className={p.status === 'atrasado' ? 'bg-wine/[0.04]' : ''}>
                            <td className="font-mono text-muted">#{p.numero_parcela}</td>
                            <td className="font-mono">{formatData(p.data_vencimento)}</td>
                            <td className="font-mono">{formatBRL(p.valor_previsto)}</td>
                            <td className="font-mono text-muted">{formatBRL(p.valor_pago)}</td>
                            <td className="font-mono">{restante > 0 ? formatBRL(restante) : '—'}</td>
                            <td>
                              <Seal status={p.status} />
                            </td>
                            <td className="text-right">
                              {p.status !== 'pago' && (
                                <button
                                  className="btn btn-ghost !py-1.5 !px-3 !text-xs"
                                  onClick={() => setParcelaSelecionada(p)}
                                >
                                  Registrar pagamento
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {parcelaSelecionada && (
        <ModalPagamento
          parcela={parcelaSelecionada}
          nomeCliente={cliente.nome}
          onClose={() => setParcelaSelecionada(null)}
          onSuccess={handleSucessoPagamento}
        />
      )}
    </div>
  );
}
