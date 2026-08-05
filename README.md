# make-money — Sistema de Gestão de Empréstimos

Sistema interno (acesso restrito) para controle de clientes, empréstimos, parcelas e pagamentos.

## Stack
- Next.js 14 (App Router)
- Supabase (Postgres + Auth)
- Tailwind CSS
- Deploy: Vercel

## Setup local

```bash
npm install
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Setup do banco (Supabase)

1. Crie um projeto novo no [Supabase](https://supabase.com).
2. No SQL Editor, rode nessa ordem:
   - `supabase/schema.sql`
   - `supabase/rls_policies.sql`
3. Em **Authentication > Users**, crie manualmente os 2 usuários (você e o cliente), marcando "Auto Confirm User". Não há cadastro público.
4. Copie a URL e a anon key do projeto em **Settings > API** pro `.env.local`.

## Estrutura

```
app/            → páginas (Next.js App Router)
components/     → componentes reutilizáveis de UI
lib/            → lógica de negócio (cálculos, supabase client, etc)
supabase/       → schema SQL e RLS policies
```

## Organização do trabalho (3 contas Claude)

Ver `STATUS.md` para o estado atual de cada frente e o que falta fazer.
