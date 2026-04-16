

# Remover Viva Real do sistema

## Alterações

### 1. Database — Desabilitar Viva Real na tabela `portal_sources`
Migration SQL:
```sql
UPDATE portal_sources SET is_global = false WHERE code = 'vivareal';
```
Isso remove o Viva Real da lista de portais no UI sem deletar dados históricos.

### 2. `supabase/functions/inngest-serve/index.ts`
Remover `vivareal` do `PORTAL_SITE_MAP` (linha 123) para que o Google Search não busque mais resultados do Viva Real.

As outras referências (patterns de URL, attribution) podem ficar — servem para dados históricos que já existem no banco.

## Impacto
- Viva Real não aparece mais no formulário de portais
- Google Search não busca mais no vivareal.com.br
- Economiza créditos Firecrawl (eliminando duplicatas ZAP/Viva Real)
- Dados históricos preservados

## Escopo
- 1 migration (1 UPDATE)
- 1 linha removida em `inngest-serve/index.ts`
- Redeploy de 1 edge function

