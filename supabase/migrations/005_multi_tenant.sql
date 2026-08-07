-- ============================================================
-- MIGRATION 005 — Multi-tenant (Contratantes)
-- Responsável: Conta A
--
-- IMPORTANTE: antes de rodar, leia até o final. Tem 2 passos manuais
-- (trocar e-mails de placeholder) que você precisa ajustar antes de rodar
-- a última parte deste arquivo.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabela de contratantes (cada cliente seu vira um registro aqui)
-- ------------------------------------------------------------
create table if not exists contratantes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. Tabela de perfis (liga cada usuário do Auth a um contratante, ou marca admin)
-- ------------------------------------------------------------
create table if not exists perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'contratante' check (role in ('admin','contratante')),
  contratante_id uuid references contratantes(id),
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 3. Colunas de vínculo nas tabelas existentes
-- ------------------------------------------------------------
alter table clientes add column if not exists contratante_id uuid references contratantes(id);
alter table emprestimos add column if not exists contratante_id uuid references contratantes(id);

create index if not exists idx_clientes_contratante on clientes(contratante_id);
create index if not exists idx_emprestimos_contratante on emprestimos(contratante_id);

-- ------------------------------------------------------------
-- 4. Funções auxiliares para as políticas de RLS
-- (security definer = ignoram RLS internamente, evita recursão infinita)
-- ------------------------------------------------------------
create or replace function current_contratante_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select contratante_id from perfis where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from perfis where id = auth.uid()), false);
$$;

-- ------------------------------------------------------------
-- 5. RLS: perfis e contratantes
-- ------------------------------------------------------------
alter table perfis enable row level security;
alter table contratantes enable row level security;

drop policy if exists "select_own_perfil" on perfis;
create policy "select_own_perfil" on perfis
  for select using (id = auth.uid() or is_admin());

drop policy if exists "admin_manage_perfis" on perfis;
create policy "admin_manage_perfis" on perfis
  for all using (is_admin());

drop policy if exists "select_contratantes" on contratantes;
create policy "select_contratantes" on contratantes
  for select using (is_admin() or id = current_contratante_id());

drop policy if exists "admin_manage_contratantes" on contratantes;
create policy "admin_manage_contratantes" on contratantes
  for all using (is_admin());

-- ------------------------------------------------------------
-- 6. RLS: substitui as políticas antigas ("qualquer autenticado vê tudo")
-- por políticas que respeitam o contratante_id
-- ------------------------------------------------------------

-- CLIENTES
drop policy if exists "authenticated_select_clientes" on clientes;
drop policy if exists "authenticated_insert_clientes" on clientes;
drop policy if exists "authenticated_update_clientes" on clientes;
drop policy if exists "authenticated_delete_clientes" on clientes;

create policy "select_clientes" on clientes
  for select using (is_admin() or contratante_id = current_contratante_id());
create policy "insert_clientes" on clientes
  for insert with check (is_admin() or contratante_id = current_contratante_id());
create policy "update_clientes" on clientes
  for update using (is_admin() or contratante_id = current_contratante_id());
create policy "delete_clientes" on clientes
  for delete using (is_admin() or contratante_id = current_contratante_id());

-- EMPRESTIMOS
drop policy if exists "authenticated_select_emprestimos" on emprestimos;
drop policy if exists "authenticated_insert_emprestimos" on emprestimos;
drop policy if exists "authenticated_update_emprestimos" on emprestimos;
drop policy if exists "authenticated_delete_emprestimos" on emprestimos;

create policy "select_emprestimos" on emprestimos
  for select using (is_admin() or contratante_id = current_contratante_id());
create policy "insert_emprestimos" on emprestimos
  for insert with check (is_admin() or contratante_id = current_contratante_id());
create policy "update_emprestimos" on emprestimos
  for update using (is_admin() or contratante_id = current_contratante_id());
create policy "delete_emprestimos" on emprestimos
  for delete using (is_admin() or contratante_id = current_contratante_id());

-- PARCELAS (não tem contratante_id direto — verifica via emprestimo)
drop policy if exists "authenticated_select_parcelas" on parcelas;
drop policy if exists "authenticated_insert_parcelas" on parcelas;
drop policy if exists "authenticated_update_parcelas" on parcelas;
drop policy if exists "authenticated_delete_parcelas" on parcelas;

create policy "select_parcelas" on parcelas
  for select using (
    is_admin() or exists (
      select 1 from emprestimos e
      where e.id = parcelas.emprestimo_id
      and e.contratante_id = current_contratante_id()
    )
  );
create policy "insert_parcelas" on parcelas
  for insert with check (
    is_admin() or exists (
      select 1 from emprestimos e
      where e.id = parcelas.emprestimo_id
      and e.contratante_id = current_contratante_id()
    )
  );
create policy "update_parcelas" on parcelas
  for update using (
    is_admin() or exists (
      select 1 from emprestimos e
      where e.id = parcelas.emprestimo_id
      and e.contratante_id = current_contratante_id()
    )
  );
create policy "delete_parcelas" on parcelas
  for delete using (
    is_admin() or exists (
      select 1 from emprestimos e
      where e.id = parcelas.emprestimo_id
      and e.contratante_id = current_contratante_id()
    )
  );

-- PAGAMENTOS (verifica via parcela -> emprestimo)
drop policy if exists "authenticated_select_pagamentos" on pagamentos;
drop policy if exists "authenticated_insert_pagamentos" on pagamentos;
drop policy if exists "authenticated_update_pagamentos" on pagamentos;
drop policy if exists "authenticated_delete_pagamentos" on pagamentos;

