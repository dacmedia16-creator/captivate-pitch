

# Melhorar scraping do Kenlo com Firecrawl v2 JSON extraction

## Problema

O Kenlo é um portal SPA (Single Page Application) pesado em JavaScript. O scraping atual pega markdown, que frequentemente retorna < 1000 chars — conteúdo insuficiente para a IA extrair dados estruturados. Resultado: 0 comparáveis do Kenlo mesmo com ~17 URLs abertas.

## Solução

Usar o formato `json` do Firecrawl v2 com um schema definido para páginas do Kenlo. Em vez de depender do markdown (que precisa de renderização JS completa), o Firecrawl v2 usa LLM interno para extrair dados estruturados diretamente da página, mesmo com renderização parcial.

## Mudanças

### 1. `supabase/functions/inngest-serve/index.ts` — `scrapeUrlBatch`

Para URLs do Kenlo, mudar o request ao Firecrawl v2:

**Antes** (linha ~402):
```ts
formats: ["markdown"], waitFor: 10000
+ actions de scroll/wait
```

**Depois**:
```ts
// Para Kenlo individual listings: usar extract (JSON) do Firecrawl v2
formats: ["extract"],
extract: {
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      price: { type: "number", description: "Preço em reais, sem pontos" },
      area: { type: "number", description: "Área total em m²" },
      bedrooms: { type: "number" },
      suites: { type: "number" },
      parking_spots: { type: "number" },
      bathrooms: { type: "number" },
      address: { type: "string" },
      neighborhood: { type: "string" },
      city: { type: "string" },
      condominium: { type: "string" },
      external_id: { type: "string", description: "Código do imóvel" },
      description: { type: "string" }
    },
    required: ["title", "price", "area"]
  },
  prompt: "Extraia os dados deste anúncio imobiliário brasileiro."
}
```

- Se o Firecrawl v2 retornar `extract` com dados válidos (price > 0, area > 0), converter diretamente em comparável e **pular a fase de extração AI** para esse item — economizando tokens e tempo.
- Manter fallback para markdown caso o extract falhe ou retorne dados incompletos.
- Para URLs de listagem múltipla do Kenlo, continuar usando `["markdown", "links"]` pois precisamos dos links individuais.

### 2. Adaptar `ScrapedPage` para carregar dados pré-extraídos

Adicionar campo opcional `extractedData` ao type `ScrapedPage`:
```ts
interface ScrapedPage {
  // ...existing fields
  extractedData?: {  // Pre-extracted by Firecrawl v2 JSON
    title?: string; price?: number; area?: number;
    bedrooms?: number; suites?: number; parking_spots?: number;
    address?: string; neighborhood?: string; condominium?: string;
    external_id?: string;
  };
}
```

### 3. Adaptar `extractWithAI` (Fase 3)

- Separar páginas com `extractedData` válido — essas viram comparáveis diretamente sem passar pela IA.
- Apenas páginas sem `extractedData` vão para o prompt do Gemini.
- Merge dos dois conjuntos no resultado final.

## Escopo

- 1 arquivo editado: `supabase/functions/inngest-serve/index.ts`
- ~60 linhas modificadas em 3 funções (scrapeUrlBatch, ScrapedPage type, extractWithAI)
- Sem migrations, sem mudanças no frontend

## Benefícios

- Kenlo passa a gerar comparáveis reais (Firecrawl LLM lida com JS-heavy pages melhor que markdown)
- Menos tokens gastos no Gemini (páginas Kenlo pré-extraídas não vão para o prompt)
- Mesma abordagem pode ser estendida a outros portais problemáticos no futuro

