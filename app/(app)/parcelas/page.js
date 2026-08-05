'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { atualizarParcelasAtrasadas } from '@/lib/parcelas';
import { calcularJurosAtraso, diasEmAtraso } from '@/lib/calculos';
import Card from '@/components/ui/Card';
import Seal from '@/components/ui/Seal';
import ModalPagamento from '@/components/ui/ModalPagamento';

const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'atrasado', label: 'Atrasadas' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'parcial', label: 'Parciais' },
  { value: 'pago', label: 'Pagas' },
];

function formatBRL(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatData(dataISO) {
  if (!dataISO) return '—';
  return new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');
}

export default function ParcelasPage() {
  const [parcelas, setParcelas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [busca, setBusca] = useState('');
  const [parcelaSelecionada, setParcelaSelecionada] = useState(null);
  const [expandidos, setExpandidos] = useState(new Set());

  function toggleGrupo(clienteId) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      next.has(clienteId) ? next.delete(clienteId) : next.add(clienteId);
      return next;
    });
  }

  async function carregar() {
    setCarregando(true);
    setErro(null);

    try {
      await atualizarParcelasAtrasadas();
    } catch (erroAtualizacao) {
      console.error(erroAtualizacao);
    }

    const { data, error } = await supabase
      .from('parcelas')
      .select('*, emprestimos(id, cliente_id, status, juros_dia, clientes(id, nome, telefone))')
      .order('data_vencimento', { ascending: true });

    if (error) setErro(error.message);
    else setParcelas(data || []);

    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (!mensagem) return;
    const t = setTimeout(() => setMensagem(null), 5000);
    return () => clearTimeout(t);
  }, [mensagem]);

  const contagens = useMemo(() => {
    const c = { todas: parcelas.length, atrasado: 0, pendente: 0, parcial: 0, pago: 0 };
    for (const p of parcelas) {
      if (c[p.status] !== undefined) c[p.status] += 1;
    }
    return c;
  }, [parcelas]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return parcelas.filter((p) => {
      if (filtroStatus !== 'todas' && p.status !== filtroStatus) return false;
      if (termo && !p.emprestimos?.clientes?.nome?.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [parcelas, filtroStatus, busca]);

  // Agrupa as parcelas filtradas por associado, pra ficar organizado por
  // pessoa em vez de uma tabela única misturando todo mundo.
  const grupos = useMemo(() => {
    const mapa = new Map();

    for (const p of filtradas) {
      const clienteId = p.emprestimos?.clientes?.id || p.emprestimos?.cliente_id || 'sem-cliente';
      if (!mapa.has(clienteId)) {
        mapa.set(clienteId, {
          clienteId,
          nome: p.emprestimos?.clientes?.nome || 'Associado removido',
          telefone: p.emprestimos?.clientes?.telefone,
          parcelas: [],
          atrasadas: 0,
          restanteTotal: 0,
        });
      }
      const grupo = mapa.get(clienteId);
      grupo.parcelas.push(p);
      if (p.status === 'atrasado') grupo.atrasadas += 1;
      grupo.restanteTotal += p.valor_previsto - (p.valor_pago || 0);
    }

    return Array.from(mapa.values()).sort((a, b) => {
      if (a.atrasadas !== b.atrasadas) return b.atrasadas - a.atrasadas;
      return a.nome.localeCompare(b.nome);
    });
  }, [filtradas]);

  async function handleSucessoPagamento(resultado) {
    setMensagem(
      resultado.emprestimoQuitado
        ? `Pagamento registrado — empréstimo de ${parcelaSelecionada?.emprestimos?.clientes?.nome} foi quitado! 🎉`
        : 'Pagamento registrado com sucesso.'
    );
    setParcelaSelecionada(null);
    await carregar();
  }

  return (
    <div className="px-8 py-8 max-w-5xl">
      <header className="mb-8">
        <p className="eyebrow mb-1">Livro de parcelas</p>
        <h1 className="font-display italic text-3xl text-ink">Parcelas</h1>
      </header>

      {mensagem && (
        <p className="text-sm text-sage bg-sage/10 border border-sage/30 rounded-sm px-3 py-2 mb-6">{mensagem}</p>
      )}

      {erro && (
        <p className="text-sm text-wine bg-wine/10 border border-wine/30 rounded-sm px-3 py-2 mb-6">
          Erro ao carregar dados: {erro}
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltroStatus(f.value)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full border transition-colors ${
                filtroStatus === f.value
                  ? 'bg-gold/10 text-gold border-gold/40'
                  : 'text-muted border-line hover:text-ink hover:border-gold-dim'
              }`}
            >
              {f.label}
              {contagens[f.value] !== undefined && (
                <span className="ml-1.5 font-mono opacity-70">{contagens[f.value]}</span>
              )}
            </button>
          ))}
        </div>

        <input
          className="input max-w-xs"
          placeholder="Buscar por associado…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {carregando ? (
        <p className="text-sm text-faint py-4">Carregando…</p>
      ) : grupos.length === 0 ? (
        <Card>
          <p className="text-sm text-faint py-2">
            {busca || filtroStatus !== 'todas'
              ? 'Nenhuma parcela encontrada para esse filtro.'
              : 'Nenhuma parcela cadastrada ainda.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {grupos.map((grupo) => {
            const aberto = expandidos.has(grupo.clienteId);
            return (
              <Card key={grupo.clienteId}>
                <button
                  type="button"
                  onClick={() => toggleGrupo(grupo.clienteId)}
                  className="w-full flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-faint transition-transform ${aberto ? 'rotate-90' : ''}`}>›</span>
                    <span className="font-display italic text-lg text-ink">{grupo.nome}</span>
                    <span className="text-xs text-faint font-mono">
                      {grupo.parcelas.length} parcela(s) · restante {formatBRL(grupo.restanteTotal)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {grupo.atrasadas > 0 && <Seal status="atrasado" label={`${grupo.atrasadas} atrasada(s)`} />}
                    <Link
                      href={`/clientes/${grupo.clienteId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-muted hover:text-gold transition-colors"
                    >
                      ver ficha →
                    </Link>
                  </div>
                </button>

                {aberto && (
                  <table className="ledger mt-4">
                    <thead>
                      <tr>
                        <th>Parcela</th>
                        <th>Vencimento</th>
                        <th>Valor previsto</th>
                        <th>Restante</th>
                        <th>Juros dia</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.parcelas.map((p) => {
                        const restante = p.valor_previsto - (p.valor_pago || 0);
                        const dias = diasEmAtraso(p.data_vencimento);
                        const juros = calcularJurosAtraso(restante, p.emprestimos?.juros_dia, dias);
                        return (
                          <tr key={p.id} className={p.status === 'atrasado' ? 'bg-wine/[0.04]' : ''}>
                            <td className="font-mono text-muted">#{p.numero_parcela}</td>
                            <td className="font-mono">{formatData(p.data_vencimento)}</td>
                            <td className="font-mono">{formatBRL(p.valor_previsto)}</td>
                            <td className="font-mono">{restante > 0 ? formatBRL(restante) : '—'}</td>
                            <td className="font-mono">
                              {juros > 0 ? (
                                <span className="text-wine-soft" style={{ color: '#e0949e' }}>
                                  +{formatBRL(juros)} <span className="text-faint">({dias}d)</span>
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
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
          nomeCliente={parcelaSelecionada.emprestimos?.clientes?.nome}
          onClose={() => setParcelaSelecionada(null)}
          onSuccess={handleSucessoPagamento}
        />
      )}
    </div>
  );
}
