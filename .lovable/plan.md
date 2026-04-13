

# Busca Direta nos Portais (Scrape Nativo) + Google como Fallback

## Problema
A busca atual usa apenas Google (`site:portal.kenlo.com.br`) via Firecrawl Search. O Google não indexa a maioria das páginas de portais SPA como Kenlo, resultando em 8 URLs quando existem 148+ imóveis na busca nativa do portal.

## Solução
Adicionar uma **estratégia de scrape direto**: construir a URL de busca nativa de cada portal e usar Firecrawl Scrape (com renderização JS via `waitFor`) para extrair os imóveis diretamente das páginas de resultado.

### Fluxo novo (FASE 1 reformulada)

```text
FASE 1A: Scrape direto da busca nativa de cada portal
         → Constrói URL nativa → Firecrawl /v1/scrape com waitFor: 5000
         → AI extrai lista de URLs individuais + dados visíveis

FASE 1B: Google search (fallback) — igual ao atual
         → Firecrawl /v1/search com site:

Merge resultados + deduplica → FASE 2 (scrape individual, já existente)
```

## Alterações em `supabase/functions/analyze-market-deep/index.ts`

**1. Adicionar função `buildPortalNativeUrl`** que monta a URL de busca nativa para cada portal:

| Portal | Padrão URL |
|--------|-----------|
| ZAP | `zapimoveis.com.br/venda/apartamentos/sp+{cidade}+{bairro}/` |
| VivaReal | `vivareal.com.br/venda/sp/{cidade}/bairros/{bairro}/apartamento_residencial/` |
| Kenlo | `portal.kenlo.com.br/imoveis/a-venda/{tipo}/{cidade}/{bairro}?quartos={n}+` |
| OLX | `olx.com.br/imoveis/venda/apartamentos/estado-sp/sorocaba-e-regiao/{bairro}` |
| ImovelWeb | `imovelweb.com.br/apartamentos-venda-{bairro}-{cidade}.html` |

Normalizar nomes (lowercase, hífens, sem acentos).

**2. Adicionar FASE 1A** antes da FASE 1B existente:
- Para cada portal, construir a URL nativa de busca
- Fazer Firecrawl scrape com `waitFor: 5000` (tempo para SPA renderizar)
- Enviar o markdown resultante para a IA extrair URLs individuais de anúncios
- Adicionar essas URLs ao pool (deduplicando com as do Google)

**3. Manter FASE 1B** (Google search) como complemento, não substituição. Os dois resultados são mergeados.

**4. Aumentar `maxUrlsToScrape`** de 15 para 25, dado que agora teremos mais URLs candidatas.

## Resultado Esperado
- Kenlo: de 8 para ~50+ URLs candidatas
- ZAP/VivaReal: URLs adicionais que o Google não indexou
- Mais comparáveis válidos após FASE 2 de validação individual

## Riscos e Mitigações
- SPAs podem não renderizar totalmente mesmo com `waitFor: 5000` → fallback para Google mantém cobertura
- Mais scrapes = mais créditos Firecrawl → a FASE 1A usa apenas 1 scrape por portal (página de resultados, não individual)
- Timeout da edge function → paralelizar FASE 1A e 1B com `Promise.allSettled`

