

# Melhorar Qualidade e Quantidade de Resultados por Portal

## Problemas Identificados

1. **`resultsPerPortal` muito baixo**: Com 5 portais e maxComparables=15, cada portal busca apenas 3 URLs. Muitas são descartadas, sobrando pouquíssimos comparáveis válidos.

2. **Nome do condomínio na query**: `"Cannes"` entre aspas restringe demais — Google só retorna resultados que mencionam exatamente "Cannes", ignorando apartamentos similares na mesma região.

3. **OLX misturando aluguel/venda**: O `site:olx.com.br/imoveis` não filtra por tipo de transação. Precisa usar paths específicos (`site:olx.com.br/imoveis/venda` ou `site:olx.com.br/imoveis/aluguel`).

## Alterações

### `supabase/functions/analyze-market-deep/index.ts`

**Linha 156 — Aumentar `resultsPerPortal`:**
```typescript
// Antes: Math.min(Math.ceil(maxResults / limitedPortals.length), 8)
// Depois: mínimo 5 por portal, máximo 10
const resultsPerPortal = Math.max(5, Math.min(Math.ceil((maxResults * 2) / limitedPortals.length), 10));
```
Isso garante pelo menos 5 URLs por portal (25 total com 5 portais), compensando a taxa de descarte.

**Linhas 67-81 — Melhorar `buildSearchQuery`:**
- Remover nome do condomínio da query (muito restritivo). O condomínio será usado apenas na fase de ranking/similaridade, não na busca.
- Corrigir OLX: usar `site:olx.com.br/imoveis/venda` ou `site:olx.com.br/imoveis/aluguel` conforme o `property_purpose`.
- Remover metragem exata da query (ex: "98m²") — isso elimina resultados de 95m² ou 102m² que seriam perfeitamente válidos.

Query resultante (exemplo para ZAP):
```
Apartamento 3 quartos Parque Campolim Sorocaba venda site:zapimoveis.com.br
```

**Ajustar PORTAL_SITE_MAP para OLX** (linhas ~30-40):
```typescript
// Dinâmico baseado no purpose
const olxPath = purpose === "aluguel" ? "aluguel" : "venda";
// site:olx.com.br/imoveis/venda
```

## Resultado Esperado
- ~25-50 URLs coletadas (vs 12 atual)
- Queries mais amplas trazem mais comparáveis relevantes
- OLX retorna apenas venda quando o imóvel é para venda

