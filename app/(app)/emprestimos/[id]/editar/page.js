'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { calcularParcela } from '@/lib/calculos';
import { gerarParcelas } from '@/lib/parcelas';
import Card from '@/components/ui/Card';

function formatBRL(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function EditarEmprestimoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const [clienteNome, setClienteNome] = useState('');
  const [temPagamento, setTemPagamento] = useState(false);

  const [valorPrincipal, setValorPrincipal] = useState('');
  const [taxaJuros, setTaxaJuros] = useState('');
  const [tipoJuros, setTipoJuros] = useState('fixo');
  const [periodicidade, setPeriodicidade] = useState('mensal');
  const [jurosDia, setJurosDia] = useState('');
  const [jurosDiaTipo, setJurosDiaTipo] = useState('percentual');
  const [numeroParcelas, setNumeroParcelas] = useState('');
  const [dataPrimeiroVencimento, setDataPrimeiroVencimento] = useState('');
  const [status, setStatus] = useState('ativo');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    async function carregar() {
      setCarregando(true);

      const { data: emp, error: erroEmp } = await supabase
        .from('emprestimos')
        .select('*, clientes(nome)')
        .eq('id', id)
        .single();

      if (erroEmp) {
        setErro(erroEmp.message);
        setCarregando(false);
        return;
      }

      const { data: parcelas, error: erroParc } = await supabase
        .from('parcelas')
        .select('valor_pago, status')
        .eq('emprestimo_id', id);

      if (erroParc) {
        setErro(erroParc.message);
        setCarregando(false);
        return;
      }

      setClienteNome(emp.clientes?.nome || '');
      setTemPagamento((parcelas || []).some((p) => (p.valor_pago || 0) > 0));

      setValorPrincipal(String(emp.valor_principal ?? ''));
      setTaxaJuros(String(emp.taxa_juros ?? ''));
      setTipoJuros(emp.tipo_juros || 'fixo');
      setPeriodicidade(emp.periodicidade || 'mensal');
      setJurosDia(String(emp.juros_dia ?? ''));
      setJurosDiaTipo(emp.juros_dia_tipo || 'percentual');
      setNumeroParcelas(String(emp.numero_parcelas ?? ''));
      setDataPrimeiroVencimento(emp.data_primeiro_vencimento || '');
      setStatus(emp.status || 'ativo');
      setObservacoes(emp.observacoes || '');

      setCarregando(false);
    }
    if (id) carregar();
  }, [id]);

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
    setSalvando(true);

    const payload = {
      juros_dia: parseFloat(jurosDia) || 0,
      juros_dia_tipo: jurosDiaTipo,
      status,
      observacoes: observacoes.trim() || null,
    };

    // Campos que afetam o cronograma de parcelas só podem mudar se nada foi pago ainda
    if (!temPagamento) {
      payload.valor_principal = parseFloat(valorPrincipal);
      payload.taxa_juros = parseFloat(taxaJuros);
      payload.tipo_juros = tipoJuros;
      payload.periodicidade = periodicidade;
      payload.numero_parcelas = parseInt(numeroParcelas, 10);
      payload.data_primeiro_vencimento = dataPrimeiroVencimento;
    }

    const { data: emprestimoAtualizado, error: erroUpdate } = await supabase
      .from('emprestimos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (erroUpdate) {
      setErro(erroUpdate.message);
      setSalvando(false);
      return;
    }

    // Se mudou algo do cronograma, regenera as parcelas do zero (só chega aqui se !temPagamento)
    if (!temPagamento) {
      const { error: erroDelete } = await supabase.from('parcelas').delete().eq('emprestimo_id', id);
      if (erroDelete) {
        setErro(`Empréstimo salvo, mas falhou ao regenerar parcelas: ${erroDelete.message}`);
        setSalvando(false);
        return;
      }
      try {
        await gerarParcelas(emprestimoAtualizado);
      } catch (erroGerar) {
        setErro(`Empréstimo salvo, mas falhou ao regenerar parcelas: ${erroGerar.message}`);
        setSalvando(false);
        return;
      }
    }

    router.push(`/clientes/${emprestimoAtualizado.cliente_id}`);
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
        <h1 className="font-display italic text-3xl text-ink">Editar empréstimo</h1>
        <p className="text-sm text-muted mt-1">{clienteNome}</p>
      </header>

      {temPagamento && (
        <p className="text-sm text-gold bg-gold/10 border border-gold/30 rounded-sm px-3 py-2 mb-6">
          Esse empréstimo já tem parcela paga — valor, taxa, tipo de juros, periodicidade, nº de
          parcelas e data do primeiro vencimento ficam travados pra não invalidar o histórico de
          pagamento. Você ainda pode ajustar o juros por atraso, status e observações.
        </p>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="valor">
                Valor principal (R$) *
              </label>
              <input
                id="valor"
                type="number"
                min="0.01"
                step="0.01"
                required
                disabled={temPagamento}
                className="input font-mono disabled:opacity-50"
                value={valorPrincipal}
                onChange={(e) => setValorPrincipal(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="taxa">
                Taxa de juros (%) *
              </label>
              <input
                id="taxa"
                type="number"
                min="0"
                step="0.01"
                required
                disabled={temPagamento}
                className="input font-mono disabled:opacity-50"
                value={taxaJuros}
                onChange={(e) => setTaxaJuros(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="tipo-juros">
                Tipo de juros
              </label>
              <select
                id="tipo-juros"
                disabled={temPagamento}
                className="input disabled:opacity-50"
                value={tipoJuros}
                onChange={(e) => setTipoJuros(e.target.value)}
              >
                <option value="fixo">Fixo sobre o valor</option>
                <option value="simples">Simples a.m.</option>
                <option value="composto">Composto a.m.</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="periodicidade">
                Periodicidade
              </label>
              <select
                id="periodicidade"
                disabled={temPagamento}
                className="input disabled:opacity-50"
                value={periodicidade}
                onChange={(e) => setPeriodicidade(e.target.value)}
              >
                <option value="mensal">Mensal</option>
                <option value="semanal">Semanal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Juros por atraso</label>
            <div className="flex gap-4 items-end">
              <div className="flex rounded-sm border border-line overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setJurosDiaTipo('percentual')}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                    jurosDiaTipo === 'percentual' ? 'bg-gold/10 text-gold' : 'text-muted hover:text-ink'
                  }`}
                >
                  % ao dia
                </button>
                <button
                  type="button"
                  onClick={() => setJurosDiaTipo('valor')}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide border-l border-line transition-colors ${
                    jurosDiaTipo === 'valor' ? 'bg-gold/10 text-gold' : 'text-muted hover:text-ink'
                  }`}
                >
                  R$ ao dia
                </button>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input font-mono max-w-[10rem]"
                value={jurosDia}
                onChange={(e) => setJurosDia(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="parcelas">
                Nº de parcelas *
              </label>
              <input
                id="parcelas"
                type="number"
                min="1"
                required
                disabled={temPagamento}
                className="input font-mono disabled:opacity-50"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="primeiro-vencimento">
                1º vencimento *
              </label>
              <input
                id="primeiro-vencimento"
                type="date"
                required
                disabled={temPagamento}
                className="input font-mono disabled:opacity-50"
                value={dataPrimeiroVencimento}
                onChange={(e) => setDataPrimeiroVencimento(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="status">
              Status
            </label>
            <select id="status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ativo">Em aberto</option>
              <option value="quitado">Quitado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="observacoes">
              Observações
            </label>
            <textarea
              id="observacoes"
              className="input min-h-[80px] resize-y"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          {preview && !temPagamento && (
            <p className="text-xs text-faint">
              Prévia: {numeroParcelas}x de {formatBRL(preview.valorParcela)} — regenera as parcelas ao salvar.
            </p>
          )}

          {erro && (
            <p className="text-sm text-wine bg-wine/10 border border-wine/30 rounded-sm px-3 py-2">{erro}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={salvando} className="btn btn-primary">
              {salvando ? 'Salvando…' : 'Salvar alterações'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
              Cancelar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
