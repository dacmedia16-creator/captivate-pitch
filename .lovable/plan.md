

# Timeout Automático para Estudos Travados

## O que já existe
- Função `expire_stuck_studies()` no banco que marca estudos em `processing` há mais de 15 minutos como `failed`.

## O que falta
Criar um cron job que chame essa função periodicamente.

## Passos

### 1. Migration SQL
- Habilitar extensões `pg_cron` e `pg_net`
- Criar cron job que executa `SELECT expire_stuck_studies()` a cada 5 minutos

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'expire-stuck-market-studies',
  '*/5 * * * *',
  $$SELECT public.expire_stuck_studies()$$
);
```

### Impacto
- Nenhuma mudança de código frontend ou edge functions
- Estudos travados serão automaticamente marcados como `failed` a cada 5 minutos
- O botão "Tentar novamente" aparecerá automaticamente na listagem

