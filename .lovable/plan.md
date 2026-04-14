
# Fase Final — Consolidação do Estudo de Mercado

## Diagnóstico atual

### Onde o legado ainda vive

| Local | Tabelas legadas usadas | Necessário? |
|-------|----------------------|-------------|
| `useGeneratePresentation.ts` L62-73 | `market_analysis_jobs`, `market_comparables`, `market_reports` | Sim — apresentações antigas sem `market_study_id` |
| `generate-presentation-text/index.ts` L87-95 | Idem | Sim — mesma razão |
| `AgentMarketStudy.tsx` | `market_analysis_jobs` | Não — já marcado `@deprecated`, rotas redirecionam |
| `MarketStudyDetail.tsx` | `market_analysis_jobs`, `market_comparables`, `market_reports` | Não — já marcado `@deprecated`, rotas redirecionam |
| `useMarketCalculations.ts` (useSaveMarketReport) | `market_reports` | Não — já marcado `@deprecated` |
| `seed-demo/index.ts` | `market_analysis_jobs`, `market_comparables`, `market_reports` | Deveria ser atualizado para o fluxo novo |

### Rotas atuais

- `/market-studies` → `MarketStudies.tsx` — **oficial**
- `/market-studies/:id` → `MarketStudyResult.tsx` — **oficial**
- `/market-study` → `Navigate` para `/market-studies` — **redirect OK**
- `/market-study/:id` → `LegacyStudyRedirect` — **redirect OK**

### Rastreabilidade

Já existe estrutura suficiente:
- `market_study_executions` — portal, status, contagens, erro
- `market_study_raw_listings` — dados brutos por portal/execução
- `market_study_comparables.origin` — manual vs auto
- `market_study_comparables.raw_listing_id` — link ao listing bruto

Não é necessário criar novas tabelas.

---

## Decisões

1. **Tabelas legadas** (`market_analysis_jobs`, `market_comparables`, `market_reports`) — ficam somente leitura no banco. Nenhum código novo deve escrever nelas.
2. **Fallback no backend** — mantido apenas em `generate-presentation-text` e `useGeneratePresentation`, com comentário explícito `// LEGACY COMPAT: read-only fallback for pre-migration presentations`.
3. **Páginas legadas** — `AgentMarketStudy.tsx` e `MarketStudyDetail.tsx` podem ser deletadas (rotas já redirecionam).
4. **seed-demo** — atualizar para criar dados no fluxo novo.

---

## Plano de implementação

### Etapa 1 — Rotas e navegação
- Deletar `AgentMarketStudy.tsx` e `MarketStudyDetail.tsx`
- Remover imports e lazy loads correspondentes do `App.tsx`
- Manter os `Navigate`/`LegacyStudyRedirect` para URLs antigas
- Sidebar já aponta para `/market-studies` — sem mudança

### Etapa 2 — Fallbacks legados
- Em `useGeneratePresentation.ts`: adicionar comentário claro `// LEGACY COMPAT (read-only)` no bloco else
- Em `generate-presentation-text/index.ts`: idem
- Em `useMarketCalculations.ts`: remover `useSaveMarketReport` (deprecated, não usado pelo fluxo novo)

### Etapa 3 — seed-demo
- Atualizar `seed-demo/index.ts` para criar `market_studies`, `market_study_subject_properties`, `market_study_comparables`, `market_study_results` em vez das tabelas legadas
- Setar `presentations.market_study_id` no seed

### Etapa 4 — Documentação
- Atualizar `mem://features/market-study-architecture` com status final
- Listar tabelas legadas como "read-only, não deletar"

### Etapa 5 — Validação
- Testar criação de apresentação nova (fluxo oficial)
- Testar geração de textos com IA
- Testar `/market-studies` e `/market-studies/:id`
- Testar redirect de `/market-study`

### Riscos e rollback
- **Risco**: apresentações antigas sem `market_study_id` — mitigado pelo fallback mantido
- **Rollback**: restaurar arquivos deletados do git se necessário (são páginas isoladas)

### Tabelas legadas — decisão final

| Tabela | Ação |
|--------|------|
| `market_analysis_jobs` | Manter no banco (read-only). Não deletar. |
| `market_comparables` | Idem |
| `market_reports` | Idem |

Podem ser removidas no futuro após migração de dados históricos (se desejado).
