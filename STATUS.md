# STATUS DO PROJETO — make-money (Libretto)

> Atualize este arquivo SEMPRE antes de encerrar uma sessão (limite de uso atingido).
> Ao abrir uma conta nova, cole o conteúdo deste arquivo como primeira mensagem pra ela pegar contexto rápido.

Última atualização: 07/08/2026 — Conta A

**🌐 Produção:** https://el-libretto.vercel.app

---

## 📝 ANOTAÇÕES + DETALHE DE ASSOCIADO NO ADMIN

**Status: código confirmado no repositório + migration rodada. TESTE FUNCIONAL PENDENTE (fica pra amanhã).**

**⚠️ Nota de processo importante:** essa feature já tinha sido marcada como "concluída" numa atualização anterior deste arquivo, mas o código nunca tinha sido de fato commitado — só o STATUS.md tinha subido (a Conta C pegou isso e avisou o usuário). Lição: **daqui pra frente, só marcar algo como entregue depois de confirmar `git log --stat` mostrando os arquivos reais no commit**, não só pela conversa. Dessa vez foi confirmado via print do `git log -1 --stat` (commit `cb12b2068d...`, 8 arquivos, 486 inserções).

**O que está confirmado no repositório:**

- `supabase/migrations/007_anotacoes.sql` — tabela `anotacoes` + RLS por contratante (via join com `clientes`). **Rodada em produção pelo usuário, confirmado.**
- `lib/anotacoes.js` — `listarAnotacoes()`, `criarAnotacao()`, `excluirAnotacao()`
- `components/ui/AnotacoesAssociado.js` — componente reutilizável (prop `somenteLeitura`)
- `app/(app)/clientes/[id]/page.js` — ficha normal do contratante, com bloco de anotações (criar/excluir)
- `app/(app)/admin/associado/[id]/page.js` — nova rota, detalhe completo (empréstimos + parcelas) somente leitura pro financeiro, mas com anotações editáveis
- `app/(app)/admin/[id]/page.js` — nome do associado agora linka pra rota acima

**🐛 Bug de rota corrigido durante essa sessão:** o arquivo da nova página foi criado numa pasta (`admin/associados`, plural) diferente do link que apontava pra ela (`admin/associado`, singular) — dava 404. Usuário corrigiu renomeando a pasta pra singular; o link no código foi ajustado pra bater (2 idas e vindas até convergir, ver histórico de commits se precisar entender a sequência). **Estado final confirmado consistente:** pasta `app/(app)/admin/associado/[id]/` + link `/admin/associado/${id}` — os dois em singular.

**⏳ Teste funcional — fica pra amanhã (usuário confirmou, sem pressa):**

1. Como admin: Admin → contratante → clica num associado → confirma que abre sem 404 → cria uma anotação
2. Como contratante: abre a ficha normal desse mesmo associado, confirma que a anotação criada pelo admin aparece (mesma tabela, mesmo `cliente_id` — esperado que apareça pros dois lados)
3. Cria uma anotação pelo lado do contratante, confirma que salva e aparece (mais recente primeiro)
4. Testa excluir uma anotação, confirma que some

**Só marcar essa seção como "concluído e validado" depois desse teste ser feito e confirmado pelo usuário.**

---

## ✅ Validação completa anterior (07/08)

Fluxo core testado ponta a ponta logado como contratante NÃO-admin (cadastro, empréstimo, parcelas, pagamento, edição, exclusão, perfil) — tudo passou. Usuário de teste removido. Domínio trocado pra `el-libretto.vercel.app`.

---

## 🎨 Diretriz de tema visual

Identidade "Libretto" aplicada em todas as telas. Ver `app/globals.css` e `tailwind.config.js`.

---

## 🕳️ PRÓXIMA DECISÃO GRANDE (ainda em aberto)

Não existe UI pra criar contratante novo — hoje é manual em 3 passos (SQL em `contratantes` → criar usuário no Auth → SQL em `perfis`). Usuário ainda não tem 2º contratante fechado, mas pretende expandir. Sem decisão de quando priorizar.

---

## 🏢 Multi-tenant (Contratantes)

**Status: completo e validado.** Tabelas `contratantes`/`perfis`, RLS em todas as tabelas de dados (incluindo `anotacoes`), trigger `trg_perfis_protect`, área `/admin` → `/admin/[id]` → `/admin/associado/[id]` (novo, ver seção acima).

**Débito técnico consciente:**

- `BottomNav` sem item "Admin" (só desktop)
- Seção 8 da migration 005 (`contratante_id not null`) não rodada — opcional

---

## 👤 Meu Perfil

**Status: completo e validado.**

## 📱 PWA (app instalável)

**Status: completo e validado.**

---

## 🅰️ CONTA A — Backend & Dados

**Status: anotações com código no repo + migration rodada, teste funcional pendente pra amanhã.** Resto (schema, RLS, multi-tenant, perfil, PWA) validado e estável.

## 🅱️ CONTA B — Frontend & UI

**Status: concluído e validado.**

## 🅲️ CONTA C — Integração, Regras de Negócio & Deploy

**Status: concluído e validado.** Detectou corretamente que o código de anotações não tinha sido commitado numa checagem anterior — bom trabalho de revisão, vale manter esse hábito de conferir `git log` antes de aceitar "está pronto" de qualquer conta.

---

## Regras gerais pra todas as contas

1. Sempre `git pull` antes de começar a trabalhar.
2. Mexer só na sua área evita conflito de merge — se precisar cruzar pra área de outra conta, registrar aqui claramente o que mudou e por quê. Mudança de schema (mesmo pequena) sempre precisa de um arquivo em `supabase/migrations/`, mesmo que já tenha sido rodada manualmente no Supabase.
3. Commits pequenos e frequentes, com mensagens claras.
4. Antes de parar, atualizar a seção correspondente aqui no STATUS.md.
5. **Ao rodar migrations grandes no SQL Editor do Supabase**, lembrar que é tudo uma transação só — erro no meio desfaz o que já tinha rodado antes.
6. **Sempre testar fluxos críticos logado como contratante comum, não só como admin.**
7. **Nunca marcar uma feature como "concluída" no STATUS.md sem confirmar via `git log --stat` (ou o usuário confirmando explicitamente) que o código realmente foi commitado e pushado** — a conversa com o usuário não é garantia de que o push aconteceu.
