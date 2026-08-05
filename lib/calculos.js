/**
 * Funções de cálculo financeiro do sistema de empréstimos.
 * Taxa de juros é sempre em % ao mês (ex: 5 = 5% a.m.)
 */

export function calcularMontanteJurosSimples(
  principal,
  taxaMensal,
  numeroParcelas,
) {
  const i = taxaMensal / 100;
  const montante = principal * (1 + i * numeroParcelas);
  return arredondar(montante);
}

export function calcularMontanteJurosComposto(
  principal,
  taxaMensal,
  numeroParcelas,
) {
  const i = taxaMensal / 100;
  const montante = principal * Math.pow(1 + i, numeroParcelas);
  return arredondar(montante);
}

/**
 * Juros FIXO: taxa aplicada uma única vez sobre o principal,
 * independente do número de parcelas.
 */
export function calcularMontanteJurosFixo(principal, taxaSobreValor) {
  const i = taxaSobreValor / 100;
  const montante = principal * (1 + i);
  return arredondar(montante);
}

export function calcularParcela(
  principal,
  taxa,
  numeroParcelas,
  tipoJuros = "simples",
) {
  let montanteTotal;
  if (tipoJuros === "composto") {
    montanteTotal = calcularMontanteJurosComposto(
      principal,
      taxa,
      numeroParcelas,
    );
  } else if (tipoJuros === "fixo") {
    montanteTotal = calcularMontanteJurosFixo(principal, taxa);
  } else {
    montanteTotal = calcularMontanteJurosSimples(
      principal,
      taxa,
      numeroParcelas,
    );
  }

  const valorParcela = arredondar(montanteTotal / numeroParcelas);
  const totalJuros = arredondar(montanteTotal - principal);

  return { montanteTotal, valorParcela, totalJuros };
}

/**
 * Calcula o juros acumulado por atraso sobre o valor restante de uma parcela.
 * @param {number} valorRestante
 * @param {number} taxaDiaria - % ao dia
 * @param {number} diasAtraso
 */
export function calcularJurosAtraso(valorRestante, taxaDiaria, diasAtraso) {
  if (!valorRestante || !taxaDiaria || !diasAtraso || diasAtraso <= 0) return 0;
  return arredondar(valorRestante * (taxaDiaria / 100) * diasAtraso);
}

/**
 * Dias corridos entre uma data de vencimento (ISO) e hoje. 0 se não atrasado.
 */
export function diasEmAtraso(dataVencimentoISO) {
  const hoje = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00');
  const vencimento = new Date(dataVencimentoISO + 'T00:00:00');
  const diffMs = hoje - vencimento;
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return dias > 0 ? dias : 0;
}

function arredondar(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
