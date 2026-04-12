

# Integrar Manus AI para Estudo de Mercado

## Visão geral
Substituir o motor atual (Firecrawl + Lovable AI) pelo Manus AI como agente autônomo de pesquisa de mercado. O Manus recebe uma tarefa descritiva, navega portais, coleta dados e retorna resultados completos.

## Como funciona a API do Manus
- **Assíncrona**: cria-se uma task, depois faz polling até completar
- **Endpoint**: `https://api.manus.ai/v2/task.create` (POST) e `task.listMessages` (GET)
- **Auth**: header `x-manus-api-key: $MANUS_API_KEY`
- **O agente navega a web sozinho** — não precisa de Firecrawl

## Plano

### 1. Configurar API Key do Manus
- Solicitar ao usuário a `MANUS_API_KEY` via ferramenta de secrets
- Obtida em: Manus webapp > API Integration settings

### 2. Criar edge function `analyze-market-manus`
Nova function que:
1. Recebe dados do imóvel, portais desejados e filtros
2. Monta um prompt descritivo para o Manus: "Pesquise imóveis comparáveis a este apartamento de 3 quartos, 120m², no bairro X, cidade Y. Busque nos portais ZAP Imóveis, Viva Real, OLX. Retorne título, preço, área, quartos, endereço e link de cada imóvel encontrado..."
3. Cria task via `POST /v2/task.create`
4. Faz polling via `GET /v2/task.listMessages` até `agent_status=completed` (com timeout de 120s)
5. Extrai dados estruturados da resposta do Manus (usando Lovable AI para parse se necessário)
6. Retorna no mesmo formato que a function atual (`{ success, comparables }`)

### 3. Atualizar `AgentNewPresentation.tsx`
- Trocar chamada de `analyze-market` para `analyze-market-manus`
- Adicionar mensagens de loading mais descritivas ("Manus está pesquisando portais...")
- Manter fallback para comparáveis simulados se o Manus falhar

### 4. Manter function antiga como fallback
- `analyze-market` continua existindo (Firecrawl)
- Se `MANUS_API_KEY` não estiver configurada, usa Firecrawl automaticamente

## Arquivos
1. **Criar**: `supabase/functions/analyze-market-manus/index.ts`
2. **Modificar**: `src/pages/agent/AgentNewPresentation.tsx` — chamar nova function

## Riscos
- Manus é assíncrono e pode levar 30-120s para completar a pesquisa
- Formato de resposta do Manus é texto livre — precisa de parsing com IA
- API do Manus tem rate limits próprios
- Fallback para Firecrawl garante que nunca falha completamente

