import { supabase } from './supabaseClient';
import { calcularParcela } from './calculos';

/**
 * Gera as parcelas de um empréstimo recém-criado e insere no Supabase.
 * Deve ser chamada logo após o insert em `emprestimos`.
 *
 * @param {object} emprestimo - registro retornado do insert em `emprestimos`
 *   Precisa conter: id, valor_principal, taxa_juros, numero_parcelas, tipo_juros, data_primeiro_vencimento
 */
export async function gerarParcelas(emprestimo) {
  const {
    id: emprestimoId,
    valor_principal: principal,
    taxa_juros: taxa,
    numero_parcelas: numParcelas,
    tipo_juros: tipoJuros,
    data_primeiro_vencimento: primeiroVencimento,
  } = emprestimo;

  const { valorParcela } = calcularParcela(principal, taxa, numParcelas, tipoJuros);

  const parcelas = [];
  const dataBase = new Date(primeiroVencimento + 'T00:00:00');

  for (let i = 0; i < numParcelas; i++) {
    const vencimento = new Date(dataBase);
    vencimento.setMonth(vencimento.getMonth() + i);

    parcelas.push({
      emprestimo_id: emprestimoId,
      numero_parcela: i + 1,
      valor_previsto: valorParcela,
      data_vencimento: vencimento.toISOString().split('T')[0],
      status: 'pendente',
    });
  }

  const { data, error } = await supabase.from('parcelas').insert(parcelas).select();

  if (error) {
    throw new Error(`Erro ao gerar parcelas: ${error.message}`);
  }

  return data;
}

/**
 * Registra um pagamento numa parcela e atualiza o status dela.
 * @param {string} parcelaId
 * @param {number} valorPago
 * @param {string} formaPagamento
 */
export async function registrarPagamento(parcelaId, valorPago, formaPagamento = 'pix') {
  // Busca a parcela atual
  const { data: parcela, error: erroBusca } = await supabase
    .from('parcelas')
    .select('*')
    .eq('id', parcelaId)
    .single();

  if (erroBusca) throw new Error(`Erro ao buscar parcela: ${erroBusca.message}`);

  const novoValorPago = (parcela.valor_pago || 0) + valorPago;
  const novoStatus = novoValorPago >= parcela.valor_previsto ? 'pago' : 'parcial';

  // Insere o pagamento no histórico
  const { error: erroPagamento } = await supabase.from('pagamentos').insert({
    parcela_id: parcelaId,
    valor: valorPago,
    forma_pagamento: formaPagamento,
  });
  if (erroPagamento) throw new Error(`Erro ao registrar pagamento: ${erroPagamento.message}`);

  // Atualiza a parcela
  const { error: erroUpdate } = await supabase
    .from('parcelas')
    .update({
      valor_pago: novoValorPago,
      status: novoStatus,
      data_pagamento: novoStatus === 'pago' ? new Date().toISOString().split('T')[0] : null,
    })
    .eq('id', parcelaId);

  if (erroUpdate) throw new Error(`Erro ao atualizar parcela: ${erroUpdate.message}`);

  // Se essa foi a última parcela em aberto do empréstimo, marca o empréstimo como quitado
  let emprestimoQuitado = false;
  if (novoStatus === 'pago') {
    emprestimoQuitado = await verificarQuitacaoEmprestimo(parcela.emprestimo_id);
  }

  return { novoValorPago, novoStatus, emprestimoQuitado };
}

/**
 * Verifica se todas as parcelas de um empréstimo estão pagas; se sim, marca o
 * empréstimo como 'quitado'. Retorna true se o empréstimo foi quitado agora.
 * @param {string} emprestimoId
 */
export async function verificarQuitacaoEmprestimo(emprestimoId) {
  const { data: parcelasDoEmprestimo, error: erroBusca } = await supabase
    .from('parcelas')
    .select('status')
    .eq('emprestimo_id', emprestimoId);

  if (erroBusca) throw new Error(`Erro ao verificar parcelas do empréstimo: ${erroBusca.message}`);

  const todasPagas =
    parcelasDoEmprestimo.length > 0 && parcelasDoEmprestimo.every((p) => p.status === 'pago');

  if (!todasPagas) return false;

  const { error: erroUpdate } = await supabase
    .from('emprestimos')
    .update({ status: 'quitado' })
    .eq('id', emprestimoId)
    .eq('status', 'ativo'); // não sobrescreve 'cancelado', por exemplo

  if (erroUpdate) throw new Error(`Erro ao quitar empréstimo: ${erroUpdate.message}`);

  return true;
}

/**
 * Marca parcelas vencidas e não pagas como 'atrasado'.
 * Ideal rodar isso ao carregar o dashboard, ou via cron/edge function futuramente.
 */
export async function atualizarParcelasAtrasadas() {
  const hoje = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('parcelas')
    .update({ status: 'atrasado' })
    .lt('data_vencimento', hoje)
    .in('status', ['pendente']);

  if (error) throw new Error(`Erro ao atualizar parcelas atrasadas: ${error.message}`);
}
