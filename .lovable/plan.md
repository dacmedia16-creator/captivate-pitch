

# Corrigir URL de busca do VIP Seven Imóveis

## Problema
A URL configurada `https://vipsevenimoveis.com.br/imoveis/venda` retorna 404. O site usa query parameters: `https://vipsevenimoveis.com.br/imoveis?finalidade=venda`.

## Correção

### `supabase/functions/inngest-serve/index.ts` (linha ~200)
Alterar o case `"vipseven"` em `buildPortalNativeUrl`:
```
// DE:
return `https://vipsevenimoveis.com.br/imoveis/${purposeSlug}`;

// PARA:
const fin = purposeSlug === "venda" ? "venda" : "aluguel";
return `https://vipsevenimoveis.com.br/imoveis?finalidade=${fin}`;
```

O regex de anúncio individual (`/vipsevenimoveis\.com\.br\/imovel\//`) está correto — os links individuais são `/imovel/1051`.

## Escopo
- 1 linha alterada no `inngest-serve`
- Redeploy da edge function

