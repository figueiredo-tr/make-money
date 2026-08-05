-- ============================================================
-- MIGRATION 002 — periodicidade semanal/mensal + juros fixo
-- Responsável: Conta B
-- Já executada manualmente no Supabase de produção em 05/08/2026.
-- Este arquivo registra no repositório o SQL que já rodou lá,
-- pra manter schema.sql (schema-base) em sincronia com a realidade.
-- ============================================================

alter table emprestimos
  add column if not exists periodicidade text not null default 'mensal'
  check (periodicidade in ('mensal', 'semanal'));

alter table emprestimos
  drop constraint if exists emprestimos_tipo_juros_check;

alter table emprestimos
  add constraint emprestimos_tipo_juros_check
  check (tipo_juros in ('simples', 'composto', 'fixo'));
