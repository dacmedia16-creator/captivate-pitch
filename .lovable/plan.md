

# Plano: Corrigir filtro de cidade e priorização de URLs

## Diagnóstico confirmado (Cannes 23 logs)

Os logs mostram que:
- 103 URLs merged, **0 filtradas por cidade** (o filtro não disparou)
- Primeiro 25 URLs abertas são TODAS de Rio de Janeiro
- IA extraiu 25 comparáveis mas **todos 25 descartados** por similaridade 0

O filtro `isWrongCityUrl` tem o pattern `-rio-de-janeiro-` que DEVERIA casar com as URLs do log. Causa provável: o deploy anterior não incluiu o código do filtro, OU as URLs reais (truncadas no log) não contêm o pattern exatamente.

## Correções (todas em `supabase/functions/analyze-market-deep/index.ts`)

### 1. Trocar filtro negativo por filtro POSITIVO de cidade
Em vez de listar cidades erradas para bloquear, verificar se a URL contém a cidade-alvo (positivo). Se a URL contém OUTRA cidade conhecida E NÃO contém a cidade-alvo, descartar.

```typescript
function isWrongCityUrl(url: string, targetCity: string | undefined): boolean {
  if (!targetCity) return false;
  const targetSlug = slugify(targetCity);
  if (!targetSlug) return false;
  const urlLower = url.toLowerCase();
  
  // Se a URL contém a cidade-alvo, é OK
  if (urlLower.includes(targetSlug)) return false;
  
  // Se contém qualquer outra cidade conhecida, é errada
  const knownCities = [
    "rio-de-janeiro", "sao-paulo", "belo-horizonte", "curitiba", 
    "porto-alegre", "salvador", "brasilia", "fortaleza", "recife", 
    "manaus", "goiania", "campinas", "santos", "guarulhos", "niteroi",
    "sorocaba", "jundiai", "piracicaba", "bauru", "ribeirao-preto",
    "uberlandia", "joinville", "florianopolis", "londrina", "maringa",
  ];
  
  for (const city of knownCities) {
    if (city === targetSlug) continue;
    if (urlLower.includes(city)) return true;
  }
  return false;
}
```

### 2. Priorizar URLs por relevância antes do slice(0, 25)
Ordenar `mergedUrls` antes de pegar os primeiros 25:
1. URLs que contêm o nome do condomínio (highest priority)
2. URLs que contêm a cidade-alvo
3. Resto

### 3. Adicionar log detalhado do filtro
Logar as primeiras 5 URLs descartadas pelo filtro de cidade para debug.

### 4. Forçar re-deploy e testar
Deploy explícito + teste via `curl_edge_functions` com payload do Cannes.

## Etapas
1. Atualizar `isWrongCityUrl` para filtro positivo + lista expandida de cidades
2. Adicionar sort de prioridade em `mergedUrls` antes do cap de 25
3. Adicionar logs de debug no filtro
4. Deploy + teste com payload Cannes Sorocaba

