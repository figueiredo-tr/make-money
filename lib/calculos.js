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

function arredondar(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
