# STATUS DO PROJETO — make-money

> Atualize este arquivo SEMPRE antes de encerrar uma sessão (limite de uso atingido).
> Ao abrir uma conta nova, cole o conteúdo deste arquivo como primeira mensagem pra ela pegar contexto rápido.

Última atualização: 05/08/2026 — Conta C

---

## 🎨 Diretriz de tema visual

Identidade "Libretto" aplicada em todas as telas, incluindo a ficha de cliente e parcelas. Ver `app/globals.css` e `tailwind.config.js`.

---

## 🅰️ CONTA A — Backend & Dados

**Status: concluído**, incluindo os ajustes que a Conta B trouxe em `lib/calculos.js` e `lib/parcelas.js`:

- Adicionado modo de juros **`fixo`** (taxa única sobre o valor, não multiplicada por parcela) em `calcularParcela()` — mantém `simples`/`composto` como estavam
- Adicionada **`periodicidade`** (`mensal`/`semanal`) em `gerarParcelas()` — default `mensal`, não quebra nada existente
- **Migração já aplicada em produção e agora registrada no repositório:** `supabase/migrations/002_periodicidade_juros_fixo.sql` (coluna `periodicidade` em `emprestimos` + `tipo_juros` liberando `'fixo'`). Ela já tinha sido rodada direto no Supabase antes de o arquivo existir no repo — o `schema.sql` base foi atualizado junto pra não ficar divergente do banco real. Se for provisionar um Supabase novo do zero: rodar `schema.sql` e depois as migrations em `supabase/migrations/` em ordem.

---

## 🅱️ CONTA B — Frontend & UI

**Status: concluído e em produção** (https://make-m0n3yy.vercel.app).

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

---

## 🅲️ CONTA C — Integração, Regras de Negócio & Deploy

**Status: em andamento.**

**Feito:**

- `app/(app)/parcelas/page.js` — registrar pagamento, quitação automática do empréstimo (`verificarQuitacaoEmprestimo` em `lib/parcelas.js`), destaque visual de atraso
- Reorganização feita pela Conta B (agrupamento por associado) conferida — a lógica de pagamento/quitação continua íntegra, só mudou o layout
- Deploy na Vercel funcionando
- Migração `002_periodicidade_juros_fixo.sql` conferida linha a linha e sincronizada com `schema.sql`
- Removido `conta-c-tela-parcelas.patch` que tinha sido commitado sem querer no repositório; adicionado `*.patch` no `.gitignore`

**Falta fazer:**

- [ ] Teste end-to-end: cadastrar cliente → empréstimo (testar `tipo_juros = 'fixo'` e `periodicidade = 'semanal'`) → gerar parcelas → pagar → refletir no dashboard
- [ ] (opcional) Emissão de recibo em PDF

---

## Regras gerais pra todas as contas

1. Sempre `git pull` antes de começar a trabalhar.
2. Mexer só na sua área evita conflito de merge (ver README.md pra estrutura de pastas) — se precisar cruzar pra área de outra conta, registrar aqui claramente o que mudou e por quê, e sinalizar pra quem for revisar. Mudança de schema (mesmo pequena) sempre precisa de um arquivo em `supabase/migrations/`, mesmo que já tenha sido rodada manualmente no Supabase — senão o repo fica mentindo sobre o estado real do banco.
3. Commits pequenos e frequentes, com mensagens claras.
4. Antes de parar, atualizar a seção correspondente aqui no STATUS.md.
