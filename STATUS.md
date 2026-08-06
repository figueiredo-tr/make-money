# STATUS DO PROJETO — make-money

> Atualize este arquivo SEMPRE antes de encerrar uma sessão (limite de uso atingido).
> Ao abrir uma conta nova, cole o conteúdo deste arquivo como primeira mensagem pra ela pegar contexto rápido.

Última atualização: 06/08/2026 — Conta C

---

## 🎨 Diretriz de tema visual

Identidade "Libretto" aplicada em todas as telas, incluindo a ficha de cliente e parcelas. Ver `app/globals.css` e `tailwind.config.js`.

---

## 📱 PWA (app instalável)

O objetivo é o sistema funcionar "como um app" no celular do contratante (instalável, tela cheia, sem barra do navegador).

- [x] **Ícone definitivo — corrigido pela Conta B:** monograma "L" itálico dourado, cantos em moldura dourada, fundo escuro com brilho bordô (assinatura visual dos cards). Primeira versão tinha o "L" opticamente desalinhado (baseline padrão do SVG puxava pra baixo/direita) — corrigido com `dominant-baseline="central"`. Testada uma variante alternativa em formato de medalhão/selo circular, mas o usuário preferiu manter o estilo original (itálico + cantos), só com o alinhamento certo. Arquivos: `public/icon-192.png`, `public/icon-512.png` (PWA) + **novo:** `app/icon.png` e `app/apple-icon.png` (favicon real via convenção do Next.js — antes não existia `<link rel="icon">` nenhum, por isso a aba do navegador mostrava o ícone errado). **Pendente: confirmar visualmente em produção** (aba do navegador + reinstalar o app no celular).
- [x] `app/layout.js` — `metadata` com `manifest: '/manifest.json'` e `appleWebApp` (tela cheia no iPhone) + export `viewport` com `themeColor: '#0a0a0a'`
- [x] Ícones (`icon-192.png`, `icon-512.png`) e `manifest.json` em `public/` na raiz
- [x] Instalação testada e confirmada funcionando no celular (ícone Libretto na tela inicial, abre em tela cheia)
- [x] **Navegação mobile:** sidebar de desktop (`w-64`) foi trocada por `hidden lg:flex` e criado `components/BottomNav.js` — barra fixa embaixo, só em telas pequenas (`lg:hidden`), com os 4 itens (Início, Associados, Parcelas, Novo). `app/(app)/layout.js` ajustado (`flex-col`/`lg:flex-row`, `pb-20` no `<main>` mobile). **Testado e funcionando.**
- [x] **Tabelas cortadas no mobile — corrigido:** todas as 4 tabelas do sistema usam a mesma classe global `table.ledger` (`app/globals.css`), mas nenhuma tinha contêiner de scroll — por isso cortava em todas as telas ao mesmo tempo (reportado pelo usuário com print, confirmado que acontecia em Dashboard, Associados, Ficha do Associado e Parcelas). Corrigido:
  - `app/globals.css` — nova classe `.table-scroll` (`overflow-x: auto`) + `table.ledger` ganhou `min-width: 640px` (evita colunas espremidas demais)
  - Cada `<table className="ledger">` nas 4 páginas envolvida por `<div className="table-scroll">...</div>`: `app/(app)/dashboard/page.js`, `app/(app)/clientes/page.js`, `app/(app)/clientes/[id]/page.js`, `app/(app)/parcelas/page.js`
  - **Pendente de confirmação do usuário após deploy** (ainda não testado em produção)

**Ainda falta (ação manual, não dá pra fazer por código):**

- [ ] Trocar nome do projeto na Vercel de `make-m0n3yy` pra `libretto` (Settings → General → Project Name) — muda a URL pra `libretto.vercel.app`
- [ ] Testar no celular se as tabelas agora arrastam corretamente pros lados (após o deploy do commit de scroll horizontal)

---

## 🅰️ CONTA A — Backend & Dados

**Status: concluído**, incluindo os ajustes que a Conta B trouxe em `lib/calculos.js` e `lib/parcelas.js`:

- Adicionado modo de juros **`fixo`** (taxa única sobre o valor, não multiplicada por parcela) em `calcularParcela()` — mantém `simples`/`composto` como estavam
- Adicionada **`periodicidade`** (`mensal`/`semanal`) em `gerarParcelas()` — default `mensal`, não quebra nada existente
- **Migração já aplicada em produção e agora registrada no repositório:** `supabase/migrations/002_periodicidade_juros_fixo.sql` (coluna `periodicidade` em `emprestimos` + `tipo_juros` liberando `'fixo'`). Ela já tinha sido rodada direto no Supabase antes de o arquivo existir no repo — o `schema.sql` base foi atualizado junto pra não ficar divergente do banco real. Se for provisionar um Supabase novo do zero: rodar `schema.sql` e depois as migrations em `supabase/migrations/` em ordem.
- Ajuste de `app/layout.js` (metadata/viewport) e geração dos ícones PWA
- Navegação mobile (BottomNav + Sidebar responsiva) — ver seção PWA acima
- Correção de scroll horizontal nas 4 tabelas do sistema — ver seção PWA acima

---

## 🅱️ CONTA B — Frontend & UI

