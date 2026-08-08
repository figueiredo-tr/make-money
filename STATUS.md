# STATUS DO PROJETO — make-money (Libretto)

> Atualize este arquivo SEMPRE antes de encerrar uma sessão (limite de uso atingido).
> Ao abrir uma conta nova, cole o conteúdo deste arquivo como primeira mensagem pra ela pegar contexto rápido.

Última atualização: 07/08/2026 — Conta A

**🌐 Produção:** https://el-libretto.vercel.app

---

## 📝 ANOTAÇÕES + DETALHE DE ASSOCIADO NO ADMIN — NOVO

**Pedido do usuário:** cada contratante isolado dos outros (já existia via multi-tenant), admin com visão de tudo, e uma forma de anotar observações livres por associado.

**Implementado (Conta A):**

- Migration `supabase/migrations/007_anotacoes.sql`: nova tabela `anotacoes` (`cliente_id`, `texto`, `created_at`, `created_by`), RLS seguindo o mesmo padrão de isolamento por contratante (via join com `clientes`). Sem `UPDATE` de propósito — é um registro histórico tipo "bloco de notas", corrige excluindo e recriando, não editando
- `lib/anotacoes.js` — `listarAnotacoes()`, `criarAnotacao()`, `excluirAnotacao()`
- `components/ui/AnotacoesAssociado.js` — componente reutilizável (prop `somenteLeitura`), usado em 2 lugares:
  - `app/(app)/clientes/[id]/page.js` (ficha normal do contratante) — pode criar/excluir
  - `app/(app)/admin/associado/[id]/page.js` (nova rota) — também pode criar/excluir (admin pode registrar observações ao revisar)
- **Nova rota `app/(app)/admin/associado/[id]/page.js`**: mostra os empréstimos completos de um associado específico (com parcelas, igual à ficha normal), 100% somente leitura pros dados financeiros — só as anotações são editáveis ali
- `app/(app)/admin/[id]/page.js` atualizado: nome do associado na tabela agora é link pra essa nova rota

**Pendências:**

- [ ] **Rodar `007_anotacoes.sql` no Supabase** — ainda não aplicado em produção
- [ ] Testar: criar anotação na ficha normal (como contratante), confirmar que aparece; testar como admin em `/admin/associado/[id]`, confirmar drill-down mostra os empréstimos certos e que anotações criadas por admin também aparecem pro contratante (mesma tabela, mesmo cliente_id)
- [ ] Confirmar que o link "Nome do associado" na tabela `/admin/[id]` está navegando certo

---

## ✅ Validação completa anterior (07/08) — segue de pé

Fluxo testado ponta a ponta logado como contratante NÃO-admin (cadastro, empréstimo, parcelas, pagamento, edição, exclusão, perfil) — tudo passou. Usuário de teste removido. Domínio trocado pra `el-libretto.vercel.app`. Detalhes no histórico do repositório se precisar consultar.

---

## 🎨 Diretriz de tema visual

Identidade "Libretto" aplicada em todas as telas. Ver `app/globals.css` e `tailwind.config.js`.

---

## 🕳️ PRÓXIMA DECISÃO GRANDE (ainda em aberto)

Não existe UI pra criar contratante novo — hoje é manual em 3 passos (SQL em `contratantes` → criar usuário no Auth → SQL em `perfis`). Usuário confirmou que ainda não tem 2º contratante fechado, mas a intenção é expandir. Ainda sem decisão de quando priorizar isso.

---

## 🏢 Multi-tenant (Contratantes)

**Status: completo e validado.** Tabelas `contratantes`/`perfis`, RLS em todas as tabelas de dados (incluindo `anotacoes` agora), trigger `trg_perfis_protect`, views atualizadas, área `/admin` com lista de contratantes → `/admin/[id]` (resumo + lista de associados) → `/admin/associado/[id]` (detalhe completo somente leitura, novo).

**Débito técnico consciente:**

- `BottomNav` sem item "Admin" (só desktop)
- Seção 8 da migration 005 (`contratante_id not null`) não rodada — opcional

---

## 👤 Meu Perfil

**Status: completo e validado.** Nome editável, e-mail, tipo de acesso, contagem de associados.

## 📱 PWA (app instalável)

**Status: completo e validado.** Ícone, manifest, instalação, navegação mobile, scroll horizontal em tabelas.

---

## 🅰️ CONTA A — Backend & Dados

**Status: anotações + drill-down admin entregues, aguardando migration 007 rodar em produção.** Resto (schema, RLS, multi-tenant, perfil, PWA) validado e estável.

## 🅱️ CONTA B — Frontend & UI

**Status: concluído e validado.** Fluxo completo, ficha do associado (agora com anotações), fix crítico de `contratante_id` confirmado funcionando.

## 🅲️ CONTA C — Integração, Regras de Negócio & Deploy

**Status: concluído e validado.** Editar/excluir, juros por atraso, deploy, documentação sincronizada.

---

## Regras gerais pra todas as contas

1. Sempre `git pull` antes de começar a trabalhar.
2. Mexer só na sua área evita conflito de merge — se precisar cruzar pra área de outra conta, registrar aqui claramente o que mudou e por quê. Mudança de schema (mesmo pequena) sempre precisa de um arquivo em `supabase/migrations/`, mesmo que já tenha sido rodada manualmente no Supabase.
3. Commits pequenos e frequentes, com mensagens claras.
4. Antes de parar, atualizar a seção correspondente aqui no STATUS.md.
5. **Ao rodar migrations grandes no SQL Editor do Supabase**, lembrar que é tudo uma transação só — erro no meio desfaz o que já tinha rodado antes.
6. **Sempre testar fluxos críticos logado como contratante comum, não só como admin** — RLS pode se comportar diferente e só aparece testando com o usuário real.
