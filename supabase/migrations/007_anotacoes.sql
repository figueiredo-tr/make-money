-- ============================================================
-- MIGRATION 007 — Anotações livres por associado
-- Responsável: Conta A
-- ============================================================

create table if not exists anotacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  texto text not null,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create index if not exists idx_anotacoes_cliente on anotacoes(cliente_id);

alter table anotacoes enable row level security;

-- Mesma regra de isolamento das outras tabelas: vê/edita se for do
-- próprio contratante (via cliente), ou se for admin.
create policy "select_anotacoes" on anotacoes
  for select using (
    is_admin() or exists (
      select 1 from clientes c
      where c.id = anotacoes.cliente_id
      and c.contratante_id = current_contratante_id()
    )
  );

create policy "insert_anotacoes" on anotacoes
  for insert with check (
    is_admin() or exists (
      select 1 from clientes c
      where c.id = anotacoes.cliente_id
      and c.contratante_id = current_contratante_id()
    )
  );

create policy "delete_anotacoes" on anotacoes
  for delete using (
    is_admin() or exists (
      select 1 from clientes c
      where c.id = anotacoes.cliente_id
      and c.contratante_id = current_contratante_id()
    )
  );

-- Sem UPDATE de propósito: anotação é um registro histórico ("bloco de
-- notas"), faz mais sentido adicionar uma nova do que editar uma antiga.
-- Se precisar corrigir, exclui e cria de novo (mantém rastro do que mudou).