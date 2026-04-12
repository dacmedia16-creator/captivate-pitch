

# Adicionar Filtro de Data de Criação dos Anúncios

## Problema
A pesquisa está retornando anúncios antigos (como o da imagem, de 2019). Precisa de um filtro para o usuário definir a idade máxima dos anúncios.

## Alterações

### 1. Interfaces de dados — adicionar campo `max_listing_age_months`

**`src/components/market-study/SearchConfigForm.tsx`** — adicionar `max_listing_age_months: number` à interface `SearchConfigData`

**`src/components/wizard/StepMarketStudy.tsx`** — adicionar `maxListingAgeMonths: string` à interface `MarketStudyData`

### 2. UI — novo controle de seleção

**`SearchConfigForm.tsx`** — adicionar Select com opções: 1 mês, 3 meses, 6 meses, 12 meses, 24 meses, Sem limite

**`StepMarketStudy.tsx`** — adicionar Select equivalente nos filtros do wizard

### 3. Edge function — filtrar anúncios antigos

**`supabase/functions/analyze-market-deep/index.ts`**:
- Adicionar `maxListingAgeMonths` na interface `Filters`
- No prompt de extração AI (Fase 3), pedir para extrair `listing_date` ou `updated_at` do markdown
- Após extração, calcular se o anúncio é mais antigo que o limite e descartar com motivo "Anúncio muito antigo (criado há X meses)"
- Adicionar instrução no prompt para a IA identificar textos como "Anúncio criado em..." ou "Atualizado há..."

### 4. Passagem do filtro

**`src/pages/agent/AgentNewPresentation.tsx`** — incluir `maxListingAgeMonths` no payload enviado à edge function

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/components/market-study/SearchConfigForm.tsx` | Modificar — novo campo + Select |
| `src/components/wizard/StepMarketStudy.tsx` | Modificar — novo campo + Select |
| `supabase/functions/analyze-market-deep/index.ts` | Modificar — filtro por data |
| `src/pages/agent/AgentNewPresentation.tsx` | Modificar — passar filtro |

