# STATUS DO PROJETO — make-money

> Atualize este arquivo SEMPRE antes de encerrar uma sessão (limite de uso atingido).
> Ao abrir uma conta nova, cole o conteúdo deste arquivo como primeira mensagem pra ela pegar contexto rápido.

Última atualização: 05/08/2026 — Conta A

---

## 🎨 Diretriz de tema visual

Identidade "Libretto" aplicada em todas as telas, incluindo a ficha de cliente e parcelas. Ver `app/globals.css` e `tailwind.config.js`.

---

## 📱 PWA (app instalável)

O objetivo é o sistema funcionar "como um app" no celular do contratante (instalável, tela cheia, sem barra do navegador).

- [x] `app/layout.js` — `metadata` com `manifest: '/manifest.json'` e `appleWebApp` (tela cheia no iPhone) + export `viewport` com `themeColor: '#0a0a0a'`
- [x] Ícones (`icon-192.png`, `icon-512.png`) e `manifest.json` em `public/` na raiz (corrigido pela Conta C, estavam em `app/public/` por engano)
- [x] Instalação testada e confirmada funcionando no celular (print do usuário: ícone Libretto na tela inicial, abre em tela cheia)
- [x] **Navegação mobile corrigida (Conta A):** o layout usava uma sidebar fixa de desktop (`w-64`) sem nenhuma adaptação — no celular isso empurrava o conteúdo pra fora da tela e causava scroll horizontal / aparência "distorcida e grande" (reportado pelo usuário com prints). Resolvido:
  - Novo `components/BottomNav.js` — barra de navegação fixa embaixo, só aparece em telas pequenas (`lg:hidden`), com os mesmos 4 itens da sidebar (Início, Associados, Parcelas, Novo)
  - `components/Sidebar.js` — `<aside>` agora é `hidden lg:flex` (só aparece em telas grandes)
  - `app/(app)/layout.js` (`AppLayout`) — vira `flex-col` no mobile / `flex-row` no desktop (`lg:flex-row`), `<main>` ganha `pb-20` no mobile (espaço pra não ficar atrás do BottomNav) e `overflow-x-hidden` pra conter tabelas largas

**Ainda falta (ação manual, não dá pra fazer por código):**

- [ ] Trocar nome do projeto na Vercel de `make-m0n3yy` pra `libretto` (Settings → General → Project Name) — muda a URL pra `libretto.vercel.app`
- [ ] Testar a navegação mobile nova no celular após o deploy (pode precisar fechar/reabrir o app instalado, ou reinstalar, pra pegar a versão nova por causa de cache do PWA)
- [ ] Se alguma tabela específica ainda ficar cortada/com scroll horizontal dentro dela (ex: tabela de Associados que cortou a coluna "Saldo Devedor" nos prints), reportar com print pra ajuste pontual daquele componente

---

## 🅰️ CONTA A — Backend & Dados

**Status: concluído**, incluindo os ajustes que a Conta B trouxe em `lib/calculos.js` e `lib/parcelas.js`:

- Adicionado modo de juros **`fixo`** (taxa única sobre o valor, não multiplicada por parcela) em `calcularParcela()` — mantém `simples`/`composto` como estavam
- Adicionada **`periodicidade`** (`mensal`/`semanal`) em `gerarParcelas()` — default `mensal`, não quebra nada existente
- **Migração já aplicada em produção e agora registrada no repositório:** `supabase/migrations/002_periodicidade_juros_fixo.sql` (coluna `periodicidade` em `emprestimos` + `tipo_juros` liberando `'fixo'`). Ela já tinha sido rodada direto no Supabase antes de o arquivo existir no repo — o `schema.sql` base foi atualizado junto pra não ficar divergente do banco real. Se for provisionar um Supabase novo do zero: rodar `schema.sql` e depois as migrations em `supabase/migrations/` em ordem.
- Ajuste de `app/layout.js` (metadata/viewport) e geração dos ícones PWA
- Navegação mobile (BottomNav + Sidebar responsiva) — ver seção PWA acima para detalhes

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
- [ ] Revisar tabelas (ex: `/clientes`) que ainda cortam coluna em telas pequenas — ver pendência da seção PWA acima

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

**Falta fazer:**

- [ ] Teste end-to-end: cadastrar cliente → empréstimo (testar `tipo_juros = 'fixo'`, `periodicidade = 'semanal'`, `juros_dia_tipo` nos dois modos) → gerar parcelas → pagar → refletir no dashboard
- [ ] (opcional) Emissão de recibo em PDF
- [ ] Trocar nome do projeto na Vercel pra `libretto` — ação manual no painel, ninguém fez ainda
- [ ] Rodar migrations `003` e `004` no Supabase se ainda não rodou (ver arquivos em `supabase/migrations/`)

---

## Regras gerais pra todas as contas

1. Sempre `git pull` antes de começar a trabalhar.
2. Mexer só na sua área evita conflito de merge (ver README.md pra estrutura de pastas) — se precisar cruzar pra área de outra conta, registrar aqui claramente o que mudou e por quê, e sinalizar pra quem for revisar. Mudança de schema (mesmo pequena) sempre precisa de um arquivo em `supabase/migrations/`, mesmo que já tenha sido rodada manualmente no Supabase — senão o repo fica mentindo sobre o estado real do banco.
3. Commits pequenos e frequentes, com mensagens claras.
4. Antes de parar, atualizar a seção correspondente aqui no STATUS.md.
