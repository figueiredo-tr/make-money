# STATUS DO PROJETO — make-money

> Atualize este arquivo SEMPRE antes de encerrar uma sessão (limite de uso atingido).
> Ao abrir uma conta nova, cole o conteúdo deste arquivo como primeira mensagem pra ela pegar contexto rápido.

Última atualização: 05/08/2026 — Conta A

---

## 🎨 Diretriz de tema visual

Identidade "Libretto" aplicada em todas as telas, incluindo a ficha de cliente e parcelas. Ver `app/globals.css` e `tailwind.config.js`.

---

## 📱 PWA (app instalável) — NOVO, requer ação da Conta B e C

O objetivo é o sistema funcionar "como um app" no celular do contratante (instalável, tela cheia, sem barra do navegador). Trabalho já adiantado pela Conta A:

- [x] `app/layout.js` — `metadata` atualizado com `manifest: '/manifest.json'` e `appleWebApp` (tela cheia no iPhone) + export `viewport` com `themeColor: '#0a0a0a'`
- [x] Ícones gerados: `icon-192.png` e `icon-512.png` (monograma "L" dourado sobre vinho escuro, moldura circular — linha "old money" combinando com o tema)

**Pendente (Conta B):**

- [ ] Colocar `icon-192.png` e `icon-512.png` dentro de `public/` (ícones de placeholder — se a Conta B tiver uma identidade visual mais elaborada definida, pode substituir por uma versão própria, só manter os tamanhos 192x192 e 512x512)
- [ ] Criar `public/manifest.json` com este conteúdo:

```json
{
  "name": "Libretto",
  "short_name": "Libretto",
  "description": "Sistema de gestão de empréstimos",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] Revisar UI com foco mobile-first (o contratante usa mais celular): botões maiores, considerar navegação por abas fixas embaixo tipo app nativo, evitar tabelas largas com scroll horizontal nas telas de parcelas/clientes

**Pendente (Conta C):**

- [ ] Trocar nome do projeto na Vercel de `make-m0n3yy` pra `libretto` (Settings > General > Project Name) — isso já muda a URL pra `libretto.vercel.app` automaticamente
- [ ] Depois do deploy com manifest + ícones, testar no celular: abrir o site e conferir se aparece "Adicionar à tela inicial" / "Instalar app"

---

## 🅰️ CONTA A — Backend & Dados

**Status: concluído**, incluindo os ajustes que a Conta B trouxe em `lib/calculos.js` e `lib/parcelas.js`:

- Adicionado modo de juros **`fixo`** (taxa única sobre o valor, não multiplicada por parcela) em `calcularParcela()` — mantém `simples`/`composto` como estavam
- Adicionada **`periodicidade`** (`mensal`/`semanal`) em `gerarParcelas()` — default `mensal`, não quebra nada existente
- **Migração já aplicada em produção e agora registrada no repositório:** `supabase/migrations/002_periodicidade_juros_fixo.sql` (coluna `periodicidade` em `emprestimos` + `tipo_juros` liberando `'fixo'`). Ela já tinha sido rodada direto no Supabase antes de o arquivo existir no repo — o `schema.sql` base foi atualizado junto pra não ficar divergente do banco real. Se for provisionar um Supabase novo do zero: rodar `schema.sql` e depois as migrations em `supabase/migrations/` em ordem.
- Ajuste de `app/layout.js` (metadata/viewport) e geração dos ícones PWA — ver seção acima.

---

## 🅱️ CONTA B — Frontend & UI

**Status: concluído e em produção** (https://make-m0n3yy.vercel.app — domínio será trocado pra libretto.vercel.app, ver pendência da Conta C acima).

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
- [ ] Ver pendências de PWA na seção acima (ícones, manifest, revisão mobile-first)

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
- [ ] Ver pendências de PWA na seção acima (trocar nome do projeto na Vercel, testar instalação no celular)

---

## Regras gerais pra todas as contas

1. Sempre `git pull` antes de começar a trabalhar.
2. Mexer só na sua área evita conflito de merge (ver README.md pra estrutura de pastas) — se precisar cruzar pra área de outra conta, registrar aqui claramente o que mudou e por quê, e sinalizar pra quem for revisar. Mudança de schema (mesmo pequena) sempre precisa de um arquivo em `supabase/migrations/`, mesmo que já tenha sido rodada manualmente no Supabase — senão o repo fica mentindo sobre o estado real do banco.
3. Commits pequenos e frequentes, com mensagens claras.
4. Antes de parar, atualizar a seção correspondente aqui no STATUS.md.
