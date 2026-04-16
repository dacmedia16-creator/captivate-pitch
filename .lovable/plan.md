

# Ocultar Preço Aspiracional da Apresentação

## Problema
O cenário "Preço aspiracional" aparece no slide de cenários de preço. O usuário quer removê-lo.

## Solução
Remover o cenário aspiracional de todos os locais que geram/sincronizam os dados do slide `pricing_scenarios`, e dos layouts que renderizam os cenários. Manter apenas **Preço de Mercado** e **Preço de Venda Rápida**.

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/syncMarketStudySections.ts` | Remover `{ label: "Preço aspiracional", ... }` do array scenarios |
| `src/pages/agent/AgentNewPresentation.tsx` | Idem |
| `src/hooks/useGeneratePresentation.ts` | Idem |
| `supabase/functions/batch-sync-market-slides/index.ts` | Idem |
| `supabase/functions/inngest-serve/index.ts` | Idem |
| `supabase/functions/export-pdf/index.ts` | Remover label "Aspiracional" e ajustar array de cores para 2 cenários |
| `src/components/layouts/LayoutExecutivo.tsx` | Ajustar layout de cenários para 2 cards em vez de 3 |
| `src/components/layouts/LayoutPremium.tsx` | Idem |
| `src/components/layouts/LayoutImpactoComercial.tsx` | Idem |
| `src/pages/agent/MarketStudyResult.tsx` | Remover "Aspiracional" da visualização do resultado |

Os layouts já renderizam dinamicamente com `scenarios.map()`, então basta garantir que o array tenha 2 itens — a renderização se adapta. A mudança principal é nos geradores de dados.

