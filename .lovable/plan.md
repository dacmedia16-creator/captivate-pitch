

# Integrar Metodologia Completa de Pesquisa Real no Estudo de Mercado

## Situação Atual

O sistema já possui uma pipeline funcional:
1. **Wizard** (StepMarketStudy) → seleciona portais e filtros
2. **Edge functions** → `analyze-market-manus` (Manus AI, navega portais) com fallback para `analyze-market` (Firecrawl + Gemini)
3. **Frontend** → salva comparáveis, calcula scores, gera relatório AI

O problema: a pesquisa atual é superficial — o Firecrawl faz busca textual e a IA extrai dados dos snippets, sem validar links individualmente. O Manus tenta navegar mas tem timeout de 55s e frequentemente falha.

## Plano: Nova Edge Function `analyze-market-deep`

Criar uma nova edge function robusta que implementa a metodologia completa, substituindo o fluxo atual.

### 1. Nova edge function `analyze-market-deep`

**Arquivo:** `supabase/functions/analyze-market-deep/index.ts`

Estratégia em 3 fases:

**Fase 1 — Busca ampla por portal** (Firecrawl Search)
- Para cada portal configurado, fazer busca via Firecrawl com `site:portal.com.br` + filtros do imóvel
- Coletar até 15 URLs por portal
- Registrar contagem total de resultados por portal

**Fase 2 — Validação individual** (Firecrawl Scrape)
- Abrir cada URL individualmente via Firecrawl scrape (markdown)
- Verificar se o anúncio está ativo (não 404, não expirado)
- Extrair dados completos via AI (título, preço, área, quartos, endereço, link real, diferenciais, imobiliária)
- Descartar duplicatas (mesmo imóvel em portais diferentes — comparar por endereço + área + preço)
- Registrar motivo de descarte

**Fase 3 — Scoring e análise** (Lovable AI)
- Calcular similarity score usando a mesma lógica de `useMarketSimilarity.ts`
- Gerar análise de mercado completa: média, mediana, dispersão, faixa sugerida
- Gerar justificativa textual com referência aos comparáveis
- Retornar metadados de transparência (links abertos, descartados, filtros, limitações)

**Response shape:**
```json
{
  "success": true,
  "comparables": [...],
  "research_metadata": {
    "portals_checked": [...],
    "total_listings_found": 42,
    "listings_opened": 25,
    "listings_discarded": 10,
    "discard_reasons": [...],
    "filters_used": {...},
    "collected_at": "2026-04-12T...",
    "limitations": [...]
  },
  "pricing_analysis": {
    "avg_price": ...,
    "median_price": ...,
    "avg_price_per_sqm": ...,
    "suggested_ad_price": ...,
    "suggested_market_price": ...,
    "suggested_fast_sale_price": ...,
    "executive_summary": "...",
    "justification": "..."
  }
}
```

### 2. Atualizar fluxo do wizard

**Arquivo:** `src/pages/agent/AgentNewPresentation.tsx`

- Substituir a chamada `analyze-market-manus` → `analyze-market-deep` como método primário
- Manter `analyze-market` (Firecrawl simples) como fallback rápido
- Salvar `research_metadata` no campo `raw_data` ou `filters` do `market_analysis_jobs`
- Mostrar toast com contagem: "X anúncios encontrados, Y validados, Z selecionados"

### 3. Exibir transparência da pesquisa na UI

**Arquivo:** `src/pages/agent/MarketStudyResult.tsx`

- Novo card "Transparência da Pesquisa" mostrando:
  - Portais pesquisados + quantidade de resultados cada
  - Total de links abertos vs descartados (com motivos)
  - Filtros utilizados
  - Data/hora da coleta
  - Limitações encontradas

### 4. Salvar metadados na tabela existente

**Migração:** Adicionar coluna `research_metadata jsonb` na tabela `market_study_results`

Para armazenar os dados de transparência sem alterar a estrutura atual.

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/analyze-market-deep/index.ts` | **Criar** — nova edge function |
| `src/pages/agent/AgentNewPresentation.tsx` | **Modificar** — usar nova function |
| `src/pages/agent/MarketStudyResult.tsx` | **Modificar** — card de transparência |
| Migração SQL | **Criar** — coluna `research_metadata` |

## Limitações Conhecidas

- Firecrawl scrape individual consome mais créditos (1 crédito por URL aberta)
- Edge functions têm timeout de ~60s — a fase 2 será limitada a ~15 URLs para caber no tempo
- Portais com anti-scraping (ZAP, VivaReal) podem bloquear scrape individual — tratamento de erro gracioso

