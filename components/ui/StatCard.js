import Card from './Card';

function formatBRL(value) {
  return (value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function StatCard({ label, value, format = 'currency', tone = 'default' }) {
  const display = format === 'currency' ? formatBRL(value) : value;

  const toneClass =
    tone === 'wine' ? 'text-wine' : tone === 'gold' ? 'text-gold' : tone === 'sage' ? 'text-sage' : 'text-ink';

  return (
    <Card>
      <p className="eyebrow mb-3">{label}</p>
      <p className={`font-mono text-2xl font-medium ${toneClass}`}>{display}</p>
    </Card>
  );
}
