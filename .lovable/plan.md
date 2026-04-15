

# Adicionar portal VIP Seven Imóveis

## O que será feito

Adicionar o portal VIP Seven Imóveis (vipsevenimoveis.com.br) como fonte de pesquisa de mercado.

## Mudanças

### 1. Inserir registro no banco (via insert tool)
```sql
INSERT INTO public.portal_sources (name, code, base_url, is_global)
VALUES ('VIP Seven Imóveis', 'vipseven', 'https://vipsevenimoveis.com.br', true);
```

### 2. `supabase/functions/inngest-serve/index.ts`
- Adicionar `vipseven: "site:vipsevenimoveis.com.br"` ao `PORTAL_SITE_MAP`
- Adicionar case `"vipseven"` em `buildPortalNativeUrl` → retorna `https://vipsevenimoveis.com.br/imoveis/{venda|aluguel}`
- Adicionar pattern `vipseven: /vipsevenimoveis\.com\.br\/imovel\//` em `extractIndividualListingUrls`

### 3. `supabase/functions/analyze-market/index.ts`
- Adicionar `vipseven: "site:vipsevenimoveis.com.br"` ao `PORTAL_SITE_MAP`

### 4. `supabase/functions/analyze-market-manus/index.ts`
- Adicionar `vipseven: "https://vipsevenimoveis.com.br"` ao `PORTAL_URLS`

## Escopo
- 1 insert no banco
- 3 edge functions editadas (~5 linhas cada)
- Portal aparecerá automaticamente para todos os tenants (is_global = true)

