# STATUS DO PROJETO — make-money

> Atualize este arquivo SEMPRE antes de encerrar uma sessão (limite de uso atingido).
> Ao abrir uma conta nova, cole o conteúdo deste arquivo como primeira mensagem pra ela pegar contexto rápido.

Última atualização: 07/08/2026 — Conta A

---

## 🎨 Diretriz de tema visual

Identidade "Libretto" aplicada em todas as telas, incluindo a ficha de cliente e parcelas. Ver `app/globals.css` e `tailwind.config.js`.

---

## 🏢 MULTI-TENANT (Contratantes) — TESTADO E FUNCIONANDO EM PRODUÇÃO

**Decisão de produto:** o Libretto deixou de ser "1 sistema por cliente" e virou produto vendável pra vários clientes de empréstimo ao mesmo tempo, cada um isolado dos outros. O usuário (Figueiredo) é o único `admin`, com visão de todos.

**Modelo implementado e validado (Conta A):**

- Tabela `contratantes` (cada cliente do Figueiredo é 1 registro) — primeiro registro criado: `cd434aee-a6ae-484c-81e7-44bda8e15d74` ("Cliente Atual - Libretto"), com os associados/empréstimos pré-existentes já migrados pra ele
- Tabela `perfis` (liga cada usuário do Auth a um `contratante_id`, ou marca `role = 'admin'`) — Figueiredo é `admin`
- `clientes` e `emprestimos` com coluna `contratante_id` preenchida
- RLS reescrito em `clientes`, `emprestimos`, `parcelas`, `pagamentos` — isolamento por contratante confirmado
- Views atualizadas (`clientes_com_saldo` com `contratante_id`) + função `resumo_por_contratante(uuid)` (só admin chama)
- Tela `/admin` (lista contratantes) e `/admin/[id]` (visão read-only: resumo financeiro + tabela de associados) — só aparece na sidebar pra `role = 'admin'`
- `lib/perfil.js` — `getPerfilAtual()` / `isAdminAtual()` / `listarContratantes()` / `criarContratante()`
- Migration: `supabase/migrations/005_multi_tenant.sql` — **rodada com sucesso no Supabase de produção**

**✅ Teste end-to-end feito e confirmado (07/08):**

- Criado usuário de teste (`teste@libretto.com`) vinculado ao mesmo `contratante_id` dos dados antigos → logou e viu exatamente os 2 associados esperados (Cliente Teste, Emílio Gaviria), com saldo devedor e situação corretos
- Login como admin (Figueiredo) → aba "Admin" aparece na sidebar → `/admin` lista o contratante → `/admin/[id]` mostra resumo + associados corretamente
- Isolamento RLS confirmado funcionando como esperado

**Pendências conhecidas (não bloqueiam uso, mas ficam registradas):**

- [ ] Apagar o usuário de teste (`teste@libretto.com`, id `02ab023a-2567-422e-b356-e567a44bd98b`) do Supabase Auth e a linha correspondente em `perfis` — só serviu pro teste
- [ ] **Não existe fluxo de UI pra criar um contratante novo end-to-end ainda.** Hoje, pra cada novo cliente fechado, o processo é manual: `insert into contratantes` (SQL ou `criarContratante()`) → criar usuário no Supabase Auth manualmente → `insert into perfis` linkando os dois. Fica como melhoria futura (tela admin de "novo contratante" automatizando os 3 passos)
- [ ] `BottomNav.js` (mobile) não tem item "Admin" de propósito (só o Figueiredo usa, e ficaria apertado com 5 itens) — acesso admin só pela sidebar de desktop por enquanto
- [ ] Tela `/admin/[id]` é só leitura — se precisar editar/excluir associado de um contratante específico pelo admin, ainda não existe (decisão consciente de escopo)
- [ ] Rodar a seção 8 da migration (torna `contratante_id` `not null` em `clientes`/`emprestimos`) é opcional — ainda não foi feita, reforça integridade mas não é obrigatória pro funcionamento

**Nota técnica importante pra quem for rodar migrations no futuro:** o SQL Editor do Supabase roda o script inteiro dentro de **uma única transação** — se qualquer statement falhar no meio, TUDO antes dele nessa mesma execução é desfeito (rollback), mesmo que tivesse rodado sem erro. Se der erro no meio de uma migration grande, sempre re-rodar o bloco inteiro do zero, não só a parte que falhou.

---

## 📱 PWA (app instalável)

- [x] Ícone definitivo, favicon (`app/icon.png`, `app/apple-icon.png`), PWA icons e manifest — tudo funcionando, instalação testada
- [x] Navegação mobile (BottomNav + Sidebar responsiva) — testado e funcionando
- [x] Tabelas com scroll horizontal (`.table-scroll`) — corrigido e funcionando

**Ainda falta:**

- [ ] Trocar nome do projeto na Vercel de `make-m0n3yy` pra `libretto`

---

## 🅰️ CONTA A — Backend & Dados

**Status: concluído.** Schema, RLS, cálculos de juros (simples/composto/fixo), geração de parcelas, PWA, navegação mobile, scroll de tabelas, e agora **multi-tenant completo e validado em produção**.

---

## 🅱️ CONTA B — Frontend & UI

**Status: concluído e em produção.** Ficha do associado, combobox de cliente, modal de pagamento compartilhado, favicon/ícone definitivo.

**Falta fazer:**

- [ ] Teste end-to-end completo em produção (fluxo normal, fora do multi-tenant)
- [ ] Com o multi-tenant ativo, revisar se alguma tela faz alguma query "solta" que não passe pela sessão autenticada normalmente (RLS agora é restritivo por padrão)

---

## 🅲️ CONTA C — Integração, Regras de Negócio & Deploy

**Status: em andamento.** Editar/excluir associado, editar empréstimo (com trava de campos se já tem parcela paga), juros por atraso (percentual/valor fixo), deploy funcionando.

**Falta fazer:**

- [ ] Teste end-to-end (fluxo completo cliente → empréstimo → parcelas → pagamento)
- [ ] Testar editar/excluir associado e editar empréstimo com o multi-tenant ativo (não deveria precisar mudar código, RLS é transparente, mas testar mesmo assim)
- [ ] Trocar nome do projeto na Vercel pra `libretto`
- [ ] Rodar migrations `003` e `004` no Supabase se ainda não rodou

---

## Regras gerais pra todas as contas

1. Sempre `git pull` antes de começar a trabalhar.
2. Mexer só na sua área evita conflito de merge — se precisar cruzar pra área de outra conta, registrar aqui claramente o que mudou e por quê. Mudança de schema (mesmo pequena) sempre precisa de um arquivo em `supabase/migrations/`, mesmo que já tenha sido rodada manualmente no Supabase.
3. Commits pequenos e frequentes, com mensagens claras.
4. Antes de parar, atualizar a seção correspondente aqui no STATUS.md.
5. **Ao rodar migrations grandes no SQL Editor do Supabase**, lembrar que é tudo uma transação só — erro no meio desfaz o que já tinha rodado antes. Ver nota técnica na seção Multi-tenant acima.
