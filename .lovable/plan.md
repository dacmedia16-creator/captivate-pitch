

# Fase 1 — 3 Novas Seções de Apresentação

## Arquivos a criar
Nenhum novo arquivo de componente necessário — as seções serão renderizadas pelos layouts existentes (blocos dedicados + fallback genérico).

## Arquivos a alterar

| Arquivo | Mudança |
|---|---|
| **Migration SQL** | Adicionar 3 colunas JSONB em `agency_profiles`: `objectives`, `value_propositions`, `global_stats`. Adicionar 1 coluna JSONB em `presentations`: `required_documents`. |
| **`src/hooks/useGeneratePresentation.ts`** | Reordenar SECTION_DEFINITIONS para 15 seções. Adicionar cases para `objectives_alignment`, `agency_value_proposition`, `required_documentation` com defaults seguros. |
| **`src/components/layouts/LayoutExecutivo.tsx`** | Adicionar 3 blocos de renderização dedicados para as novas seções. |
| **`src/components/layouts/LayoutPremium.tsx`** | Idem. |
| **`src/components/layouts/LayoutImpactoComercial.tsx`** | Idem. |
| **`src/components/editor/EditPanel.tsx`** | Adicionar ícones e campos de edição para as 3 novas seções (objectives, value_propositions, required_documents). |
| **`src/pages/company/CompanyBranding.tsx`** | Adicionar 2 novas tabs: "Objetivos" e "Proposta de Valor" para editar `objectives`, `value_propositions` e `global_stats`. |

## Detalhes técnicos

### Migration SQL
```sql
ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS objectives jsonb DEFAULT NULL;
ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS value_propositions jsonb DEFAULT NULL;
ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS global_stats jsonb DEFAULT NULL;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS required_documents jsonb DEFAULT NULL;
```
Sem impacto em dados existentes — todas nullable com default NULL.

### useGeneratePresentation.ts — Nova ordem
```
cover (0), objectives_alignment (1), agency_value_proposition (2),
broker_intro (3), about_global (4), about_national (5), about_regional (6),
property_summary (7), marketing_plan (8), differentials (9), results (10),
market_study_placeholder (11), pricing_scenarios (12),
required_documentation (13), closing (14)
```

Defaults seguros para cada seção quando dados não existem:
- **objectives_alignment**: 3 objetivos padrão (Vender, Melhor preço, Comodidade)
- **agency_value_proposition**: 3 propostas padrão + stats globais zerados
- **required_documentation**: 5 documentos padrão

### Layouts — Renderização das 3 seções
Cada layout terá blocos `if (section.section_key === "...")` com visual consistente:

- **objectives_alignment**: 3 cards lado a lado com ícone lucide, título e descrição
- **agency_value_proposition**: Grid de propostas + bloco de stats globais (países, unidades, corretores)
- **required_documentation**: Checklist visual com ícone de documento e badge required/optional

### Compatibilidade
- Apresentações antigas não terão essas seções (nunca foram inseridas em `presentation_sections`), portanto **zero risco de quebra**
- Novas apresentações gerarão as 15 seções completas
- A geração usa `agency?.objectives || DEFAULT` — se campo não preenchido, usa defaults

### Riscos
- **Nenhum risco alto**: colunas nullable, defaults seguros, seções antigas não afetadas
- **Risco baixo**: sort_order de seções antigas (0-11) ficará diferente do novo (0-14), mas isso é por design — cada apresentação mantém a ordem com que foi gerada

