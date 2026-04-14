

# Plano: Garantir diversidade de portais na seleção de URLs (Kenlo aparecendo)

## Problema

O Kenlo contribui 8 URLs via Google (0 nativas, pois é SPA), mas os outros 4 portais contribuem 70+ URLs nativas. Na seleção das 25 URLs para scraping, a priorização por relevância (condomínio > cidade) não garante representação de todos os portais. Resultado: **0 URLs do Kenlo são scrapeadas**.

## Causa raiz

Linha 627-631: `mergedUrls.slice(0, 25)` — simples truncamento após sort. URLs de Viva Real, ZAP e OLX dominam pelo volume.

## Solução: Round-robin por portal

Em vez de `slice(0, 25)`, implementar seleção round-robin que garante pelo menos N URLs por portal ativo (quando disponíveis), depois preenche o restante por relevância.

### Lógica

```text
1. Agrupar URLs por portal
2. Para cada portal com URLs, selecionar até 3 URLs (round-robin)
3. Preencher slots restantes (até 25) com URLs não selecionadas, ordenadas por relevância
```

Com 5 portais: 5 × 3 = 15 slots garantidos, + 10 por relevância = 25 total.

## Mudanças em `supabase/functions/analyze-market-deep/index.ts`

### Substituir linhas 627-631

De:
```typescript
const maxUrlsToScrape = Math.min(mergedUrls.length, 25);
const urlsToProcess = mergedUrls.slice(0, maxUrlsToScrape);
```

Para:
```typescript
// Round-robin: garantir diversidade de portais
const MAX_URLS = 25;
const MIN_PER_PORTAL = 3;
const byPortal = new Map<string, typeof mergedUrls>();
for (const item of mergedUrls) {
  const key = item.portal.code;
  if (!byPortal.has(key)) byPortal.set(key, []);
  byPortal.get(key)!.push(item);
}

const selected = new Set<string>();
const urlsToProcess: typeof mergedUrls = [];

// Round 1: até MIN_PER_PORTAL por portal
for (const [code, items] of byPortal) {
  for (const item of items.slice(0, MIN_PER_PORTAL)) {
    if (urlsToProcess.length >= MAX_URLS) break;
    urlsToProcess.push(item);
    selected.add(item.url);
  }
}

// Round 2: preencher com restantes por relevância
for (const item of mergedUrls) {
  if (urlsToProcess.length >= MAX_URLS) break;
  if (!selected.has(item.url)) {
    urlsToProcess.push(item);
  }
}

// Log distribuição
const distLog = [...byPortal.entries()].map(([c, items]) => 
  `${c}: ${urlsToProcess.filter(u => u.portal.code === c).length}/${items.length}`
).join(", ");
console.log(`[FASE 2] Distribuição por portal: ${distLog}`);
```

## Resultado esperado

- Kenlo: 3 URLs scrapeadas (das 8 do Google)
- Outros portais: pelo menos 3 cada, restante por relevância
- Total: 25 URLs com representação de todos os portais ativos

## Etapas
1. Implementar round-robin na seleção de URLs
2. Adicionar log de distribuição por portal
3. Deploy + re-testar

## Arquivo modificado
`supabase/functions/analyze-market-deep/index.ts` — ~25 linhas alteradas

