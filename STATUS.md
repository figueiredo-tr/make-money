# STATUS DO PROJETO — make-money

> Atualize este arquivo SEMPRE antes de encerrar uma sessão (limite de uso atingido).
> Ao abrir uma conta nova, cole o conteúdo deste arquivo como primeira mensagem pra ela pegar contexto rápido.

Última atualização: 05/08/2026 — Conta B

---

## 🎨 Diretriz de tema visual

Identidade "Libretto" aplicada em todas as telas, incluindo a ficha de cliente e parcelas (Conta C seguiu o padrão certinho). Ver `app/globals.css` e `tailwind.config.js`.

---

## 🅰️ CONTA A — Backend & Dados

**Status: concluído**, com 2 pendências abertas pela Conta B (ver abaixo — mexeu em `lib/calculos.js` e `lib/parcelas.js`, avaliar se está de acordo):

- Adicionado modo de juros **`fixo`** (taxa única sobre o valor, não multiplicada por parcela) em `calcularParcela()` — mantém `simples`/`composto` como estavam
- Adicionada **`periodicidade`** (`mensal`/`semanal`) em `gerarParcelas()` — default `mensal`, não quebra nada existente
- **Migração pendente de rodar no Supabase:** `supabase/migrations/002_periodicidade_juros_fixo.sql` (adiciona coluna `periodicidade` e permite `tipo_juros = 'fixo'`) — **se ainda não rodou, os inserts de empréstimo vão falhar**

---

## 🅱️ CONTA B — Frontend & UI

**Status: concluído e em produção** (https://make-m0n3yy.vercel.app).

**Feito desde a última atualização:**

- Corrigido bug do seletor de associado no formulário de empréstimo (era um `<select>` com `size` dinâmico que não respondia a clique) → agora é `components/ui/ClienteCombobox.js`, busca com clique funcionando
- Formulário de empréstimo com campo de tipo de juros (`fixo`/`simples`/`composto`) e periodicidade (`mensal`/`semanal`)
- **Nova rota `app/(app)/clientes/[id]/page.js`** — ficha do associado: saldo devedor, nº de empréstimos, parcelas atrasadas, e cada empréstimo com sua tabela de parcelas + botão de pagamento
- `/clientes` — nomes agora são clicáveis, levam pra ficha
- `components/ui/ModalPagamento.js` — modal de pagamento extraído como componente compartilhado (usado por `/parcelas` e `/clientes/[id]`)
- **Reorganizei a tela de Parcelas da Conta C** (estava uma tabela única com todo mundo misturado) → agora agrupada em cards por associado, nome com link pra ficha

**Falta fazer:**

- [ ] Rodar a migração SQL pendente no Supabase (ver seção Conta A)
- [ ] Teste end-to-end completo em produção
- [ ] Estado vazio mais elaborado / paginação se a base crescer

---

## 🅲️ CONTA C — Integração, Regras de Negócio & Deploy

**Feito:**

- `app/(app)/parcelas/page.js` — registrar pagamento, quitação automática do empréstimo (`verificarQuitacaoEmprestimo` em `lib/parcelas.js`), destaque visual de atraso
- Deploy na Vercel funcionando

**Nota importante:** a Conta B reorganizou visualmente essa tela (agrupou por associado) por pedido direto do usuário — a lógica de pagamento/quitação que você fez continua igual, só mudou o layout. Confere se ficou do jeito que você esperava.

**Falta fazer:**

- [ ] Teste end-to-end: cadastrar cliente → empréstimo → gerar parcelas → pagar → refletir no dashboard (com os novos campos `periodicidade` e `tipo_juros = 'fixo'`)
- [ ] (opcional) Emissão de recibo em PDF

---

## Regras gerais pra todas as contas

1. Sempre `git pull` antes de começar a trabalhar.
2. Mexer só na sua área evita conflito de merge — mas nessa sessão a Conta B cruzou pra área de A e C direto a pedido do usuário; revisem antes de assumir que está tudo como vocês deixaram.
3. Commits pequenos e frequentes, com mensagens claras.
4. Antes de parar, atualizar a seção correspondente aqui no STATUS.md.
