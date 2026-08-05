-- ============================================================
-- VIEWS - Resumo financeiro para o dashboard
-- Responsável: Conta A
-- ============================================================

-- ------------------------------------------------------------
-- VIEW: resumo_geral
-- Números agregados do negócio inteiro (pra cards do dashboard)
-- ------------------------------------------------------------
create or replace view resumo_geral as
select
  -- total já emprestado (soma do principal de todos os empréstimos ativos/quitados)
  coalesce(sum(e.valor_principal) filter (where e.status != 'cancelado'), 0) as total_emprestado,

  -- total previsto a receber (soma de todas as parcelas em aberto, pendente + atrasado)
  coalesce((
    select sum(p.valor_previsto - p.valor_pago)
    from parcelas p
    join emprestimos e2 on e2.id = p.emprestimo_id
    where p.status in ('pendente', 'atrasado', 'parcial')
      and e2.status != 'cancelado'
  ), 0) as total_a_receber,

  -- total já recebido (histórico de pagamentos)
  coalesce((select sum(valor) from pagamentos), 0) as total_recebido,

  -- quantidade de empréstimos ativos
  count(*) filter (where e.status = 'ativo') as emprestimos_ativos,

  -- quantidade de empréstimos quitados
  count(*) filter (where e.status = 'quitado') as emprestimos_quitados,

  -- quantidade de parcelas atrasadas (proxy de inadimplência)
  (select count(*) from parcelas where status = 'atrasado') as parcelas_atrasadas,

  -- valor total em atraso
  coalesce((
    select sum(valor_previsto - valor_pago)
    from parcelas
    where status = 'atrasado'
  ), 0) as valor_total_atrasado

from emprestimos e;

-- ------------------------------------------------------------
-- VIEW: clientes_com_saldo
-- Situação de cada cliente (quanto deve, quantas parcelas em atraso)
-- Útil pra listagem/tabela de clientes com indicador de risco
-- ------------------------------------------------------------
create or replace view clientes_com_saldo as
select
  c.id as cliente_id,
  c.nome,
  c.telefone,
  c.ativo,
  count(distinct e.id) as total_emprestimos,
  coalesce(sum(p.valor_previsto - p.valor_pago) filter (where p.status in ('pendente','atrasado','parcial')), 0) as saldo_devedor,
  count(p.id) filter (where p.status = 'atrasado') as parcelas_atrasadas
from clientes c
left join emprestimos e on e.cliente_id = c.id
left join parcelas p on p.emprestimo_id = e.id
group by c.id, c.nome, c.telefone, c.ativo;

-- ------------------------------------------------------------
-- VIEW: proximos_vencimentos
-- Parcelas que vencem nos próximos 7 dias (útil pra alertas)
-- ------------------------------------------------------------
create or replace view proximos_vencimentos as
select
  p.id as parcela_id,
  p.numero_parcela,
  p.valor_previsto,
  p.valor_pago,
  p.data_vencimento,
  p.status,
  e.id as emprestimo_id,
  c.id as cliente_id,
  c.nome as cliente_nome,
  c.telefone as cliente_telefone
from parcelas p
join emprestimos e on e.id = p.emprestimo_id
join clientes c on c.id = e.cliente_id
where p.status in ('pendente', 'atrasado')
  and p.data_vencimento <= current_date + interval '7 days'
order by p.data_vencimento asc;

-- ============================================================
-- Views herdam RLS das tabelas base — não precisa de policy própria,
-- mas por segurança em algumas versões do Postgres/Supabase é bom
-- garantir security_invoker (usa permissão de quem consulta, não do dono da view).
-- ============================================================
alter view resumo_geral set (security_invoker = true);
alter view clientes_com_saldo set (security_invoker = true);
alter view proximos_vencimentos set (security_invoker = true);
