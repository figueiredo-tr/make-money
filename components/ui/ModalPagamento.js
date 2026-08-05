'use client';

import { useState } from 'react';
import { registrarPagamento } from '@/lib/parcelas';
import Card from './Card';

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

export default function ModalPagamento({ parcela, nomeCliente, onClose, onSuccess }) {
  const [valorPagoInput, setValorPagoInput] = useState(
    (parcela.valor_previsto - (parcela.valor_pago || 0)).toFixed(2)
  );
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const valor = parseFloat(valorPagoInput);
    if (!valor || valor <= 0) {
      setErro('Informe um valor válido.');
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const resultado = await registrarPagamento(parcela.id, valor, formaPagamento);
      onSuccess(resultado);
    } catch (erroRegistro) {
      setErro(erroRegistro.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-sm">
        <p className="eyebrow mb-1">Registrar pagamento</p>
        <h2 className="font-display italic text-xl text-ink mb-1">{nomeCliente}</h2>
        <p className="text-xs text-faint mb-5">
          Parcela #{parcela.numero_parcela} — vencimento em {formatData(parcela.data_vencimento)}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              Restante previsto: {formatBRL(parcela.valor_previsto - (parcela.valor_pago || 0))}
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

          {erro && (
            <p className="text-sm text-wine bg-wine/10 border border-wine/30 rounded-sm px-3 py-2">{erro}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={salvando} className="btn btn-primary flex-1">
              {salvando ? 'Registrando…' : 'Confirmar pagamento'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
