

# Fase 2 — Estatísticas Institucionais + Mapa do Brasil

## Resumo

Enriquecer as 3 seções `about_global`, `about_national` e `about_regional` com blocos de estatísticas JSONB dedicados. Criar componente de mapa do Brasil para a seção nacional. Adicionar campos de edição no CompanyBranding.

## Mapa do Brasil

Implementar agora como SVG inline simplificado (paths dos 27 estados). Componente `BrazilPresenceMap.tsx` renderiza estados destacados com base em array de siglas. Se não houver dados de presença, o mapa não aparece. Sem dependência externa, compatível com PDF export.

## Migration SQL

```sql
ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS about_global_stats jsonb DEFAULT NULL;
ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS about_national_stats jsonb DEFAULT NULL;
ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS about_regional_stats jsonb DEFAULT NULL;
```

## Arquivos a alterar

| Arquivo | Mudança |
|---|---|
| **`src/hooks/useGeneratePresentation.ts`** | Linhas 119-126: adicionar `stats` aos cases `about_global`, `about_national`, `about_regional` usando `agencyAny?.about_global_stats` etc. |
| **`src/components/layouts/LayoutExecutivo.tsx`** | No bloco genérico (fallback): adicionar renderização de `c.stats` como grid de métricas quando presente. Criar bloco dedicado para `about_national` com mapa. |
| **`src/components/layouts/LayoutPremium.tsx`** | Idem. |
| **`src/components/layouts/LayoutImpactoComercial.tsx`** | Idem. |
| **`src/pages/company/CompanyBranding.tsx`** | Nas tabs "Mundial", "Nacional", "Regional": adicionar campos para stats (agencies, brokers, rank, franchises, presence_text). Na tab "Nacional": adicionar campo para estados com presença. |

## Arquivo a criar

| Arquivo | Descrição |
|---|---|
| **`src/components/charts/BrazilPresenceMap.tsx`** | SVG do Brasil com 27 estados. Props: `states` (siglas ativas), `primaryColor`, `accentColor`. Estados ativos com cor accent, inativos cinza claro. |

## Detalhes técnicos

### useGeneratePresentation.ts — mudanças nos 3 cases
```typescript
case "about_global":
  content = { text: agency?.about_global, stats: agencyAny?.about_global_stats, logo_url: agency?.logo_url, image_url: agencyAny?.about_global_image_url };
  break;
case "about_national":
  content = { text: agency?.about_national, stats: agencyAny?.about_national_stats, logo_url: agency?.logo_url, image_url: agencyAny?.about_national_image_url };
  break;
case "about_regional":
  content = { text: agency?.about_regional, stats: agencyAny?.about_regional_stats, regional_numbers: agency?.regional_numbers, branch_photo_url: agency?.branch_photo_url, image_url: agencyAny?.about_regional_image_url };
  break;
```

### Layouts — renderização de stats
Nos 3 layouts, substituir o bloco genérico/fallback por blocos dedicados para `about_global`, `about_national`, `about_regional` que:
1. Renderizam `c.text` e `c.image_url` como hoje
2. Se `c.stats` existir, exibem grid de métricas (agencies, brokers, rank, franchises, presence_text)
3. Para `about_national`: incluem `BrazilPresenceMap` se `c.stats?.presence_states` existir

### CompanyBranding — campos de stats
Na tab "Mundial", "Nacional" e "Regional", adicionar seção colapsável "Estatísticas" com inputs para: agencies, brokers, rank, franchises, presence_text. Na tab "Nacional", campo adicional para lista de estados com presença.

### agencyForm state
Adicionar: `about_global_stats`, `about_national_stats`, `about_regional_stats` ao state inicial.

## Compatibilidade
- Colunas nullable com default NULL — zero impacto em dados existentes
- Stats só renderizam se existirem (`c.stats && ...`)
- Mapa só aparece se `presence_states` tiver dados
- Apresentações antigas não têm `stats` no content JSON — fallback seguro
- Não altera Fase 1 (objectives, value_proposition, required_documentation)

## Riscos
- Nenhum risco alto. SVG inline do mapa é estático e compatível com PDF export.

