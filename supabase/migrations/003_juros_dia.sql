-- ============================================================
-- MIGRATION 003 — juros ao dia por atraso
-- Responsável: Conta C
-- ============================================================

alter table emprestimos
  add column if not exists juros_dia numeric(6,3) not null default 0
  check (juros_dia >= 0);
