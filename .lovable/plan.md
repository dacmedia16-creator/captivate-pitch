

# Ativar pesos configuráveis de Similaridade e Ajustes

## Situação atual
Tanto a similaridade quanto os ajustes **já estão ativos** no pipeline — calculam scores e inserem no banco. Porém usam **valores hardcoded** e ignoram a tabela `market_study_settings` que tem campos `similarity_weights` e `adjustment_weights` configuráveis por tenant.

## O que muda

### `supabase/functions/inngest-serve/index.ts`

**a) Ler configurações do tenant antes da Fase 3:**
```typescript
// Buscar market_study_settings do tenant
const { data: tenantSettings } = await supabase
  .from("market_study_settings")
  .select("similarity_weights, adjustment_weights")
  .eq("tenant_id", tenantId)
  .limit(1);
const simWeights = tenantSettings?.[0]?.similarity_weights || DEFAULT_SIM_WEIGHTS;
const adjWeights = tenantSettings?.[0]?.adjustment_weights || DEFAULT_ADJ_WEIGHTS;
```

**b) Usar `simWeights` no scoring (linha ~623-636):**
Em vez de `score += 25` hardcoded, usar `score += simWeights.same_condominium` etc. Os defaults continuam os mesmos valores atuais.

**c) Usar `adjWeights` nos ajustes (linha ~688-694):**
Adicionar ajustes para os novos tipos configuráveis:
- `better_conservation` — padrão construtivo
- `newer_building` — idade do imóvel
- `premium_location` — localização privilegiada (mesmo bairro mas condomínio diferente)
- `pool`, `gourmet_area`, `master_suite`, `extra_parking`, `privileged_view`, `larger_land` — baseados nos diferenciais extraídos

Os percentuais de ajuste de suítes, vagas e área também passam a ler do `adjWeights` quando disponível.

**d) Defaults (constantes no topo da função):**
```typescript
const DEFAULT_SIM_WEIGHTS = {
  same_condominium: 25, same_neighborhood: 20, same_type: 15,
  area_range: 15, rooms_proximity: 10, same_standard: 10, same_profile: 5
};
const DEFAULT_ADJ_WEIGHTS = {
  better_conservation: 5, newer_building: 3, premium_location: 3,
  pool: 4, gourmet_area: 2.5, master_suite: 2, extra_parking: 1.5,
  privileged_view: 4, larger_land: 3
};
```

## Impacto
- Pesos de similaridade e ajustes passam a ser lidos do banco
- Sem mudança de comportamento se não houver configuração (defaults iguais aos atuais)
- Tenants podem customizar pesos via `market_study_settings`

## Escopo
- ~30 linhas alteradas em `inngest-serve/index.ts`
- Redeploy de 1 edge function
- Sem migrations (tabela e campos já existem com defaults corretos)

