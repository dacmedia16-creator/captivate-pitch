

# Estudo de Mercado com IA + Scraping Real de Portais

## Visao geral
Substituir os dados simulados por dados reais, usando Firecrawl para buscar imoveis nos portais (ZAP, Viva Real, OLX) e Lovable AI para analisar e estruturar os resultados.

## Arquitetura

```text
Wizard Step 3 (filtros + portais)
       |
       v
Edge Function: "analyze-market"
       |
       +---> Firecrawl Search (busca em cada portal selecionado)
       |        ex: "apartamento 3 quartos 120m2 Moema Sao Paulo site:zapimoveis.com.br"
       |
       +---> Lovable AI (google/gemini-2.5-flash)
       |        - Recebe markdown dos resultados
       |        - Extrai dados estruturados via tool calling:
       |          titulo, preco, area, quartos, vagas, endereco, bairro, URL real
       |        - Calcula similarity score
       |
       v
Retorna comparaveis reais -> salva no banco
```

## Etapas de implementacao

### 1. Conectar Firecrawl ao projeto
- Linkar o conector Firecrawl ja disponivel no workspace

### 2. Criar edge function `analyze-market`
- Recebe: dados do imovel, portais selecionados, filtros
- Para cada portal, monta uma query de busca contextual (ex: "apartamento 3 quartos 80m2 Centro Sorocaba venda")
- Usa Firecrawl Search para buscar em cada portal (site:zapimoveis.com.br, site:vivareal.com.br, etc.)
- Envia o markdown dos resultados para Lovable AI com tool calling para extrair dados estruturados
- Retorna array de comparaveis com dados reais (titulo, preco, area, quartos, URL real, fonte)

### 3. Atualizar o fluxo do wizard
- `AgentNewPresentation.tsx`: substituir chamada a `generateSimulatedComparables` por invocacao da edge function
- Adicionar loading state com mensagem "Analisando portais..." durante a busca
- Tratar erros (portal sem resultados, rate limit, etc.)

### 4. Manter fallback simulado
- Se a edge function falhar ou nao retornar resultados suficientes, usar simulados como fallback
- Marcar comparaveis com `source_name` do portal real e `source_url` com link real

### 5. Atualizar pagina de detalhe do estudo
- `MarketStudyDetail.tsx`: links dos comparaveis agora apontam para URLs reais dos portais

## Arquivos modificados/criados
1. `supabase/functions/analyze-market/index.ts` — nova edge function
2. `src/pages/agent/AgentNewPresentation.tsx` — chamar edge function em vez de simulacao
3. `src/hooks/useSimulateComparables.ts` — manter como fallback

## Mapeamento de portais para busca
- ZAP Imoveis → `site:zapimoveis.com.br`
- Viva Real → `site:vivareal.com.br`  
- OLX → `site:olx.com.br/imoveis`
- Imovelweb → `site:imovelweb.com.br`

## Pre-requisitos
- Conectar Firecrawl (ja disponivel no workspace)
- LOVABLE_API_KEY ja configurado

## Riscos
- Portais podem bloquear scraping em algumas paginas — Firecrawl lida com isso
- Rate limits do Firecrawl — limitar a 3-5 buscas por estudo
- Qualidade da extracao depende do conteudo retornado pelo Firecrawl

