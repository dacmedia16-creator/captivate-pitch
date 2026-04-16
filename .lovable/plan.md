

# Re-executar Estudo Alphaville Nova Esplanada

## Problema Atual
Os logs mostram `"batches de 5"` — a versão antiga do `inngest-serve` ainda está deployada. O código no repositório já tem as correções (batch size 2, truncation 8000 chars, MAX_AI_PAGES 15), mas a edge function não foi re-deployada.

O estudo está novamente em `processing/extracting` e vai travar até o cron job marcá-lo como `failed` em ~15 minutos.

## Passos

### 1. Redeployar `inngest-serve`
Forçar deploy da edge function para que as correções de batch size e truncation entrem em efeito.

### 2. Marcar estudo como `failed`
Migration para resetar o estudo:
```sql
UPDATE market_studies 
SET status = 'failed', current_phase = NULL, updated_at = now() 
WHERE id = '6d8fce3e-cc62-481e-8691-9a9fe6fa1e0c';
```

### 3. Retry via UI
Após deploy + reset, o botão "Tentar novamente" aparece na listagem. O usuário clica para re-executar com a versão corrigida.

## Validação
Verificar nos logs que:
- `"batches de 2"` aparece (não 5)
- Cada batch completa sem shutdown
- Status final = `completed`

