

# Corrigir Cores RE/MAX nos Slides — Atualizar Banco de Dados

## Problema

Os 3 layouts já têm as cores RE/MAX (`#003DA5` azul, `#DC1431` vermelho) como fallback, mas a tabela `agency_profiles` tem cores antigas salvas (`#1e3a5f`, `#c9a84c`) que sobrescrevem os defaults.

## Solução

Uma migração SQL para atualizar as cores na tabela `agency_profiles`:

```sql
UPDATE agency_profiles 
SET primary_color = '#003DA5', secondary_color = '#DC1431' 
WHERE primary_color = '#1e3a5f' AND secondary_color = '#c9a84c';
```

Também atualizar registros com cores NULL para garantir consistência:

```sql
UPDATE agency_profiles 
SET primary_color = '#003DA5', secondary_color = '#DC1431' 
WHERE primary_color IS NULL OR secondary_color IS NULL;
```

## Arquivos alterados

Nenhum arquivo de código precisa mudar — apenas dados no banco.

## Resultado

Todos os slides passarão a renderizar com Azul RE/MAX e Vermelho RE/MAX imediatamente, sem necessidade de alterar layouts.

