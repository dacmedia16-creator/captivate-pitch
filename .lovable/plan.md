

# Remover portais QuintoAndar e VIP Seven

## O que será feito
Remover completamente os portais QuintoAndar e VIP Seven do sistema — banco de dados e código das edge functions.

## Alterações

### 1. Banco de dados (migração SQL)
- Deletar registros de `tenant_portal_settings` que referenciam esses portais
- Deletar os 2 registros de `portal_sources` (codes: `quintoandar`, `vipseven`)

### 2. `supabase/functions/inngest-serve/index.ts`
- Remover `quintoandar` e `vipseven` do `PORTAL_SITE_MAP`
- Remover os `case "quintoandar"` e `case "vipseven"` de `buildPortalNativeUrl`
- Remover entradas de `listingPatterns`

### 3. `supabase/functions/analyze-market/index.ts`
- Remover `quintoandar` e `vipseven` do `PORTAL_SITE_MAP`

### 4. `supabase/functions/analyze-market-manus/index.ts`
- Remover `quintoandar` e `vipseven` do mapa de URLs

## Escopo
- 1 migração SQL
- 3 edge functions editadas (remoção de linhas)

