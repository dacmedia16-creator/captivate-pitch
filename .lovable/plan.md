

# Fase 2 — Otimizações de Performance

## O que será feito

### 1. AgentDashboard — Filtrar queries de studies e templates
**Arquivo**: `src/pages/agent/AgentDashboard.tsx`

As queries de `market_analysis_jobs` e `presentation_templates` não filtram por usuário/tenant, forçando RLS a avaliar todas as linhas.

- `market_analysis_jobs`: adicionar filtro via sub-query — buscar presentations do broker e filtrar por `presentation_id`
- `presentation_templates`: adicionar filtro `.eq("tenant_id", tenantId)` usando `profile.tenant_id` do AuthContext

### 2. AgentNewPresentation — Paralelizar geração
**Arquivo**: `src/pages/agent/AgentNewPresentation.tsx`

Após criar a presentation, as operações de fotos, market job e sections são sequenciais. Paralelizar:
- Fotos e market job insert podem rodar em paralelo
- Após market job: comparables insert, report insert e job update podem ser agrupados
- Os 2 updates de sections (pricing_scenarios + market_study_placeholder) podem rodar em `Promise.all()`

### 3. Edge function — Paralelizar queries de dados
**Arquivo**: `supabase/functions/generate-presentation-text/index.ts`

As queries de branding, broker_profiles, profiles e market_analysis_jobs são sequenciais (linhas 68-84). Agrupar em `Promise.all()`:

```text
Antes (sequencial):
  branding → broker → brokerProfile → jobs → (comps + report)

Depois (paralelo):
  Promise.all([branding, broker, brokerProfile, jobs])
  → if jobs: Promise.all([comps, report])
```

### 4. AuthContext — Buscar tenant name em paralelo
**Arquivo**: `src/contexts/AuthContext.tsx`

A query de `tenants.name` é feita após o profile carregar (sequencial). Mover para dentro do `Promise.all` inicial junto com profile e role, usando o tenant_id do profile após resolver.

## Resumo de impacto

| Correção | Ganho estimado |
|---|---|
| Dashboard queries filtradas | -200-500ms no load |
| Geração paralelizada | -1-3s na criação |
| Edge function paralela | -300-800ms na chamada AI |
| Auth tenant paralelo | -100-200ms no login |

