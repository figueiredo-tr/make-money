# STATUS DO PROJETO — make-money

> Atualize este arquivo SEMPRE antes de encerrar uma sessão (limite de uso atingido).
> Ao abrir uma conta nova, cole o conteúdo deste arquivo como primeira mensagem pra ela pegar contexto rápido.

Última atualização: 04/08/2026 — Conta B

---

## 🎨 Diretriz de tema visual
O projeto deve unir **controle financeiro sério** (dados corretos, números claros) com um **estilo visual "máfia italiana"** (elegante, escuro, dramático — tipo Godfather/Peaky Blinders). Isso é só estética/UI, não muda a lógica de negócio.

Sugestões de direção pra Conta B aplicar (não usar nomes de obras/personagens registrados, criar identidade própria):
- Paleta escura: preto, vinho/bordô, dourado/champagne como destaque
- Tipografia serifada elegante pra títulos (estilo old money / editorial italiano)
- Textura sutil (mármore, couro) em vez de flat design genérico
- Vocabulário temático nos rótulos da UI, por exemplo:
  - Dashboard → "Visão Geral" ou "O Livro"
  - Clientes → "Associados" ou mantém "Clientes" (mais sóbrio)
  - Empréstimos ativos → "Em aberto"
  - Parcela atrasada → destaque em vermelho/dourado, ícone discreto (nada de humor pesado)
- Manter tudo profissional e discreto — é uma ferramenta de trabalho real, o tema é tempero visual, não uma piada escancarada.

Ver skill `frontend-design` (Conta B deve consultar antes de montar a UI).

---

## 🅰️ CONTA A — Backend & Dados
**Responsável por:** schema Supabase, RLS, lógica de cálculo de juros, geração de parcelas, auth.

**Feito:**
- [x] Schema SQL completo (`clientes`, `emprestimos`, `parcelas`, `pagamentos`)
- [x] RLS policies (acesso restrito a autenticados)
- [x] `lib/calculos.js` — juros simples e composto
- [x] `lib/parcelas.js` — geração automática de parcelas, registro de pagamento, marcação de atraso
- [x] `lib/supabaseClient.js` — client configurado
- [x] Scaffold inicial do Next.js (package.json, Tailwind, layout base)
- [x] Schema + RLS rodados no Supabase real e validados
- [x] 2 usuários criados manualmente (você + cliente)
- [x] Script de teste (`scripts/test-parcelas.mjs`) — fluxo completo testado e funcionando (autenticação, insert de cliente, empréstimo e geração de parcelas)
- [x] `supabase/views.sql` — views de relatório: `resumo_geral` (cards do dashboard), `clientes_com_saldo` (listagem com risco), `proximos_vencimentos` (alertas de 7 dias)

**Falta fazer:**
- [ ] Rodar `views.sql` no Supabase (Conta A ainda precisa aplicar — pendente de confirmação)
- [ ] Revisar cálculo de juros com o cliente (confirmar se ele trabalha com juros simples ou composto por padrão)

**Próximo passo:** Conta A está com a base pronta e validada. Pode iniciar Conta B (frontend) usando as views para os dados do dashboard: `select * from resumo_geral`, `select * from clientes_com_saldo`, `select * from proximos_vencimentos`.

---

## 🅱️ CONTA B — Frontend & UI
**Responsável por:** telas de cadastro de cliente, cadastro de empréstimo, listagem, dashboard geral.

**Feito:**
- [x] Identidade visual definida ("O Livro" — tema livro-caixa/dossiê, ver token system abaixo)
- [x] `app/globals.css` + `tailwind.config.js` — tema completo (cores, tipografia, cards com cantos dourados, selos de status, tabela estilo razão)
- [x] `app/layout.js` — fontes (Fraunces/Inter/JetBrains Mono) + `AuthProvider`
- [x] `components/AuthProvider.js` — contexto de sessão Supabase
- [x] `components/Sidebar.js` — navegação lateral + logout
- [x] `components/ui/Card.js`, `Seal.js`, `StatCard.js` — componentes reutilizáveis
- [x] `app/login/page.js` — login (sem cadastro público, usa `signInWithPassword`)
- [x] `app/(app)/layout.js` — guarda de autenticação (redireciona pra `/login` se não houver sessão) + sidebar
- [x] `app/(app)/dashboard/page.js` — cards de `resumo_geral` + tabela de `proximos_vencimentos`
- [x] `app/(app)/clientes/page.js` — listagem de `clientes_com_saldo` com busca por nome/telefone
- [x] `app/(app)/clientes/novo/page.js` — formulário de cadastro de cliente
- [x] `app/(app)/emprestimos/novo/page.js` — formulário de empréstimo com prévia de cálculo (`calcularParcela`) e chamada a `gerarParcelas()` após o insert
- [x] `jsconfig.json` — alias `@/`
- [x] Atualizado `next` de 14.2.15 → 14.2.35 (corrigia várias vulnerabilidades críticas/altas do npm audit, sem breaking change)
- [x] `npm run build` validado sem erros (testado localmente sem acesso à Google Fonts no sandbox — funciona normalmente na Vercel)

**Falta fazer:**
- [ ] Testar o fluxo real contra o Supabase (preencher `.env.local` com URL/anon key reais e validar login + inserts)
- [ ] Estado vazio / feedback visual melhor pra quando não há associados cadastrados ainda
- [ ] Paginação na listagem de associados se a base crescer muito

**Nota de segurança:** `npm audit` ainda aponta 2 vulnerabilidades altas (server function endpoints / postcss) que só são corrigidas com Next 15/16 (breaking change). Não migrei sem alinhar, mas fica registrado — avaliar se vale migrar antes do deploy final.

**Próximo passo:** Conta C pode seguir com tela de parcelas, alertas de atraso e deploy — o layout `app/(app)/layout.js` já está pronto pra receber novas rotas protegidas (basta criar a pasta dentro de `app/(app)/`).

---

## 🅲️ CONTA C — Integração, Regras de Negócio & Deploy
**Responsável por:** tela de parcelas, alertas de atraso, testes end-to-end, deploy.

**Feito:**
- [ ] (ainda não iniciado)

**Falta fazer:**
- [ ] Tela de parcelas (marcar como pago via `registrarPagamento()`, ver vencidos/próximos)
- [ ] Destaque visual de parcelas atrasadas
- [ ] Teste end-to-end: cadastrar cliente → cadastrar empréstimo → gerar parcelas → pagar → refletir no dashboard
- [ ] Deploy na Vercel + variáveis de ambiente
- [ ] (opcional) Emissão de recibo em PDF

**Próximo passo:** aguardando Conta A e B terem o básico de pé.

---

## Regras gerais pra todas as contas
1. Sempre `git pull` antes de começar a trabalhar.
2. Mexer só na sua área evita conflito de merge (ver README.md pra estrutura de pastas).
3. Commits pequenos e frequentes, com mensagens claras.
4. Antes de parar, atualizar a seção correspondente aqui no STATUS.md.
