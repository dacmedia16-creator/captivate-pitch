

# Diferenciar slides "Imóvel Avaliado" e "Resumo do Imóvel"

## Problema

O slide `property_summary` (Resumo do Imóvel) e `market_study_subject` (Imóvel Avaliado) mostram informações muito similares: tipo, área, quartos, suítes, vagas, banheiros, diferenciais. O conteúdo é redundante.

## Solução

Redesenhar o slide `market_study_subject` para focar no **contexto da avaliação** em vez de repetir dados do imóvel. Ele deve mostrar:

1. **Resumo executivo** (executive_summary) do estudo — a análise em texto
2. **Nível de confiança** da avaliação (alta/média/baixa) com badge visual
3. **Posicionamento de preço** — valor pretendido vs valor sugerido de mercado
4. **Dados-chave do imóvel** condensados em uma linha (tipo, padrão, conservação, idade) — sem repetir as métricas de quartos/vagas/área que já estão no slide anterior

Assim cada slide terá propósito claro:
- `property_summary` → **O imóvel** (fotos, métricas físicas, destaques)
- `market_study_subject` → **A avaliação** (resumo executivo, confiança, posicionamento)
- `market_study_stats` → **Estatísticas** (preços médios, gráfico)
- `market_study_comparables` → **Comparáveis** (tabela)

## Mudanças

### `LayoutExecutivo.tsx` — Redesenhar bloco `market_study_subject`
- Remover a grid de métricas (quartos, suítes, vagas, área) que duplicam property_summary
- Manter apenas: tipo, padrão, conservação, idade em uma linha compacta de contexto
- Destacar `executive_summary` como bloco principal
- Adicionar badge de `confidence_level`
- Mostrar comparação: valor pretendido vs valor médio de mercado (puxar do stats se disponível via `c`)

### `LayoutPremium.tsx` — Mesma reestruturação adaptada ao tema
### `LayoutImpactoComercial.tsx` — Mesma reestruturação adaptada ao tema

### `syncMarketStudySections.ts` — Incluir dados de preço no subjectContent
- Adicionar `avg_price` e `suggested_market_price` do report ao conteúdo de `market_study_subject` para permitir a comparação no slide

### `batch-sync-market-slides/index.ts` — Mesma adição

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/components/layouts/LayoutExecutivo.tsx` | Redesenhar market_study_subject |
| `src/components/layouts/LayoutPremium.tsx` | Idem |
| `src/components/layouts/LayoutImpactoComercial.tsx` | Idem |
| `src/hooks/syncMarketStudySections.ts` | Adicionar avg_price e suggested_market_price ao subjectContent |
| `supabase/functions/batch-sync-market-slides/index.ts` | Idem |

