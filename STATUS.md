# STATUS DO PROJETO — make-money

> Atualize este arquivo SEMPRE antes de encerrar uma sessão (limite de uso atingido).
> Ao abrir uma conta nova, cole o conteúdo deste arquivo como primeira mensagem pra ela pegar contexto rápido.

Última atualização: 06/08/2026 — Conta A

---

## 🎨 Diretriz de tema visual

Identidade "Libretto" aplicada em todas as telas, incluindo a ficha de cliente e parcelas. Ver `app/globals.css` e `tailwind.config.js`.

---

## 🏢 MULTI-TENANT (Contratantes) — NOVO, requer ação manual do usuário antes de continuar

**Decisão de produto:** o Libretto vai deixar de ser "1 sistema por cliente" e virar produto vendável pra vários clientes de empréstimo ao mesmo tempo, cada um isolado dos outros. O usuário (Figueiredo) é o único `admin`, com visão de todos.

**Modelo implementado (Conta A):**

- Nova tabela `contratantes` (cada cliente seu vira 1 registro)
- Nova tabela `perfis` (liga cada usuário do Auth a um `contratante_id`, ou marca `role = 'admin'`)
- `clientes` e `emprestimos` ganharam coluna `contratante_id`
- RLS reescrito em TODAS as tabelas (`clientes`, `emprestimos`, `parcelas`, `pagamentos`) — antes era "qualquer autenticado vê tudo", agora é "só vê o próprio contratante, exceto admin"
- Views atualizadas (`clientes_com_saldo` ganhou `contratante_id`) + nova função `resumo_por_contratante(uuid)` (só admin pode chamar) pra alimentar a tela admin
- Nova tela `/admin` (lista contratantes) e `/admin/[id]` (visão read-only do contratante: resumo financeiro + tabela de associados) — só aparece na Sidebar pra quem é `role = 'admin'`
- `lib/perfil.js` — helper `getPerfilAtual()` / `isAdminAtual()` / `listarContratantes()` / `criarContratante()`

**Arquivo da migration:** `supabase/migrations/005_multi_tenant.sql` — **ainda não foi rodado no Supabase real**, só existe no pacote de entrega. Precisa ser aplicado manualmente.

### ⚠️ AÇÃO OBRIGATÓRIA antes do sistema voltar a funcionar (leia antes de rodar)

Assim que a migration `005` rodar, **os 2 usuários atuais perdem acesso a tudo** até o backfill ser feito (RLS novo exige registro em `perfis`, que ainda não existe pra ninguém). Não é bug — passos obrigatórios, na ordem:

1. Rodar `005_multi_tenant.sql` inteiro (seções 1 a 7) no SQL Editor do Supabase
2. Anotar o `id` retornado por `insert into contratantes (nome) values (...) returning id;`
3. Descobrir os UUIDs dos 2 usuários: `select id, email from auth.users;`
4. Rodar manualmente (preenchendo os IDs reais) os `insert into clientes/emprestimos set contratante_id` (seção 7b, comentado no arquivo) e os `insert into perfis` (seção 7c) — um como `admin` (Figueiredo), outro como `contratante` vinculado ao `contratante_id` criado
5. Só depois de confirmar que todos os registros têm `contratante_id`, rodar a seção 8 (torna a coluna `not null`) — opcional, reforça integridade

**Pendente para as próximas contas:**

- [ ] Rodar a migration + backfill descrito acima (usuário vai fazer isso após esta sessão)
- [ ] Testar: login como contratante antigo só vê os próprios associados; login como admin vê `/admin` na sidebar e consegue abrir `/admin/[id]`
- [ ] **Não existe fluxo de UI pra criar um contratante novo end-to-end ainda** — hoje é: criar em `contratantes` (via `criarContratante()` do `lib/perfil.js` ou SQL direto) → criar usuário manualmente no Supabase Auth → inserir manualmente em `perfis` linkando os dois. Precisa de uma tela admin de "novo contratante" que automatize isso (falta fazer)
- [ ] `BottomNav.js` (mobile) não ganhou item "Admin" de propósito (ficaria apertado com 5 itens, e só o Figueiredo usa) — acesso admin só pela sidebar de desktop por enquanto. Revisar se isso vira problema real de uso
- [ ] Tela `/admin/[id]` é só leitura (visão de associados + resumo). Se precisar editar/excluir associado de um contratante específico pelo admin, ainda não existe — decisão consciente de escopo, avaliar se é necessário

---

## 📱 PWA (app instalável)

- [x] Ícone definitivo (Conta B): monograma "L" itálico dourado, `dominant-baseline="central"` corrigido, `app/icon.png` + `app/apple-icon.png` (favicon via convenção Next.js) além de `public/icon-192.png`/`icon-512.png` (PWA). **Pendente: confirmar visualmente em produção.**
- [x] `app/layout.js` — `metadata` com `manifest`/`appleWebApp` + `viewport` com `themeColor`
- [x] Instalação testada e funcionando no celular
- [x] Navegação mobile (BottomNav + Sidebar responsiva) — testado e funcionando
- [x] Tabelas com scroll horizontal (`.table-scroll`) — corrigido, pendente confirmação final em produção

**Ainda falta:**

- [ ] Trocar nome do projeto na Vercel de `make-m0n3yy` pra `libretto`

---

## 🅰️ CONTA A — Backend & Dados

**Status: concluído** (juros fixo/periodicidade, PWA, navegação mobile, scroll de tabelas) **+ multi-tenant entregue, aguardando execução da migration pelo usuário** (ver seção acima).

---

## 🅱️ CONTA B — Frontend & UI

**Status: concluído e em produção.** Ficha do associado, combobox de cliente, modal de pagamento compartilhado, favicon/ícone definitivo corrigido.

**Falta fazer:**

- [ ] Teste end-to-end completo em produção
- [ ] Depois que o multi-tenant for ativado: revisar se alguma tela lista dados sem passar pelo Supabase client autenticado corretamente (RLS agora é restritivo por padrão — se algo usava alguma query "solta", pode passar a retornar vazio)

---

## 🅲️ CONTA C — Integração, Regras de Negócio & Deploy

**Status: em andamento.** Editar/excluir associado, editar empréstimo (com trava de campos se já tem parcela paga), juros por atraso (percentual/valor fixo), deploy funcionando.

**Falta fazer:**

- [ ] Teste end-to-end (fluxo completo cliente → empréstimo → parcelas → pagamento)
- [ ] Testar editar/excluir associado e editar empréstimo em produção
- [ ] Trocar nome do projeto na Vercel pra `libretto`
- [ ] Rodar migrations `003` e `004` no Supabase se ainda não rodou
- [ ] Depois do multi-tenant: garantir que as rotas de editar/excluir (associado e empréstimo) respeitam o novo RLS — não deveriam precisar de mudança de código (RLS é transparente pro client), mas testar mesmo assim

---

## Regras gerais pra todas as contas

1. Sempre `git pull` antes de começar a trabalhar.
2. Mexer só na sua área evita conflito de merge — se precisar cruzar pra área de outra conta, registrar aqui claramente o que mudou e por quê. Mudança de schema (mesmo pequena) sempre precisa de um arquivo em `supabase/migrations/`, mesmo que já tenha sido rodada manualmente no Supabase.
3. Commits pequenos e frequentes, com mensagens claras.
4. Antes de parar, atualizar a seção correspondente aqui no STATUS.md.
