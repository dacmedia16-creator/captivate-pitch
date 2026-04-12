

# Adicionar Preferência "Mesmo Condomínio"

## O que muda

### 1. Novo campo `preferSameCondominium` na interface e UI

**Arquivo:** `src/components/wizard/StepMarketStudy.tsx`

- Adicionar `preferSameCondominium: boolean` à interface `MarketStudyData`
- Adicionar um novo card ou item dentro do card "Filtros de pesquisa" com um Switch: **"Priorizar imóveis no mesmo condomínio"** com descrição explicativa

### 2. Estado inicial

**Arquivo:** `src/pages/agent/AgentNewPresentation.tsx`

- Adicionar `preferSameCondominium: false` ao `emptyMarket`
- Passar esse flag nos filtros enviados ao `market_analysis_jobs` e à edge function `analyze-market`

### 3. Usar a preferência no scraping/IA

**Arquivo:** `supabase/functions/analyze-market/index.ts`

- Quando `filters.preferSameCondominium === true` e `property.condominium` estiver preenchido, adicionar o nome do condomínio à query de busca do Firecrawl para priorizar resultados do mesmo condomínio
- No prompt do AI, instruir para dar preferência a imóveis do mesmo condomínio

### 4. Boost de similaridade

**Arquivo:** `supabase/functions/analyze-market/index.ts`

- Na função `computeSimilarity`, quando `preferSameCondominium` estiver ativo e o comparable tiver o mesmo condomínio (extraído pela IA), adicionar +10 pontos de similaridade

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/wizard/StepMarketStudy.tsx` | Modificar — adicionar `preferSameCondominium` à interface + Switch na UI |
| `src/pages/agent/AgentNewPresentation.tsx` | Modificar — `emptyMarket` + filtros |
| `supabase/functions/analyze-market/index.ts` | Modificar — query de busca + prompt + similaridade |

