

# Adicionar Kenlo como portal de busca real

## Situação
- Kenlo já está cadastrado em `portal_sources` com code `kenlo` e URL `https://portal.kenlo.com.br/`
- A edge function `analyze-market` não tem mapeamento para `kenlo` no `PORTAL_SITE_MAP`, então ele é ignorado na busca

## Mudança
Adicionar uma linha ao `PORTAL_SITE_MAP` na edge function:

```
kenlo: "site:portal.kenlo.com.br"
```

## Arquivo
- `supabase/functions/analyze-market/index.ts` — adicionar mapeamento na linha 15

## Impacto
- Quando o corretor selecionar Kenlo nos portais, a busca via Firecrawl incluirá `site:portal.kenlo.com.br` na query
- A IA extrairá dados de imóveis do Kenlo da mesma forma que dos outros portais

