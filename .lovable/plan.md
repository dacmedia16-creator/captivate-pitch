

# Adicionar Botão de Excluir Comparável (sem recálculo automático)

## O que será feito

Adicionar um botão de exclusão em cada linha da tabela de comparáveis, com diálogo de confirmação. Após excluir, os dados são atualizados mas **não** há recálculo automático — o usuário decide quando recalcular usando o botão "Recalcular" já existente.

## Alterações

### Arquivo: `src/pages/agent/MarketStudyResult.tsx`

1. **Imports**: adicionar `Trash2` do lucide-react e importar `ConfirmDialog` de `@/components/shared/ConfirmDialog`
2. **State**: adicionar `deleteTarget` (`string | null`) para controlar qual comparável está sendo excluído
3. **Mutation `deleteComparable`**:
   - Deleta ajustes associados em `market_study_adjustments` (where `comparable_id`)
   - Deleta o comparável em `market_study_comparables`
   - Invalida as queries para atualizar a lista
   - Exibe toast "Comparável excluído" — **sem chamar recálculo**
4. **Na coluna "Ações" (linha ~676)**: adicionar botão `Trash2` ao lado do botão de aprovar/reprovar
5. **Renderizar `ConfirmDialog`** no final do componente com mensagem "Tem certeza que deseja excluir este comparável? Utilize o botão Recalcular para atualizar os cenários."

### Nenhuma migração necessária
As tabelas `market_study_comparables` e `market_study_adjustments` já suportam DELETE via RLS.

