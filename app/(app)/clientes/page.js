'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import Card from '@/components/ui/Card';
import Seal from '@/components/ui/Seal';

function formatBRL(value) {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const { data, error } = await supabase
        .from('clientes_com_saldo')
        .select('*')
        .order('nome', { ascending: true });

      if (error) setErro(error.message);
      else setClientes(data || []);

      setCarregando(false);
    }
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientes;
    return clientes.filter(
      (c) => c.nome?.toLowerCase().includes(termo) || c.telefone?.toLowerCase().includes(termo)
    );
  }, [clientes, busca]);

  return (
    <div className="px-8 py-8 max-w-6xl">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-1">Livro de associados</p>
          <h1 className="font-display italic text-3xl text-ink">Associados</h1>
        </div>
        <Link href="/clientes/novo" className="btn btn-primary">
          + Novo associado
        </Link>
      </header>

      <div className="mb-5">
        <input
          className="input max-w-xs"
          placeholder="Buscar por nome ou telefone…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {erro && (
        <p className="text-sm text-wine bg-wine/10 border border-wine/30 rounded-sm px-3 py-2 mb-6">
          Erro ao carregar dados: {erro}
        </p>
      )}

      <Card>
        {carregando ? (
          <p className="text-sm text-faint py-4">Carregando…</p>
        ) : filtrados.length === 0 ? (
          <p className="text-sm text-faint py-4">
            {busca ? 'Nenhum associado encontrado para essa busca.' : 'Nenhum associado cadastrado ainda.'}
          </p>
        ) : (
          <table className="ledger">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Empréstimos</th>
                <th>Saldo devedor</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.cliente_id}>
                  <td className="text-ink">{c.nome}</td>
                  <td className="font-mono text-muted">{c.telefone || '—'}</td>
                  <td className="font-mono text-muted">{c.total_emprestimos}</td>
                  <td className="font-mono">{formatBRL(c.saldo_devedor)}</td>
                  <td>
                    {c.parcelas_atrasadas > 0 ? (
                      <Seal status="atrasado" label={`${c.parcelas_atrasadas} em atraso`} />
                    ) : c.saldo_devedor > 0 ? (
                      <Seal status="ativo" />
                    ) : (
                      <Seal status="quitado" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
