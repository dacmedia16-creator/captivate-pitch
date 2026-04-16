

# ZAP Imóveis: 24 encontrados, 5 válidos — Diagnóstico e Correção

## Diagnóstico

O problema do ZAP é **idêntico ao Viva Real e OLX**: a URL nativa está quebrada.

A URL gerada é:
```
https://www.zapimoveis.com.br/venda/apartamentos/sp+sorocaba+parque-campolim/
```

O ZAP **não reconhece** esse formato e retorna uma **página de erro/showcase** com anúncios aleatórios do **Rio de Janeiro**. Nos discards, todos os URLs do ZAP descartados contêm `?source=showcase%2CERROR+PAGE` e foram marcados como "Outra cidade".

Os 5 válidos vieram exclusivamente do **Google Search** (FASE 1B), que funciona corretamente.

## Correção

### `supabase/functions/inngest-serve/index.ts`

**Desabilitar URL nativa do ZAP** — assim como o OLX, retornar `null` no `buildPortalNativeUrl` para forçar uso apenas do Google Search:

```typescript
case "zap":
  return null; // ZAP não aceita o formato de URL com +, retorna showcase de RJ
```

Isso elimina ~19 URLs inúteis (showcase do RJ) e evita gastar créditos Firecrawl em páginas de erro. Os resultados de Google Search já trazem 5+ válidos e com o threshold de 30 e a inferência de bairro (já implementados), devem passar mais.

## Impacto esperado
- Elimina desperdício de créditos Firecrawl no scrape nativo do ZAP
- Mantém os ~5 válidos do Google Search
- Possível aumento marginal pois sem as URLs de showcase poluindo o pipeline, há mais "slots" para URLs válidas do Google

## Escopo
- 1 linha alterada em `inngest-serve/index.ts`
- Redeploy de 1 edge function

