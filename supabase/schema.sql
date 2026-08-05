-- ============================================================
-- SCHEMA - Sistema de Gestão de Empréstimos
-- Projeto: make-money
-- Responsável: Conta A (Backend & Dados)
--
-- Este arquivo reflete o schema-base. Alterações incrementais em
-- produção ficam registradas em supabase/migrations/*.sql — ao
-- provisionar um banco novo, rode este arquivo e depois as
-- migrations em ordem.
-- ============================================================

-- Extensão para gerar UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- TABELA: clientes
-- Clientes que tomam empréstimo (NÃO são usuários do sistema)
-- ============================================================
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text unique,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- ============================================================
-- TABELA: emprestimos
-- Um cliente pode ter vários empréstimos
-- ============================================================
create table if not exists emprestimos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  valor_principal numeric(12,2) not null check (valor_principal > 0),
  taxa_juros numeric(6,3) not null check (taxa_juros >= 0), -- em % ao mês
  tipo_juros text not null default 'simples' check (tipo_juros in ('simples','composto','fixo')),
  periodicidade text not null default 'mensal' check (periodicidade in ('mensal','semanal')),
  juros_dia numeric(6,3) not null default 0 check (juros_dia >= 0), -- % ao dia OU R$ ao dia, conforme juros_dia_tipo
  juros_dia_tipo text not null default 'percentual' check (juros_dia_tipo in ('percentual','valor')),
  numero_parcelas int not null check (numero_parcelas > 0),
  data_inicio date not null default current_date,
  data_primeiro_vencimento date not null,
  status text not null default 'ativo' check (status in ('ativo','quitado','atrasado','cancelado')),
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create index if not exists idx_emprestimos_cliente on emprestimos(cliente_id);
create index if not exists idx_emprestimos_status on emprestimos(status);

-- ============================================================
-- TABELA: parcelas
-- Geradas automaticamente ao criar um empréstimo (via app, Conta A cuida da lógica em lib/parcelas.js)
-- ============================================================
create table if not exists parcelas (
  id uuid primary key default gen_random_uuid(),
  emprestimo_id uuid not null references emprestimos(id) on delete cascade,
  numero_parcela int not null,
  valor_previsto numeric(12,2) not null,
  data_vencimento date not null,
  status text not null default 'pendente' check (status in ('pendente','pago','atrasado','parcial')),
  valor_pago numeric(12,2) default 0,
  data_pagamento date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (emprestimo_id, numero_parcela)
);

create index if not exists idx_parcelas_emprestimo on parcelas(emprestimo_id);
create index if not exists idx_parcelas_status on parcelas(status);
create index if not exists idx_parcelas_vencimento on parcelas(data_vencimento);

-- ============================================================
-- TABELA: pagamentos
-- Histórico de pagamentos (uma parcela pode ter mais de um pagamento parcial)
-- ============================================================
create table if not exists pagamentos (
  id uuid primary key default gen_random_uuid(),
  parcela_id uuid not null references parcelas(id) on delete cascade,
  valor numeric(12,2) not null check (valor > 0),
  data_pagamento date not null default current_date,
  forma_pagamento text, -- pix, dinheiro, transferencia, etc
  observacoes text,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create index if not exists idx_pagamentos_parcela on pagamentos(parcela_id);

-- ============================================================
-- TRIGGER: atualizar updated_at automaticamente
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_clientes_updated_at before update on clientes
  for each row execute function set_updated_at();

create trigger trg_emprestimos_updated_at before update on emprestimos
  for each row execute function set_updated_at();

create trigger trg_parcelas_updated_at before update on parcelas
  for each row execute function set_updated_at();
