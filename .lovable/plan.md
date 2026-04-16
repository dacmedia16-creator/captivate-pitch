

# Dividir Estudo de Mercado em 3 Slides

## Visão geral

Atualmente, todo o conteúdo do estudo de mercado (imóvel avaliado, métricas, gráfico e tabela de comparáveis) está comprimido em 1 único slide. Vamos dividir em 3 slides distintos:

1. **Slide 1 — Imóvel Avaliado**: Dados do imóvel (tipo, padrão, conservação, idade, área, quartos, diferenciais)
2. **Slide 2 — Estatísticas de Mercado**: Métricas (preço médio, mediana, R$/m², total comparáveis) + gráfico de barras
3. **Slide 3 — Comparáveis**: Tabela detalhada dos comparáveis com preço, m², R$/m², score

## Mudanças

### 1. `useGeneratePresentation.ts` — Criar 3 section_keys

Substituir o único `market_study_placeholder` (order 11) por 3 novas seções em `SECTION_DEFINITIONS`:

```
{ key: "market_study_subject", title: "Imóvel Avaliado", order: 11 }
{ key: "market_study_stats", title: "Estatísticas de Mercado", order: 12 }
{ key: "market_study_comparables", title: "Comparáveis de Mercado", order: 13 }
```

Ajustar `pricing_scenarios` para order 14, `required_documentation` 15, `closing` 16.

No `switch`, as 3 novas seções compartilham os mesmos dados (report, comparables, subjectProperty), cada uma com o conteúdo completo para que o layout decida o que renderizar.

### 2. `syncMarketStudySections.ts` — Sincronizar 3 seções

Atualizar para fazer upsert nas 3 novas section_keys (`market_study_subject`, `market_study_stats`, `market_study_comparables`) em vez do antigo `market_study_placeholder`.

### 3. Layouts (3 arquivos) — Renderizar 3 slides separados

Em cada layout (`LayoutExecutivo`, `LayoutPremium`, `LayoutImpactoComercial`):

**Slide `market_study_subject`**: Header "Análise de Mercado" + bloco do imóvel avaliado (tipo, padrão, conservação, idade, área, quartos, suítes, vagas, banheiros, diferenciais). Mais espaço para detalhes.

**Slide `market_study_stats`**: Header "Estatísticas de Mercado" + MarketStats (4 métricas grandes) + MarketPriceBarChart (gráfico expandido, não compact). Com referência do preço pretendido.

**Slide `market_study_comparables`**: Header "Comparáveis" + tabela completa com todos os comparáveis (sem limit de 8), com colunas: título, preço, m², R$/m², score.

Remover o bloco antigo `market_study_placeholder` dos 3 layouts.

### 4. `PresentationEditor.tsx` — Atualizar auto-sync

O `useEffect` que verifica `market_study_placeholder` deve agora verificar `market_study_subject` como indicador de seção de mercado.

### 5. Retrocompatibilidade

Manter suporte ao antigo `market_study_placeholder` nos layouts (fallback) para apresentações existentes que ainda não foram re-sincronizadas. Quando o editor abre, o auto-sync criará as 3 novas seções.

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useGeneratePresentation.ts` | 3 section_keys + reordenar |
| `src/hooks/syncMarketStudySections.ts` | Sync para 3 seções |
| `src/components/layouts/LayoutExecutivo.tsx` | 3 blocos de slide |
| `src/components/layouts/LayoutPremium.tsx` | 3 blocos de slide |
| `src/components/layouts/LayoutImpactoComercial.tsx` | 3 blocos de slide |
| `src/pages/agent/PresentationEditor.tsx` | Ajustar auto-sync key |

