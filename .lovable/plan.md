

# Plano: Fazer Kenlo funcionar nos resultados

## Diagnóstico final

Os logs confirmam que **todas as 4 páginas Kenlo (search e individuais) retornam ~900 chars** de markdown. O `waitFor: 10000` e `actions` de scroll não fazem diferença — o SPA do Kenlo simplesmente não renderiza no Firecrawl. O Google Cache fallback não dispara porque 900 > 500 (threshold atual).

O problema NÃO é de priorização ou filtro — as URLs do Kenlo estão sendo scrapeadas, mas o conteúdo retornado é vazio.

## Solução: abordagem tripla

### 1. Migrar Kenlo para Firecrawl v2 (principal)
O código usa `api.firecrawl.dev/v1/scrape` — v2 tem melhor suporte a JS rendering. Mudar para `api.firecrawl.dev/v2/scrape` especificamente para URLs Kenlo.

### 2. Extrair dados do slug da URL do Kenlo
URLs individuais do Kenlo têm formato previsível:
`/imovel/apartamento-sorocaba-3-quartos-104-m/AP2337-A1`

Podemos extrair: tipo (apartamento), cidade (sorocaba), quartos (3), área (104m²), ID (AP2337-A1).

Quando o markdown é insuficiente (<1000 chars) para URLs individuais do Kenlo, criar um "markdown sintético" a partir do slug para que a IA tenha dados mínimos para trabalhar.

### 3. Reduzir threshold do Google Cache para 1000 chars
Mudar de 500 para 1000 chars — assim as páginas Kenlo (922-962 chars) acionam o fallback do Google Cache.

## Etapas

1. **Reduzir threshold do Google Cache** de 500 para 1000 chars (1 linha)
2. **Gerar markdown sintético** a partir do slug da URL Kenlo quando o markdown real é insuficiente (~15 linhas)
3. **Migrar scrape do Kenlo para Firecrawl v2** (`/v2/scrape`) (~2 linhas)
4. Deploy + verificar logs

## Arquivo modificado
`supabase/functions/analyze-market-deep/index.ts`

