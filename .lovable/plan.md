

# Relatório de Auditoria Técnica — Motor de Busca de Mercado

## Resumo Executivo

A arquitetura do fluxo oficial (`market_studies`) está **parcialmente consolidada**. O fluxo legado está corretamente isolado como read-only. Porém há um **bug crítico de perda de dados** no modo background: quando `analyze-market-deep` roda via `EdgeRuntime.waitUntil` (retorna 202), os comparáveis extraídos pela IA **nunca são salvos no banco** porque o frontend faz `return` antes do código de inserção, e a edge function não insere comparáveis.

---

## Evidências por Arquivo

### 1. Fluxo Oficial (market_studies) — Status: ATIVO

| Evidência | Arquivo | Estado |
|-----------|---------|--------|
| Tabelas oficiais existem no DB | Schema (market_studies, market_study_comparables, etc.) | ✅ Publicado |
| RLS policies em todas as tabelas | Schema RLS | ✅ Publicado |
| Rotas oficiais | `App.tsx` linhas 85-87 (`/market-studies`, `/market-studies/:id`) | ✅ Publicado |
| Páginas oficiais | `MarketStudies.tsx`, `MarketStudyResult.tsx` | ✅ Publicado |
| Wizard cria market_study | `AgentNewPresentation.tsx` | ✅ Publicado |
| Inserção de comparáveis no frontend | `AgentNewPresentation.tsx` linha 283 | ✅ Publicado |
| seed-demo usa fluxo oficial | `seed-demo/index.ts` | ✅ Publicado |

### 2. Fluxo Legado — Status: READ-ONLY CONTROLADO

| Evidência | Arquivo | Estado |
|-----------|---------|--------|
| Fallback read-only com comentário `// LEGACY COMPAT` | `useGeneratePresentation.ts` linha 63 | ✅ Correto |
| Fallback read-only com comentário `// LEGACY COMPAT` | `generate-presentation-text/index.ts` linha 87 | ✅ Correto |
| Tabelas legadas no schema (market_analysis_jobs, market_comparables, market_reports) | `types.ts` | ✅ Existem, sem writes |
| Páginas legadas removidas (AgentMarketStudy, MarketStudyDetail) | Busca retorna 0 resultados | ✅ Removidas |
| Redirects legados funcionais | `App.tsx` linhas 83-84 | ✅ Publicado |

### 3. Código Morto Encontrado

| Arquivo | Problema |
|---------|----------|
| `src/hooks/useSimulateComparables.ts` | 210 linhas, **nunca importado**, referencia `market_analysis_job_id` (legado). Código morto. |

### 4. Edge Functions de Scraping — Cascata

| Função | Papel | Estado |
|--------|-------|--------|
| `analyze-market-manus` | Tentativa 1 (Manus API) | Publicada |
| `analyze-market-deep` | Tentativa 2 (Firecrawl + IA) — **principal** | Publicada, 1301 linhas |
| `analyze-market` | Tentativa 3 (Firecrawl básico) | Publicada |

### 5. Migrations

13 migrations publicadas (todas em `supabase/migrations/`). Não foi possível confirmar conteúdo individual sem leitura completa, mas todas estão no repositório.

---

## Riscos Encontrados

### 🔴 CRÍTICO — Comparáveis perdidos no modo background

**Arquivo**: `AgentNewPresentation.tsx` linhas 221-226 + `analyze-market-deep/index.ts`

Quando `analyze-market-deep` retorna 202 (background processing):
- Frontend faz `return;` na linha 226 — **nunca executa** o código de scoring e inserção de comparáveis (linhas 271-341)
- `analyze-market-deep` atualiza `market_studies.status` para `completed` ou `failed`, mas **não insere nenhum registro** em `market_study_comparables`, `market_study_adjustments`, ou `market_study_results`
- Resultado: estudo fica com status `completed` mas **0 comparáveis** no banco

**Impacto**: Todo estudo que passa pelo modo background (que é o caminho mais comum agora) perde todos os dados extraídos.

### 🟡 MÉDIO — Sem polling no frontend

Quando o estudo roda em background, o frontend mostra toast "processando em background" e faz `return`. Não há polling para atualizar a UI quando o estudo termina. O usuário precisa recarregar a página manualmente.

### 🟡 MÉDIO — Estudos travados em "processing"

Estudos Cannes, Cannes 22, Cannes 23 estão com status `processing` permanentemente. Não há mecanismo de cleanup ou timeout.

### 🟢 BAIXO — Código morto

`useSimulateComparables.ts` — 210 linhas sem uso, referenciando schema legado.

---

## Conclusão Final

**Arquitetura: PARCIALMENTE CONSOLIDADA com bug crítico de dados**

- ✅ Tabelas oficiais, RLS, rotas, páginas — tudo correto e publicado
- ✅ Legado corretamente isolado como read-only
- ✅ Páginas legadas removidas, redirects funcionais
- 🔴 **Bug crítico**: modo background não salva comparáveis no banco
- 🟡 Sem polling de status no frontend
- 🟡 Estudos órfãos em "processing" sem cleanup

---

## Prompt Sugerido para o Lovable

```
Corrigir o bug crítico do modo background do analyze-market-deep:

1. Mover a lógica de scoring, inserção de comparáveis, adjustments e results 
   de AgentNewPresentation.tsx para DENTRO da edge function analyze-market-deep.
   A edge function já tem service_role e roda em background — ela deve salvar 
   tudo diretamente no banco (market_study_comparables, market_study_adjustments, 
   market_study_results) e atualizar market_studies.status para "completed".

2. Adicionar polling no frontend: quando o estudo está em "processing", 
   fazer polling a cada 5s no status do market_study. Quando mudar para 
   "completed", recarregar os dados e continuar o wizard.

3. Criar migration para atualizar estudos órfãos: UPDATE market_studies 
   SET status = 'failed' WHERE status = 'processing' 
   AND updated_at < now() - interval '15 minutes'.

4. Deletar src/hooks/useSimulateComparables.ts (código morto).

Ordem de prioridade: 1 > 2 > 3 > 4.
```

