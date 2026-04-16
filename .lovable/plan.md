

# Reduzir MAX_URLS de 40 para 25

## Alteração

### `supabase/functions/inngest-serve/index.ts` (linha 772)

Trocar:
```typescript
const MAX_URLS = 40, MIN_PER_PORTAL_VAL = 3;
```
Por:
```typescript
const MAX_URLS = 25, MIN_PER_PORTAL_VAL = 3;
```

Redeploy da edge function `inngest-serve`.

## Impacto
- Menos créditos Firecrawl por execução
- Execução mais rápida (~3 batches menos)
- Ainda suficiente para ~5 URLs por portal com 4-5 portais

