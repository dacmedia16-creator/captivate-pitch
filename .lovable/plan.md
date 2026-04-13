

# Adicionar URL do Portal Kenlo

## Problema
O dicionário `PORTAL_URLS` em `analyze-market-manus/index.ts` não tem entrada para o Kenlo, então quando o Manus tenta resolver o portal, não encontra a URL correta.

## Alteração

**`supabase/functions/analyze-market-manus/index.ts`** — linha 43, adicionar entrada `kenlo`:

```typescript
const PORTAL_URLS: Record<string, string> = {
  zap: "https://www.zapimoveis.com.br",
  vivareal: "https://www.vivareal.com.br",
  olx: "https://www.olx.com.br/imoveis",
  imovelweb: "https://www.imovelweb.com.br",
  chaves_na_mao: "https://www.chavesnamao.com.br",
  quintoandar: "https://www.quintoandar.com.br",
  kenlo: "https://portal.kenlo.com.br/",
};
```

Uma linha adicionada, nenhum outro arquivo precisa de alteração (os outros já usam `portal.kenlo.com.br`).

