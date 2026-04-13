

# Integrar Manus como Busca Principal com Firecrawl como Fallback

## Situação Atual
- `AgentNewPresentation.tsx` chama `analyze-market-deep` (Firecrawl nativo + Google) como principal
- Se falhar, cai para `analyze-market` (Firecrawl básico)
- `analyze-market-manus` existe mas **não é chamado** de lugar nenhum no frontend

## Problema do Manus
O Manus navega portais como um humano (ideal para SPAs como Kenlo), mas o edge function tem timeout de 55s para polling. Tarefas Manus costumam levar mais que isso. Precisamos de uma estratégia que aproveite o Manus sem travar.

## Solução: Cascata Manus → Firecrawl Deep → Firecrawl Básico

### Alteração em `src/pages/agent/AgentNewPresentation.tsx` (linhas 178-207)

Nova ordem de tentativas no `runMarketAnalysisBackground`:

```text
1. Tentar analyze-market-manus (55s timeout)
   → Se retornar comparáveis: usar esses resultados ✓
   → Se timeout ou falhar: ir para passo 2

2. Tentar analyze-market-deep (Firecrawl nativo + Google)
   → Se retornar comparáveis: usar esses resultados ✓
   → Se falhar: ir para passo 3

3. Tentar analyze-market (Firecrawl básico)
   → Último recurso
```

### Código da cascata

Substituir o bloco try/catch (linhas 181-207) por:

```typescript
// 1. Try Manus (navigates portals like a human — best for SPAs)
try {
  console.log("Trying analyze-market-manus (browser navigation)...");
  const { data: manusResult, error: manusError } = await supabase.functions.invoke("analyze-market-manus", { body: analyzeBody });
  
  if (!manusError && manusResult?.success && manusResult?.comparables?.length) {
    console.log(`Manus returned ${manusResult.comparables.length} comparables`);
    scrapedComparables = manusResult.comparables;
    toast.success(`Manus encontrou ${manusResult.comparables.length} comparáveis`);
  } else {
    throw new Error(manusError?.message || manusResult?.message || "Manus returned no results");
  }
} catch (manusErr) {
  console.warn("Manus failed, falling back to Firecrawl deep...", manusErr);
  
  // 2. Firecrawl Deep (native portal scrape + Google)
  try {
    const { data: deepResult, error: deepError } = await supabase.functions.invoke("analyze-market-deep", { body: analyzeBody });
    if (!deepError && deepResult?.success && deepResult?.comparables?.length) {
      scrapedComparables = deepResult.comparables;
      researchMetadata = deepResult.research_metadata || null;
    } else {
      throw new Error("deep failed");
    }
  } catch {
    // 3. Basic Firecrawl fallback
    const { data: basicResult } = await supabase.functions.invoke("analyze-market", { body: analyzeBody });
    if (basicResult?.success && basicResult?.comparables?.length) {
      scrapedComparables = basicResult.comparables;
    } else {
      toast.warning("Não foi possível buscar comparáveis nos portais.");
    }
  }
}
```

### Nenhuma alteração no edge function `analyze-market-manus`
A função já está pronta — aceita o mesmo formato `{ property, portals, filters }` e retorna `{ success, comparables }`.

## Resultado
- Manus tenta primeiro (55s) — melhor para portais SPA como Kenlo
- Se Manus não completar a tempo, Firecrawl Deep assume
- Se Firecrawl Deep falhar, Firecrawl básico é o último recurso
- Tudo roda em background (não trava a UI)

