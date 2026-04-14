

# Plano: Suporte a páginas de condomínio multi-listing no scraping

## Problema

A URL `vivareal.com.br/condominio/...` é uma página de **listagem de condomínio** que contém 26 imóveis. O fluxo atual (`analyze-market-deep`) trata cada URL scraped como um anúncio individual, então a IA extrai apenas 1 imóvel de uma página que tem 26.

## Causa raiz

Dois pontos no `analyze-market-deep`:

1. **FASE 1A** (scrape nativo): O regex para VivaReal filtra apenas URLs com `/imovel/`. URLs `/condominio/` não são reconhecidas como páginas de busca nem como anúncios individuais.

2. **FASE 2** (extração por IA): O system prompt diz *"Cada bloco '--- Anúncio X ---' é UM anúncio individual já validado"*. Quando uma página de condomínio com 26 imóveis entra nessa fase, a IA recebe a instrução de que é apenas 1 anúncio.

## Solução proposta

Modificar **apenas** `analyze-market-deep/index.ts`:

### Mudança 1 — Detectar páginas multi-listing

Após o scrape na FASE 2, antes de enviar para a IA, detectar se a URL é uma página de listagem (não um anúncio individual). Critérios:
- URL contém `/condominio/`, `/busca/`, ou padrões de listagem conhecidos
- O markdown é longo (>2000 chars) e contém múltiplos padrões de preço (`R$`)

### Mudança 2 — Separar fluxo de extração

Para páginas detectadas como multi-listing:
- Enviar para a IA com prompt diferente: *"Esta é uma página de LISTAGEM contendo VÁRIOS imóveis. Extraia CADA imóvel individualmente."*
- Extrair URLs individuais dos links da página (já disponíveis via formato `links` do Firecrawl)
- Se encontrar URLs individuais, adicioná-las à fila de scrape

### Mudança 3 — Atualizar o scrape da FASE 2 para pedir links

Adicionar `"links"` ao array de formatos no scrape individual:
```
formats: ["markdown", "links"]
```

Quando a página for detectada como multi-listing, extrair os links individuais (`/imovel/`) e re-enqueá-los para scrape individual.

### Mudança 4 — Ajustar prompt da IA na FASE 3

O prompt da FASE 3 deve ter duas variantes:
- **Anúncio individual**: prompt atual (sem mudanças)
- **Página de listagem**: prompt que diz explicitamente para extrair todos os imóveis da página

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/analyze-market-deep/index.ts` | Detectar multi-listing, extrair links individuais, ajustar prompt |

## Etapas de implementação

1. Adicionar função `isMultiListingUrl(url)` que detecta URLs de condomínio/busca
2. Na FASE 2, ao scrape de uma URL multi-listing, pedir formato `["markdown", "links"]`
3. Se links individuais forem encontrados: adicioná-los à fila (com dedup)
4. Se não encontrar links individuais: enviar o markdown para a IA com prompt multi-listing
5. Ajustar o prompt da FASE 3 para tratar ambos os casos
6. Deploy e teste

## Riscos

- **Timeout**: scraping adicional de URLs individuais pode estourar o timeout da edge function. Mitigação: limitar a 10-15 URLs extras.
- **Créditos Firecrawl**: mais scrapes = mais créditos. Mitigação: só expandir multi-listing se detectado.