create policy "select_pagamentos" on pagamentos
  for select using (
    is_admin() or exists (
      select 1 from parcelas p
      join emprestimos e on e.id = p.emprestimo_id
      where p.id = pagamentos.parcela_id
      and e.contratante_id = current_contratante_id()
    )
  );
create policy "insert_pagamentos" on pagamentos
  for insert with check (
    is_admin() or exists (
      select 1 from parcelas p
      join emprestimos e on e.id = p.emprestimo_id
      where p.id = pagamentos.parcela_id
      and e.contratante_id = current_contratante_id()
    )
  );

-- ------------------------------------------------------------
-- 7. Atualiza views existentes pra expor contratante_id
-- (necessário pra tela admin conseguir filtrar por contratante)
-- ------------------------------------------------------------
create or replace view clientes_com_saldo as
select
  c.id as cliente_id,
  c.contratante_id,
  c.nome,
  c.telefone,
  c.ativo,
  count(distinct e.id) as total_emprestimos,
  coalesce(sum(p.valor_previsto - p.valor_pago) filter (where p.status in ('pendente','atrasado','parcial')), 0) as saldo_devedor,
  count(p.id) filter (where p.status = 'atrasado') as parcelas_atrasadas
from clientes c
left join emprestimos e on e.cliente_id = c.id
left join parcelas p on p.emprestimo_id = e.id
group by c.id, c.contratante_id, c.nome, c.telefone, c.ativo;

alter view clientes_com_saldo set (security_invoker = true);

-- Função pra admin pegar o resumo de UM contratante específico (a view
-- resumo_geral soma tudo que o RLS deixar ver, o que pra admin é o
-- sistema inteiro — essa função filtra por contratante sob demanda)
create or replace function resumo_por_contratante(p_contratante_id uuid)
returns table (
  total_emprestado numeric,
  total_a_receber numeric,
  total_recebido numeric,
  emprestimos_ativos bigint,
  emprestimos_quitados bigint,
  parcelas_atrasadas bigint,
  valor_total_atrasado numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Acesso negado: só admin pode consultar resumo de outro contratante';
  end if;

  return query
  select
    coalesce(sum(e.valor_principal) filter (where e.status != 'cancelado'), 0),
    coalesce((
      select sum(p.valor_previsto - p.valor_pago)
      from parcelas p join emprestimos e2 on e2.id = p.emprestimo_id
      where p.status in ('pendente','atrasado','parcial') and e2.contratante_id = p_contratante_id
    ), 0),
    coalesce((
      select sum(pg.valor) from pagamentos pg
      join parcelas p on p.id = pg.parcela_id
      join emprestimos e3 on e3.id = p.emprestimo_id
      where e3.contratante_id = p_contratante_id
    ), 0),
    count(*) filter (where e.status = 'ativo'),
    count(*) filter (where e.status = 'quitado'),
    (select count(*) from parcelas p join emprestimos e4 on e4.id = p.emprestimo_id where p.status = 'atrasado' and e4.contratante_id = p_contratante_id),
    coalesce((
      select sum(p.valor_previsto - p.valor_pago) from parcelas p
      join emprestimos e5 on e5.id = p.emprestimo_id
      where p.status = 'atrasado' and e5.contratante_id = p_contratante_id
    ), 0)
  from emprestimos e
  where e.contratante_id = p_contratante_id;
end;
$$;

-- Só admin pode chamar essa função (checagem interna, não depende de RLS de tabela)
revoke all on function resumo_por_contratante(uuid) from public;
grant execute on function resumo_por_contratante(uuid) to authenticated;

-- ============================================================
-- 8. BACKFILL — PASSO MANUAL, EDITE ANTES DE RODAR
--
-- O cliente atual (Água... não, o cliente de empréstimos) precisa virar
-- o primeiro registro em `contratantes`, e os dados que já existem
-- (associados/empréstimos cadastrados) precisam ser vinculados a ele.
-- Depois, os 2 usuários que já existem no Auth precisam virar registros
-- em `perfis` (um admin = você, um contratante = seu cliente).
-- ============================================================

-- 7a. Cria o contratante do cliente atual (troque o nome se quiser)
insert into contratantes (nome) values ('Cliente Atual - Libretto')
returning id; -- ANOTE o id retornado, vai usar abaixo

-- 7b. Backfill dos dados existentes (troque 'COLE-O-ID-AQUI' pelo id retornado acima)
-- update clientes set contratante_id = 'COLE-O-ID-AQUI' where contratante_id is null;
-- update emprestimos set contratante_id = 'COLE-O-ID-AQUI' where contratante_id is null;

-- 7c. Cria os perfis (troque os e-mails pelos que vocês realmente usam)
-- Descobre o id de cada usuário:
-- select id, email from auth.users;

-- Depois, com os ids em mãos:
-- insert into perfis (id, role) values ('SEU-USER-ID-AQUI', 'admin');
-- insert into perfis (id, role, contratante_id) values ('ID-DO-CLIENTE-AQUI', 'contratante', 'COLE-O-ID-DO-CONTRATANTE-AQUI');

-- ============================================================
-- 8. Depois do backfill, torna as colunas obrigatórias (rode por último,
-- só depois de confirmar que TODOS os registros têm contratante_id preenchido)
-- ============================================================
-- alter table clientes alter column contratante_id set not null;
-- alter table emprestimos alter column contratante_id set not null;