**Status: concluído e em produção** (https://make-m0n3yy.vercel.app — domínio será trocado pra libretto.vercel.app, ver pendência acima).

**Feito desde a última atualização:**

- Corrigido bug do seletor de associado no formulário de empréstimo (era um `<select>` com `size` dinâmico que não respondia a clique) → agora é `components/ui/ClienteCombobox.js`, busca com clique funcionando
- Formulário de empréstimo com campo de tipo de juros (`fixo`/`simples`/`composto`) e periodicidade (`mensal`/`semanal`)
- **Nova rota `app/(app)/clientes/[id]/page.js`** — ficha do associado: saldo devedor, nº de empréstimos, parcelas atrasadas, e cada empréstimo com sua tabela de parcelas + botão de pagamento
- `/clientes` — nomes agora são clicáveis, levam pra ficha
- `components/ui/ModalPagamento.js` — modal de pagamento extraído como componente compartilhado (usado por `/parcelas` e `/clientes/[id]`)
- Reorganizou a tela de Parcelas (Conta C) — estava uma tabela única com todo mundo misturado, agora agrupada em cards por associado, nome com link pra ficha

**Falta fazer:**

- [ ] Teste end-to-end completo em produção
- [ ] Estado vazio mais elaborado / paginação se a base crescer
- [ ] Confirmar visualmente que o `.table-scroll` (Conta A) não quebrou nenhum espaçamento/alinhamento das telas que a Conta B estilizou

---

## 🅲️ CONTA C — Integração, Regras de Negócio & Deploy

**Status: em andamento.**

**Feito:**

- `app/(app)/parcelas/page.js` — registrar pagamento, quitação automática do empréstimo (`verificarQuitacaoEmprestimo` em `lib/parcelas.js`), destaque visual de atraso
- Reorganização feita pela Conta B (agrupamento por associado) conferida — a lógica de pagamento/quitação continua íntegra, só mudou o layout
- Lista de parcelas virou accordion por associado (clica pra expandir) — evita lista enorme
- Coluna "Juros dia": juros por atraso configurável no cadastro do empréstimo, em **percentual** (% sobre o restante × dias) ou **valor fixo** (R$ × dias) — campo `juros_dia_tipo`, migrations `003_juros_dia.sql` e `004_juros_dia_tipo.sql`
- Corrigido PWA: ícones e `manifest.json` estavam em `app/public/` (não servido pelo Next.js) e movidos pra `public/` na raiz
- Removida migration duplicada `supabase/002_periodicidade_juros_fixo.sql` (fora da pasta `migrations/`, conteúdo idêntico ao que já existia em `supabase/migrations/002_...`)
- Deploy na Vercel: resolvido problema de Framework Preset resetando pra "Other" (causava "No Output Directory named public") — reconfirmado como "Next.js" nas Settings
- **Editar/excluir associado:** nova rota `app/(app)/clientes/[id]/editar/page.js` (form pré-preenchido, `update` no Supabase) + botões "Editar" e "Excluir" na ficha do associado (`app/(app)/clientes/[id]/page.js`). Excluir abre modal de confirmação — se o associado já tem empréstimos, avisa que a exclusão é em cascata (apaga empréstimos/parcelas/pagamentos junto, `on delete cascade` já existia no schema) antes de confirmar. Não precisou de migration nova, RLS já permitia update/delete em `clientes`.

- **Editar empréstimo:** nova rota `app/(app)/emprestimos/[id]/editar/page.js` + botão "Editar" no card de cada empréstimo na ficha do associado. Se nenhuma parcela foi paga ainda, edita tudo (valor, taxa, tipo de juros, periodicidade, nº de parcelas, data) e regenera as parcelas do zero ao salvar; se já tem parcela paga, trava esses campos (evita invalidar histórico) e libera só juros por atraso, status e observações.
- **Bug corrigido:** a primeira versão desse arquivo tinha ido parar na pasta errada (`emprestimos/novo/[id]/editar/`, aninhada por engano) e nunca foi commitada no lugar certo — por isso dava 404. Corrigido: pasta errada removida, arquivo recriado em `emprestimos/[id]/editar/`, e o botão "Editar" ajustado pro mesmo estilo visual dos outros botões (antes era um linkzinho pequeno, quase invisível).
- Conferido o ícone/favicon da Conta B (`app/icon.png`, `app/apple-icon.png`, `public/icon-192.png`, `public/icon-512.png`) — dimensões corretas (512, 180, 192, 512), sem inconsistência.

**Falta fazer:**

- [ ] Teste end-to-end: cadastrar cliente → empréstimo (testar `tipo_juros = 'fixo'`, `periodicidade = 'semanal'`, `juros_dia_tipo` nos dois modos) → gerar parcelas → pagar → refletir no dashboard
- [ ] Testar editar/excluir associado em produção (excluir um associado sem empréstimos e um com empréstimos, conferir cascade)
- [ ] Testar editar empréstimo em produção (com e sem parcela paga) e confirmar que a rota `/emprestimos/[id]/editar` não dá mais 404
- [ ] (opcional) Emissão de recibo em PDF
- [ ] Trocar nome do projeto na Vercel pra `libretto` — ação manual no painel, ninguém fez ainda
- [ ] Rodar migrations `003` e `004` no Supabase se ainda não rodou (ver arquivos em `supabase/migrations/`)

---

## Regras gerais pra todas as contas

1. Sempre `git pull` antes de começar a trabalhar.
2. Mexer só na sua área evita conflito de merge (ver README.md pra estrutura de pastas) — se precisar cruzar pra área de outra conta, registrar aqui claramente o que mudou e por quê, e sinalizar pra quem for revisar. Mudança de schema (mesmo pequena) sempre precisa de um arquivo em `supabase/migrations/`, mesmo que já tenha sido rodada manualmente no Supabase — senão o repo fica mentindo sobre o estado real do banco.
3. Commits pequenos e frequentes, com mensagens claras.
4. Antes de parar, atualizar a seção correspondente aqui no STATUS.md.
