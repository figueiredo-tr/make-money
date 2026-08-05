'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { registrarPagamento, atualizarParcelasAtrasadas } from '@/lib/parcelas';
import Card from '@/components/ui/Card';
import Seal from '@/components/ui/Seal';

const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'atrasado', label: 'Atrasadas' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'parcial', label: 'Parciais' },
  { value: 'pago', label: 'Pagas' },
];

const FORMAS_PAGAMENTO = [
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'outro', label: 'Outro' },
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
  const [valorPagoInput, setValorPagoInput] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);
  const [erroPagamento, setErroPagamento] = useState(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);

    try {
      await atualizarParcelasAtrasadas();
    } catch (erroAtualizacao) {
      // não bloqueia a listagem se essa etapa falhar
      console.error(erroAtualizacao);
    }

    const { data, error } = await supabase
      .from('parcelas')
      .select('*, emprestimos(id, status, clientes(nome, telefone))')
      .order('data_vencimento', { ascending: true });

    if (error) setErro(error.message);
    else setParcelas(data || []);

    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return parcelas.filter((p) => {
      if (filtroStatus !== 'todas' && p.status !== filtroStatus) return false;
      if (termo && !p.emprestimos?.clientes?.nome?.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [parcelas, filtroStatus, busca]);

  const contagens = useMemo(() => {
    const c = { todas: parcelas.length, atrasado: 0, pendente: 0, parcial: 0, pago: 0 };
    for (const p of parcelas) {
      if (c[p.status] !== undefined) c[p.status] += 1;
    }
    return c;
  }, [parcelas]);

  function abrirModalPagamento(parcela) {
    setParcelaSelecionada(parcela);
    const restante = (parcela.valor_previsto - (parcela.valor_pago || 0)).toFixed(2);
    setValorPagoInput(restante);
    setFormaPagamento('pix');
    setErroPagamento(null);
  }

  function fecharModal() {
    setParcelaSelecionada(null);
    setErroPagamento(null);
  }

  async function confirmarPagamento(e) {
    e.preventDefault();
    if (!parcelaSelecionada) return;

    const valor = parseFloat(valorPagoInput);
    if (!valor || valor <= 0) {
      setErroPagamento('Informe um valor válido.');
      return;
    }

    setSalvandoPagamento(true);
    setErroPagamento(null);

    try {
      const resultado = await registrarPagamento(parcelaSelecionada.id, valor, formaPagamento);
      setMensagem(
        resultado.emprestimoQuitado
          ? `Pagamento registrado — empréstimo de ${parcelaSelecionada.emprestimos?.clientes?.nome} foi quitado! 🎉`
          : 'Pagamento registrado com sucesso.'
      );
      setParcelaSelecionada(null);
      await carregar();
    } catch (erroRegistro) {
      setErroPagamento(erroRegistro.message);
    } finally {
      setSalvandoPagamento(false);
    }
  }

  useEffect(() => {
    if (!mensagem) return;
    const t = setTimeout(() => setMensagem(null), 5000);
    return () => clearTimeout(t);
  }, [mensagem]);

  return (
    <div className="px-8 py-8 max-w-6xl">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-1">Livro de parcelas</p>
          <h1 className="font-display italic text-3xl text-ink">Parcelas</h1>
        </div>
      </header>

      {mensagem && (
        <p className="text-sm text-sage bg-sage/10 border border-sage/30 rounded-sm px-3 py-2 mb-6">
          {mensagem}
        </p>
      )}

      {erro && (
        <p className="text-sm text-wine bg-wine/10 border border-wine/30 rounded-sm px-3 py-2 mb-6">
          Erro ao carregar dados: {erro}
        </p>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
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

      <Card>
        {carregando ? (
          <p className="text-sm text-faint py-4">Carregando…</p>
        ) : filtradas.length === 0 ? (
          <p className="text-sm text-faint py-4">
            {busca || filtroStatus !== 'todas'
              ? 'Nenhuma parcela encontrada para esse filtro.'
              : 'Nenhuma parcela cadastrada ainda.'}
          </p>
        ) : (
          <table className="ledger">
            <thead>
              <tr>
                <th>Associado</th>
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
              {filtradas.map((p) => {
                const restante = p.valor_previsto - (p.valor_pago || 0);
                const podeRegistrarPagamento = p.status !== 'pago';
                return (
                  <tr
                    key={p.id}
                    className={p.status === 'atrasado' ? 'bg-wine/[0.04]' : ''}
                  >
                    <td className="text-ink">{p.emprestimos?.clientes?.nome || '—'}</td>
                    <td className="font-mono text-muted">#{p.numero_parcela}</td>
                    <td className="font-mono">{formatData(p.data_vencimento)}</td>
                    <td className="font-mono">{formatBRL(p.valor_previsto)}</td>
                    <td className="font-mono text-muted">{formatBRL(p.valor_pago)}</td>
                    <td className="font-mono">{restante > 0 ? formatBRL(restante) : '—'}</td>
                    <td>
                      <Seal status={p.status} />
                    </td>
                    <td className="text-right">
                      {podeRegistrarPagamento && (
                        <button
                          className="btn btn-ghost !py-1.5 !px-3 !text-xs"
                          onClick={() => abrirModalPagamento(p)}
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

      {parcelaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <Card className="w-full max-w-sm">
            <p className="eyebrow mb-1">Registrar pagamento</p>
            <h2 className="font-display italic text-xl text-ink mb-1">
              {parcelaSelecionada.emprestimos?.clientes?.nome}
            </h2>
            <p className="text-xs text-faint mb-5">
              Parcela #{parcelaSelecionada.numero_parcela} — vencimento em{' '}
              {formatData(parcelaSelecionada.data_vencimento)}
            </p>

            <form onSubmit={confirmarPagamento} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="valor-pago">
                  Valor pago (R$) *
                </label>
                <input
                  id="valor-pago"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  className="input font-mono"
                  value={valorPagoInput}
                  onChange={(e) => setValorPagoInput(e.target.value)}
                />
                <p className="text-xs text-faint mt-1.5">
                  Restante previsto:{' '}
                  {formatBRL(
                    parcelaSelecionada.valor_previsto - (parcelaSelecionada.valor_pago || 0)
                  )}
                </p>
              </div>

              <div>
                <label className="field-label" htmlFor="forma-pagamento">
                  Forma de pagamento
                </label>
                <select
                  id="forma-pagamento"
                  className="input"
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                >
                  {FORMAS_PAGAMENTO.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {erroPagamento && (
                <p className="text-sm text-wine bg-wine/10 border border-wine/30 rounded-sm px-3 py-2">
                  {erroPagamento}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={salvandoPagamento} className="btn btn-primary flex-1">
                  {salvandoPagamento ? 'Registrando…' : 'Confirmar pagamento'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={fecharModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
