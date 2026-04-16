

# Viva Real: mesmo bug do ZAP/OLX — URL nativa retorna showcase do RJ

## Diagnóstico

Os discards do Teste 22 confirmam: **todas as 14 URLs do scrape nativo do Viva Real são do Rio de Janeiro** com `source=showcase%2CERROR+PAGE`. É exatamente o mesmo problema que já corrigimos no ZAP e OLX.

A URL nativa gerada é:
```
https://www.vivareal.com.br/venda/sp/sorocaba/parque-campolim/apartamentos_residencial/
```

O Viva Real **não reconhece** esse formato e redireciona para uma página de showcase com anúncios do RJ.

Os resultados do Google Search do Viva Real existem mas são **duplicatas** dos mesmos imóveis já encontrados via ZAP (são o mesmo grupo — ZAP e Viva Real compartilham listagens).

O OLX também não aparece nos resultados — o Google Search aparentemente não retornou nada para OLX Sorocaba.

## Correção

### `supabase/functions/inngest-serve/index.ts`

**Desabilitar URL nativa do Viva Real** — retornar `null` no `buildPortalNativeUrl`:

```typescript
case "vivareal":
  return null; // Viva Real redireciona para showcase do RJ com esse formato de URL
```

Isso elimina as 14 URLs inúteis do RJ e os créditos Firecrawl desperdiçados. Os resultados do Google Search continuam funcionando (mas tendem a ser duplicatas do ZAP).

## Impacto
- Elimina ~14 URLs desperdiçadas por estudo
- Economiza créditos Firecrawl (1 scrape nativo + 14 scrapes individuais)
- Resultados do Viva Real via Google Search continuam habilitados

## Escopo
- 1 linha alterada em `inngest-serve/index.ts`
- Redeploy de 1 edge function

