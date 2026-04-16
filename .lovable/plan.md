

# Atualizar apresentações já criadas com os 3 slides de estudo de mercado

## Problema
Existem 24 apresentações vinculadas a estudos de mercado concluídos que ainda não têm os 3 novos slides (`market_study_subject`, `market_study_stats`, `market_study_comparables`). O auto-sync atual só roda quando alguém abre o editor.

## Solução
Criar uma edge function `batch-sync-market-slides` que percorre todos os `market_study_id` únicos com status `completed` e chama a mesma lógica de sync para cada um. Depois, invocar a função uma vez.

## Mudanças

### 1. Nova edge function `supabase/functions/batch-sync-market-slides/index.ts`
- Busca todos os `market_studies` com `status = 'completed'` que têm pelo menos uma apresentação vinculada
- Para cada um, executa a mesma lógica do `syncMarketStudySections`:
  - Busca `market_study_results`, `market_study_comparables` (approved), `market_study_subject_properties`
  - Para cada apresentação vinculada, faz upsert das 3 seções + atualiza `pricing_scenarios`
- Retorna contagem de apresentações atualizadas
- Autenticação: verifica que o usuário é `super_admin` ou roda com service role key

### 2. Botão no `AdminDashboard.tsx` (opcional)
- Adicionar um botão "Sincronizar apresentações" no painel admin que invoca a edge function
- Mostra loading + toast com resultado

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/batch-sync-market-slides/index.ts` | Nova edge function com lógica de batch sync |
| `src/pages/admin/AdminDashboard.tsx` | Botão para disparar o batch sync |

