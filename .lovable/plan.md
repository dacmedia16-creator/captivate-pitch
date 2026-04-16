

# Remover slide "Estudo de Mercado" (market_study_placeholder)

## Problema
O antigo slide único `market_study_placeholder` ainda existe nas apresentações criadas antes da migração para os 3 slides separados. Ele aparece redundante junto com os novos slides.

## Solução

### 1. Migration SQL — deletar seções antigas
```sql
DELETE FROM presentation_sections 
WHERE section_key = 'market_study_placeholder';
```

### 2. Limpar referências no código
- **`LayoutExecutivo.tsx`**, **`LayoutPremium.tsx`**, **`LayoutImpactoComercial.tsx`** — remover o fallback `|| section.section_key === "market_study_placeholder"` dos blocos de market_study_subject
- **`SlidesSidebar.tsx`** e **`EditPanel.tsx`** — remover `market_study_placeholder` do mapa de ícones
- **`AgentNewPresentation.tsx`** — remover update do `market_study_placeholder` (linha ~330)
- **`generate-presentation-text/index.ts`** — remover mapeamento de `market_study_placeholder`
- **`inngest-serve/index.ts`** — remover update do `market_study_placeholder`

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| DB (migration) | DELETE seções com section_key = market_study_placeholder |
| `LayoutExecutivo.tsx` | Remover fallback placeholder |
| `LayoutPremium.tsx` | Idem |
| `LayoutImpactoComercial.tsx` | Idem |
| `SlidesSidebar.tsx` | Remover do mapa de ícones |
| `EditPanel.tsx` | Remover do mapa de ícones |
| `AgentNewPresentation.tsx` | Remover update do placeholder |
| `generate-presentation-text/index.ts` | Remover mapeamento |
| `inngest-serve/index.ts` | Remover update do placeholder |

