const LABELS = {
  ativo: 'Em aberto',
  quitado: 'Quitado',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
  pendente: 'Pendente',
  pago: 'Pago',
  parcial: 'Parcial',
};

export default function Seal({ status, label }) {
  const key = LABELS[status] ? status : 'pendente';
  return (
    <span className={`seal seal-${key}`}>
      <span className="seal-dot" />
      {label || LABELS[key] || status}
    </span>
  );
}
