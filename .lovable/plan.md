

# Diagnóstico: Cannes 22 travado em "processing"

## Causa raiz

O "Cannes 22" está com status `processing` desde 03:04 — nunca terminou. Os logs mostram:

1. **FASE 1**: 25 URLs coletadas (15 nativo + 10 Google) — OK
2. **FASE 2**: 39 páginas válidas de 43 abertas — expandiu condomínio com paginação (15 URLs do Cannes) + scrapeou 25 originais + bairros como multi-listing
3. **FASE 3**: "Extraindo dados de 39 páginas com IA..." — **último log**. Nada depois.

O edge function **morreu por timeout** durante a chamada à IA. 39 páginas × ~4000-12000 chars cada = prompt gigantesco enviado ao Gemini. A chamada de IA sozinha leva 30-60s, mas a função já gastou ~2 minutos só no scraping. Total excede o timeout do edge function (~150s max).

Como a função morre abruptamente, nunca executa o código que atualiza o status para `completed` ou `failed`. Resultado: fica eternamente em `processing`.

## Problemas secundários confirmados nos logs

- **Google retorna Rio de Janeiro** para busca de Sorocaba (URLs de `/imovel/...rio-de-janeiro...` nos logs)
- **Bairros genéricos** (não-condomínio) sendo scraped e tratados como multi-listing (desperdiça tempo e créditos)

## Correções propostas

### 1. Background processing com `EdgeRuntime.waitUntil`
Retornar `202 Accepted` imediatamente e processar em background. Atualizar status no banco conforme progride. O frontend já faz polling no status.

### 2. Cap de páginas para extração IA
Limitar a 20 páginas enviadas para a IA. Priorizar: páginas do condomínio-alvo > individuais > multi-listing genérico.

### 3. Pré-filtro de cidade antes da IA
Descartar URLs que claramente pertencem a outra cidade (ex: `/rio-de-janeiro/` quando a busca é Sorocaba) ANTES de scrapeá-las, economizando tempo e créditos.

### 4. Atualizar status para "failed" em caso de erro
Wrap principal em try/catch que sempre atualiza o status, mesmo em timeout parcial.

## Arquivo modificado
`supabase/functions/analyze-market-deep/index.ts`

## Etapas
1. Implementar `EdgeRuntime.waitUntil` — retornar 202, processar em background
2. Adicionar filtro de cidade nas URLs da FASE 1/2
3. Limitar páginas enviadas à IA (max 20, priorizando condomínio)
4. Garantir try/catch com status update em todo cenário de falha
5. Deploy e re-testar Cannes 22

