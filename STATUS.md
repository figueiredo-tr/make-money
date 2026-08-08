# STATUS DO PROJETO — make-money (Libretto)

> Atualize este arquivo SEMPRE antes de encerrar uma sessão (limite de uso atingido).
> Ao abrir uma conta nova, cole o conteúdo deste arquivo como primeira mensagem pra ela pegar contexto rápido.

Última atualização: 07/08/2026 — Conta A

**🌐 Produção:** https://el-libretto.vercel.app

---

## ✅ RODADA DE VALIDAÇÃO COMPLETA — TUDO FECHADO (07/08)

Depois que a Conta B achou e corrigiu um bug crítico (inserts de `clientes`/`emprestimos` sem `contratante_id`, quebrava cadastro pra contratante não-admin), as 3 contas consolidaram um checklist único e foi executado ponta a ponta:

- [x] Migration `006_perfil_nome.sql` rodada em produção
- [x] Confirmado que `003_juros_dia.sql` e `004_juros_dia_tipo.sql` já estavam rodadas
- [x] **Teste completo logado como contratante NÃO-admin** (não só admin): cadastrar associado → empréstimo (`fixo`/`semanal`) → parcelas geradas corretamente → pagamento → editar associado → editar empréstimo → editar nome em `/perfil` (persistiu após F5) → excluir associado de teste. **Tudo passou.**
- [x] Usuário de teste (`teste@libretto.com`) removido do Auth e de `perfis`
- [x] Projeto renomeado na Vercel — domínio agora é `el-libretto.vercel.app` (nome `libretto` sozinho já estava em uso)

**Conclusão: o sistema está validado ponta a ponta como contratante comum, não só como admin. Base estável pra seguir construindo em cima.**

---

## 🎨 Diretriz de tema visual

Identidade "Libretto" aplicada em todas as telas. Ver `app/globals.css` e `tailwind.config.js`.

---

## 🕳️ PRÓXIMA DECISÃO GRANDE (aguardando o usuário)

Não existe UI pra criar contratante novo — hoje é manual em 3 passos (SQL em `contratantes` → criar usuário no Auth → SQL em `perfis`). As 3 contas concordam que essa é a próxima peça grande, necessária pro produto ser vendável sem depender de SQL manual toda vez que fechar um cliente novo.

**Pergunta em aberto pro usuário:** já tem um 2º contratante real perto de fechar (o que tornaria isso urgente), ou ainda é planejamento? Aguardando resposta pra definir se essa é a próxima feature a construir.

---

## 🏢 Multi-tenant (Contratantes)

**Status: completo e validado (admin E contratante comum).** Ver seção de validação acima.

- Tabelas `contratantes` e `perfis`, RLS em `clientes`/`emprestimos`/`parcelas`/`pagamentos`, trigger `trg_perfis_protect` (impede auto-promoção a admin)
- Views (`clientes_com_saldo`) + função `resumo_por_contratante(uuid)`
- Tela `/admin` (lista contratantes) e `/admin/[id]` (read-only: resumo + associados)
- `schema.sql` e `rls_policies.sql` sincronizados com o estado real de produção (Conta C corrigiu documentação desatualizada)

**Débito técnico consciente (não bloqueia nada):**

- `/admin/[id]` é só leitura
- `BottomNav` sem item "Admin" (só desktop — decisão de escopo, só o Figueiredo usa)
- Seção 8 da migration 005 (`contratante_id not null`) não rodada — opcional, reforça integridade

---

## 👤 Meu Perfil

**Status: completo e validado.** Nome editável (persistência confirmada), e-mail, tipo de acesso, contagem de associados (só contratante). Migration `006` rodada.

---

## 📱 PWA (app instalável)

**Status: completo.** Ícone, favicon, manifest, instalação, navegação mobile (BottomNav + Sidebar responsiva), scroll horizontal em tabelas — tudo testado e funcionando.

---

## 🅰️ CONTA A — Backend & Dados

**Status: concluído e validado.** Schema, RLS, cálculos de juros, parcelas, PWA, mobile, multi-tenant, perfil — tudo rodando em produção sem pendência conhecida.

## 🅱️ CONTA B — Frontend & UI

**Status: concluído e validado.** Fluxo completo (cadastro → empréstimo → parcelas → pagamento → quitação), ficha do associado, edição/exclusão, PWA, e o fix crítico de `contratante_id` nos inserts — já testado como contratante não-admin, confirmado funcionando.

## 🅲️ CONTA C — Integração, Regras de Negócio & Deploy

**Status: concluído e validado.** Editar/excluir associado e empréstimo (com trava de campos se já tem parcela paga), juros por atraso (%/valor fixo), deploy, documentação (`schema.sql`/`rls_policies.sql`) sincronizada — tudo testado como contratante não-admin.

**Nenhuma das 3 contas tem pendência crítica em aberto no momento.** Próximo passo depende da decisão do usuário sobre priorizar "criar contratante novo" ou outra direção.

---

## Regras gerais pra todas as contas

1. Sempre `git pull` antes de começar a trabalhar.
2. Mexer só na sua área evita conflito de merge — se precisar cruzar pra área de outra conta, registrar aqui claramente o que mudou e por quê. Mudança de schema (mesmo pequena) sempre precisa de um arquivo em `supabase/migrations/`, mesmo que já tenha sido rodada manualmente no Supabase.
3. Commits pequenos e frequentes, com mensagens claras.
4. Antes de parar, atualizar a seção correspondente aqui no STATUS.md.
5. **Ao rodar migrations grandes no SQL Editor do Supabase**, lembrar que é tudo uma transação só — erro no meio desfaz o que já tinha rodado antes.
6. **Sempre testar fluxos críticos logado como contratante comum, não só como admin** — RLS pode se comportar diferente e só aparece testando com o usuário real.
