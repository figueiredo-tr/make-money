-- ============================================================
-- MIGRATION 006 — Nome no perfil + tela "Meu Perfil"
-- Responsável: Conta A
-- ============================================================

-- 1. Campo nome (opcional — se vazio, o app cai no e-mail como exibição)
alter table perfis add column if not exists nome text;

-- ------------------------------------------------------------
-- 2. Permitir que o usuário edite o PRÓPRIO perfil (hoje só existia SELECT)
-- ------------------------------------------------------------
drop policy if exists "update_own_perfil" on perfis;
create policy "update_own_perfil" on perfis
  for update using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- ------------------------------------------------------------
-- 3. Trigger de segurança: mesmo com a policy acima, ninguém
-- (exceto admin) pode alterar o PRÓPRIO role ou contratante_id.
-- Sem isso, um usuário mal-intencionado poderia dar UPDATE em si
-- mesmo e virar admin. A policy garante QUEM pode dar update;
-- esse trigger garante O QUE pode ser alterado nesse update.
-- ------------------------------------------------------------
create or replace function proteger_campos_sensiveis_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    new.role := old.role;
    new.contratante_id := old.contratante_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_perfis_protect on perfis;
create trigger trg_perfis_protect
  before update on perfis
  for each row execute function proteger_campos_sensiveis_perfil();