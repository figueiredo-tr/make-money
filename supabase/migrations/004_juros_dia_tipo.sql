-- ============================================================
-- MIGRATION 004 — juros ao dia: percentual ou valor fixo
-- Responsável: Conta C
-- ============================================================

alter table emprestimos
  add column if not exists juros_dia_tipo text not null default 'percentual'
  check (juros_dia_tipo in ('percentual', 'valor'));
