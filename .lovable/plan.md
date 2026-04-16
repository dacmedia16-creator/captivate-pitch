

# Ativar Chaves na Mão como portal global

## Estado atual
- `chavesnamao` já existe na tabela `portal_sources` (id: `eacee450-...`) mas com `is_global = false`
- Google Search já está configurado no `PORTAL_SITE_MAP` (linha 127)
- Attribution já funciona (linha 560)
- Falta: ativação global, native URL builder, e listing pattern para extração de links

## Alterações

### 1. Database — Ativar e adicionar base_url
```sql
UPDATE portal_sources 
SET is_global = true, base_url = 'https://www.chavesnamao.com.br/imoveis/brasil/' 
WHERE code = 'chavesnamao';
```

### 2. `supabase/functions/inngest-serve/index.ts`

**a) Native URL builder** — adicionar case `chavesnamao` em `buildPortalNativeUrl`:
```typescript
case "chavesnamao": {
  const purposeStr = isRental ? "alugar" : "comprar";
  return `https://www.chavesnamao.com.br/${typeSlug}-para-${purposeStr}-${state}-${city}-${neighborhood}/`;
}
```
> URL pattern do Chaves na Mão: `/apartamentos-para-comprar-sp-sorocaba-parque-campolim/`

**b) Listing pattern** — adicionar `chavesnamao` em `extractIndividualListingUrls`:
```typescript
chavesnamao: /chavesnamao\.com\.br\/imovel\//,
```

### 3. Redeploy da edge function `inngest-serve`

## Impacto
- Chaves na Mão aparece nos portais disponíveis para seleção
- Google Search + scrape nativo funcionam
- Links individuais são extraídos corretamente do scrape nativo

## Escopo
- 1 UPDATE no banco
- ~5 linhas alteradas em `inngest-serve/index.ts`
- Redeploy de 1 edge function

