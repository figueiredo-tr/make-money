# STATUS DO PROJETO — make-money

> Atualize este arquivo SEMPRE antes de encerrar uma sessão (limite de uso atingido).
> Ao abrir uma conta nova, cole o conteúdo deste arquivo como primeira mensagem pra ela pegar contexto rápido.

Última atualização: 04/08/2026 — Conta B

---

## 🎨 Diretriz de tema visual

Identidade definida e aplicada: **"Libretto"** — nome discreto (vem de "libretto di risparmio", caderneta bancária italiana real). Paleta escura (preto/bordô/dourado), tipografia Fraunces + Inter + JetBrains Mono, cards com cantos em moldura dourada, selos de status em vez de badges genéricos. Ver `app/globals.css` e `tailwind.config.js` pro token system completo.

Vocabulário aplicado na UI:

- Dashboard → "Libretto"
- Clientes → "Associados"
- Empréstimo ativo → selo "Em aberto" (dourado)
- Quitado → selo verde musgo
- Atrasado → selo bordô

---

## 🅰️ CONTA A — Backend & Dados

**Status: concluído.** Schema, RLS, `lib/calculos.js`, `lib/parcelas.js`, views (`resumo_geral`, `clientes_com_saldo`, `proximos_vencimentos`) — tudo rodado e validado no Supabase real.

**Pendência menor:** confirmar com o cliente se o padrão é juros simples ou composto (hoje o formulário deixa escolher por empréstimo).

---

## 🅱️ CONTA B — Frontend & UI

**Status: concluído e em produção.**

**Feito:**

- Tema visual "Libretto" completo (`app/globals.css`, `tailwind.config.js`)
- `AuthProvider` + guarda de autenticação em `app/(app)/layout.js`
- `app/login` — login sem cadastro público
- `app/(app)/dashboard` — cards de `resumo_geral` + `proximos_vencimentos`
- `app/(app)/clientes` — listagem de `clientes_com_saldo` com busca
- `app/(app)/clientes/novo` — cadastro de cliente
- `app/(app)/emprestimos/novo` — cadastro de empréstimo com prévia de cálculo + chamada a `gerarParcelas()`
- `next` atualizado 14.2.15 → 14.2.35 (corrige vulnerabilidades críticas/altas)
- **Deploy resolvido e no ar:** https://make-m0n3yy.vercel.app (troubleshooting feito: env vars configuradas na Vercel em Settings → Environments, e Framework Preset corrigido pra Next.js — antes estava caindo como "Other"/estático)

**Falta fazer:**

- [ ] Teste end-to-end completo (cadastrar associado → empréstimo → conferir parcelas geradas no Supabase → conferir dashboard) — ainda não validado ponta a ponta em produção
- [ ] Estado vazio mais elaborado pra quando não há associados ainda
- [ ] Paginação na listagem de associados se a base crescer

**Nota de segurança:** `npm audit` ainda aponta 2 vulnerabilidades altas (server function endpoints / postcss), só resolvidas com Next 15/16 (breaking change). Avaliar antes de crescer o projeto.

---

## 🅲️ CONTA C — Integração, Regras de Negócio & Deploy

**Responsável por:** tela de parcelas, alertas de atraso, testes end-to-end.

**Feito:**

- [ ] (ainda não iniciado)

**Falta fazer:**

- [ ] Tela de parcelas (marcar como pago via `registrarPagamento()`, ver vencidos/próximos)
- [ ] Destaque visual de parcelas atrasadas
- [ ] Teste end-to-end: cadastrar cliente → cadastrar empréstimo → gerar parcelas → pagar → refletir no dashboard
- [ ] (opcional) Emissão de recibo em PDF

**Já resolvido (não precisa mexer):** deploy na Vercel já está configurado e funcionando — env vars e Framework Preset ok. Se precisar de nova env var no futuro, é em Settings → Environments no painel da Vercel.

**Próximo passo:** o layout `app/(app)/layout.js` já protege qualquer rota nova — basta criar a pasta (ex: `app/(app)/parcelas/`) que herda auth guard e sidebar automaticamente. Seguir o padrão visual em `app/globals.css` (classes `.card`, `.seal-*`, `.ledger`, `.btn-*`, `.input`).

---

## Regras gerais pra todas as contas

1. Sempre `git pull` antes de começar a trabalhar.
2. Mexer só na sua área evita conflito de merge (ver README.md pra estrutura de pastas).
3. Commits pequenos e frequentes, com mensagens claras.
4. Antes de parar, atualizar a seção correspondente aqui no STATUS.md.
