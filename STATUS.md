# STATUS DO PROJETO — make-money

> Atualize este arquivo SEMPRE antes de encerrar uma sessão (limite de uso atingido).
> Ao abrir uma conta nova, cole o conteúdo deste arquivo como primeira mensagem pra ela pegar contexto rápido.

Última atualização: 07/08/2026 — Conta A

---

## 🎨 Diretriz de tema visual

Identidade "Libretto" aplicada em todas as telas, incluindo a ficha de cliente e parcelas. Ver `app/globals.css` e `tailwind.config.js`.

---

## 👤 MEU PERFIL — NOVO

Tela `/perfil`, acessível por qualquer usuário logado (link no rodapé da sidebar de desktop, mostrando o nome; ícone dedicado no BottomNav mobile, agora com 5 itens).

**Implementado (Conta A):**

- Migration `supabase/migrations/006_perfil_nome.sql`:
  - Campo `nome` em `perfis` (opcional — se vazio, o app usa o e-mail como exibição)
  - Policy de `UPDATE` liberada em `perfis` pro próprio usuário (antes só existia `SELECT`)
  - **Trigger de segurança** `trg_perfis_protect`: mesmo com a policy de update liberada, ninguém (exceto admin) consegue alterar o próprio `role` ou `contratante_id` — só o `nome` é editável por conta própria. Sem isso, seria uma falha de segurança grave (um contratante poderia se autopromover a admin).
- `lib/perfil.js` — novas funções `atualizarMeuNome(nome)` e `contarMeusAssociados()`; `getPerfilAtual()` agora também retorna `email` e `nomeExibicao` (fallback pro e-mail se `nome` estiver vazio)
- `app/(app)/perfil/page.js` — mostra nome (editável inline), e-mail, tipo de acesso (Admin/Contratante) e, só pra quem é `contratante`, a quantidade de associados cadastrados
- `components/Sidebar.js` e `components/BottomNav.js` atualizados com o link/ícone de acesso

**Pendências:**

- [ ] **Rodar `006_perfil_nome.sql` no Supabase** — ainda não foi aplicado em produção
- [ ] Testar em produção: editar o próprio nome, confirmar que persiste, confirmar que a contagem de associados bate com a realidade
- [ ] Nenhum usuário existente tem `nome` preenchido ainda (campo ficou `null` no backfill) — vai aparecer o e-mail até cada um preencher manualmente pela tela

---

## 🏢 MULTI-TENANT (Contratantes) — TESTADO E FUNCIONANDO EM PRODUÇÃO

**Decisão de produto:** o Libretto deixou de ser "1 sistema por cliente" e virou produto vendável pra vários clientes de empréstimo ao mesmo tempo, cada um isolado dos outros. O usuário (Figueiredo) é o único `admin`, com visão de todos.

**Modelo implementado e validado (Conta A):**

- Tabela `contratantes` — primeiro registro: `cd434aee-a6ae-484c-81e7-44bda8e15d74` ("Cliente Atual - Libretto"), com os associados/empréstimos pré-existentes já migrados pra ele
- Tabela `perfis` (liga cada usuário do Auth a um `contratante_id`, ou marca `role = 'admin'`) — Figueiredo é `admin`
- `clientes` e `emprestimos` com coluna `contratante_id` preenchida
- RLS reescrito em `clientes`, `emprestimos`, `parcelas`, `pagamentos` — isolamento por contratante confirmado
- Views atualizadas (`clientes_com_saldo` com `contratante_id`) + função `resumo_por_contratante(uuid)` (só admin chama)
- Tela `/admin` (lista contratantes) e `/admin/[id]` (visão read-only: resumo financeiro + tabela de associados) — só aparece na sidebar pra `role = 'admin'`
- Migration: `supabase/migrations/005_multi_tenant.sql` — **rodada com sucesso no Supabase de produção**

**✅ Teste end-to-end confirmado (07/08):** usuário de teste vinculado ao mesmo contratante viu só os associados esperados; admin viu a aba Admin e o resumo do contratante corretamente.

**Pendências conhecidas:**

- [ ] Apagar o usuário de teste (`teste@libretto.com`, id `02ab023a-2567-422e-b356-e567a44bd98b`) do Supabase Auth e a linha correspondente em `perfis`
- [ ] Não existe fluxo de UI pra criar um contratante novo end-to-end — hoje é manual (`contratantes` → Auth → `perfis`, os 3 passos separados)
- [ ] `BottomNav.js` não tinha item "Admin" (decisão consciente — só o Figueiredo usa, e agora com 5 itens, incluindo Perfil, ficaria mais apertado ainda)
- [ ] Tela `/admin/[id]` é só leitura
- [ ] Seção 8 da migration 005 (torna `contratante_id` `not null`) ainda não foi rodada — opcional

**Nota técnica importante:** o SQL Editor do Supabase roda o script inteiro numa única transação — erro no meio desfaz tudo que rodou antes na mesma execução. Sempre re-rodar o bloco inteiro do zero se der erro no meio.

---

## 📱 PWA (app instalável)

- [x] Ícone definitivo, favicon, PWA icons e manifest — tudo funcionando, instalação testada
- [x] Navegação mobile (BottomNav + Sidebar responsiva) — testado e funcionando
- [x] Tabelas com scroll horizontal (`.table-scroll`) — corrigido e funcionando

**Ainda falta:**

- [ ] Trocar nome do projeto na Vercel de `make-m0n3yy` pra `libretto`

---

## 🅰️ CONTA A — Backend & Dados

**Status: concluído.** Schema, RLS, cálculos de juros (simples/composto/fixo), geração de parcelas, PWA, navegação mobile, scroll de tabelas, multi-tenant validado em produção, e agora tela de perfil (**migration 006 pendente de execução**).

---

## 🅱️ CONTA B — Frontend & UI

**Status: concluído e em produção.** Ficha do associado, combobox de cliente, modal de pagamento compartilhado, favicon/ícone definitivo.

**Falta fazer:**

- [ ] Teste end-to-end completo em produção
- [ ] Com o multi-tenant ativo, revisar se alguma tela faz alguma query "solta" fora da sessão autenticada normal

---

## 🅲️ CONTA C — Integração, Regras de Negócio & Deploy

**Status: em andamento.** Editar/excluir associado, editar empréstimo (com trava de campos se já tem parcela paga), juros por atraso (percentual/valor fixo), deploy funcionando.

**Falta fazer:**

- [ ] Teste end-to-end (fluxo completo cliente → empréstimo → parcelas → pagamento)
- [ ] Testar editar/excluir associado e editar empréstimo com o multi-tenant ativo
- [ ] Trocar nome do projeto na Vercel pra `libretto`
- [ ] Rodar migrations `003` e `004` no Supabase se ainda não rodou

---

## Regras gerais pra todas as contas

1. Sempre `git pull` antes de começar a trabalhar.
2. Mexer só na sua área evita conflito de merge — se precisar cruzar pra área de outra conta, registrar aqui claramente o que mudou e por quê. Mudança de schema (mesmo pequena) sempre precisa de um arquivo em `supabase/migrations/`, mesmo que já tenha sido rodada manualmente no Supabase.
3. Commits pequenos e frequentes, com mensagens claras.
4. Antes de parar, atualizar a seção correspondente aqui no STATUS.md.
5. **Ao rodar migrations grandes no SQL Editor do Supabase**, lembrar que é tudo uma transação só — erro no meio desfaz o que já tinha rodado antes.
