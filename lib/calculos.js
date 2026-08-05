/**
 * Funções de cálculo financeiro do sistema de empréstimos.
 * Taxa de juros é sempre em % ao mês (ex: 5 = 5% a.m.)
 */

/**
 * Calcula o valor total a pagar com juros SIMPLES.
 * Fórmula: M = P * (1 + i * n)
 * @param {number} principal - valor emprestado
 * @param {number} taxaMensal - taxa em % (ex: 5 para 5%)
 * @param {number} numeroParcelas - quantidade de meses/parcelas
 * @returns {number} valor total (principal + juros)
 */
export function calcularMontanteJurosSimples(principal, taxaMensal, numeroParcelas) {
  const i = taxaMensal / 100;
  const montante = principal * (1 + i * numeroParcelas);
  return arredondar(montante);
}

/**
 * Calcula o valor total a pagar com juros COMPOSTO.
 * Fórmula: M = P * (1 + i)^n
 * @param {number} principal
 * @param {number} taxaMensal - taxa em % (ex: 5 para 5%)
 * @param {number} numeroParcelas
 * @returns {number} valor total (principal + juros)
 */
export function calcularMontanteJurosComposto(principal, taxaMensal, numeroParcelas) {
  const i = taxaMensal / 100;
  const montante = principal * Math.pow(1 + i, numeroParcelas);
  return arredondar(montante);
}

/**
 * Calcula o valor de cada parcela (divisão igual do montante total).
 * @param {number} principal
 * @param {number} taxaMensal
 * @param {number} numeroParcelas
 * @param {'simples'|'composto'} tipoJuros
 * @returns {{ montanteTotal: number, valorParcela: number, totalJuros: number }}
 */
export function calcularParcela(principal, taxaMensal, numeroParcelas, tipoJuros = 'simples') {
  const montanteTotal =
    tipoJuros === 'composto'
      ? calcularMontanteJurosComposto(principal, taxaMensal, numeroParcelas)
      : calcularMontanteJurosSimples(principal, taxaMensal, numeroParcelas);

  const valorParcela = arredondar(montanteTotal / numeroParcelas);
  const totalJuros = arredondar(montanteTotal - principal);

  return { montanteTotal, valorParcela, totalJuros };
}

/**
 * Arredonda para 2 casas decimais (evita problema de ponto flutuante).
 */
function arredondar(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
