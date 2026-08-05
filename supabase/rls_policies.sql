-- ============================================================
-- RLS POLICIES - Sistema de Gestão de Empréstimos
-- Acesso restrito: só usuários autenticados (você + cliente)
-- NÃO existe cadastro público — usuários são criados manualmente
-- no painel do Supabase (Authentication > Users > Invite user)
-- ============================================================

alter table clientes enable row level security;
alter table emprestimos enable row level security;
alter table parcelas enable row level security;
alter table pagamentos enable row level security;

-- Como só existem 2 usuários confiáveis (você e o dono do dinheiro),
-- a regra é simples: qualquer usuário autenticado pode ler/escrever tudo.
-- Isso evita complexidade desnecessária de multi-tenant.

-- CLIENTES
create policy "authenticated_select_clientes" on clientes
  for select using (auth.role() = 'authenticated');
create policy "authenticated_insert_clientes" on clientes
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated_update_clientes" on clientes
  for update using (auth.role() = 'authenticated');
create policy "authenticated_delete_clientes" on clientes
  for delete using (auth.role() = 'authenticated');

-- EMPRESTIMOS
create policy "authenticated_select_emprestimos" on emprestimos
  for select using (auth.role() = 'authenticated');
create policy "authenticated_insert_emprestimos" on emprestimos
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated_update_emprestimos" on emprestimos
  for update using (auth.role() = 'authenticated');
create policy "authenticated_delete_emprestimos" on emprestimos
  for delete using (auth.role() = 'authenticated');

-- PARCELAS
create policy "authenticated_select_parcelas" on parcelas
  for select using (auth.role() = 'authenticated');
create policy "authenticated_insert_parcelas" on parcelas
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated_update_parcelas" on parcelas
  for update using (auth.role() = 'authenticated');
create policy "authenticated_delete_parcelas" on parcelas
  for delete using (auth.role() = 'authenticated');

-- PAGAMENTOS
create policy "authenticated_select_pagamentos" on pagamentos
  for select using (auth.role() = 'authenticated');
create policy "authenticated_insert_pagamentos" on pagamentos
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated_update_pagamentos" on pagamentos
  for update using (auth.role() = 'authenticated');
create policy "authenticated_delete_pagamentos" on pagamentos
  for delete using (auth.role() = 'authenticated');

-- ============================================================
-- Como criar os 2 usuários (você faz manualmente no Supabase):
-- Dashboard > Authentication > Users > Add user > Create new user
-- Marque "Auto Confirm User" pra não precisar de e-mail de confirmação.
-- ============================================================
