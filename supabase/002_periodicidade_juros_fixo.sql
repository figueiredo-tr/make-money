alter table emprestimos
  add column if not exists periodicidade text not null default 'mensal'
  check (periodicidade in ('mensal', 'semanal'));

alter table emprestimos
  drop constraint if exists emprestimos_tipo_juros_check;

alter table emprestimos
  add constraint emprestimos_tipo_juros_check
  check (tipo_juros in ('simples', 'composto', 'fixo'));