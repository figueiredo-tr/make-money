// Script de teste manual — valida o fluxo: cliente -> empréstimo -> parcelas
// Rodar com: node scripts/test-parcelas.mjs
// (lê NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY do .env.local)

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Carrega .env.local manualmente (sem depender do Next.js)
const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
for (const line of envFile.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('1. Criando cliente de teste...');
  const { data: cliente, error: erroCliente } = await supabase
    .from('clientes')
    .insert({ nome: 'Cliente Teste', cpf: '000.000.000-00', telefone: '31999999999' })
    .select()
    .single();

  if (erroCliente) throw new Error(`Erro ao criar cliente: ${erroCliente.message}`);
  console.log('   OK ->', cliente.id);

  console.log('2. Criando empréstimo de teste (R$ 1000, 5% a.m., 3 parcelas, juros simples)...');
  const { data: emprestimo, error: erroEmprestimo } = await supabase
    .from('emprestimos')
    .insert({
      cliente_id: cliente.id,
      valor_principal: 1000,
      taxa_juros: 5,
      tipo_juros: 'simples',
      numero_parcelas: 3,
      data_primeiro_vencimento: '2026-09-01',
    })
    .select()
    .single();

  if (erroEmprestimo) throw new Error(`Erro ao criar empréstimo: ${erroEmprestimo.message}`);
  console.log('   OK ->', emprestimo.id);

  console.log('3. Gerando parcelas...');
  const { data: parcelas, error: erroParcelas } = await supabase
    .from('parcelas')
    .insert(
      Array.from({ length: 3 }, (_, i) => ({
        emprestimo_id: emprestimo.id,
        numero_parcela: i + 1,
        valor_previsto: 383.33, // (1000 * 1.15) / 3 aprox.
        data_vencimento: `2026-${String(9 + i).padStart(2, '0')}-01`,
        status: 'pendente',
      }))
    )
    .select();

  if (erroParcelas) throw new Error(`Erro ao gerar parcelas: ${erroParcelas.message}`);
  console.log('   OK ->', parcelas.length, 'parcelas criadas');
  console.table(parcelas.map((p) => ({ numero: p.numero_parcela, valor: p.valor_previsto, vencimento: p.data_vencimento })));

  console.log('\n✅ Fluxo completo funcionando! Pode conferir no Table Editor do Supabase.');
  console.log('   (Esses dados são de teste — pode apagar depois pelo Table Editor.)');
}

main().catch((err) => {
  console.error('\n❌ Erro no teste:', err.message);
  process.exit(1);
});
