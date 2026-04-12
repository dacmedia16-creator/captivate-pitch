

# Corrigir integração Manus AI — API v2 correta + prompt detalhado por portal

## Problema atual
A edge function `analyze-market-manus` tem vários erros em relação à API real do Manus:
- URL errada (`/v1/tasks` em vez de `/v2/task.create`)
- Autenticação errada (`Authorization: Bearer` em vez de `x-manus-api-key`)
- Formato de request errado (campo `prompt` em vez de `message.content`)
- Polling errado (endpoint e status codes incorretos)
- O prompt não instrui o Manus a **navegar cada portal individualmente** e coletar os links reais

## Solução

### Reescrever `supabase/functions/analyze-market-manus/index.ts`

**1. Endpoints corretos da API v2:**
- `POST https://api.manus.ai/v2/task.create` com header `x-manus-api-key`
- Body: `{ message: { content: [{ type: "text", text: "..." }] } }`
- Resposta: `{ ok: true, task_id: "..." }`

**2. Polling correto:**
- `GET https://api.manus.ai/v2/task.listMessages?task_id=X&order=desc&limit=50`
- Procurar eventos `status_update` com `agent_status`:
  - `running` → continuar polling
  - `stopped` → ler `assistant_message` events para resultados
  - `error` → falhou

**3. Prompt melhorado — instrui o Manus a navegar cada portal:**
O prompt será reescrito para instruir o Manus a:
- Abrir cada portal (ZAP, Viva Real, OLX, etc.) no navegador
- Aplicar os filtros do usuário (tipo, bairro, área, preço, quartos)
- Coletar cada anúncio individual com **o link direto do anúncio**
- Retornar JSON estruturado com `source_url` sendo a URL real do anúncio no portal

**4. Timeout aumentado para 5 minutos** (Manus navega portais reais, leva tempo)

### Arquivos modificados
1. `supabase/functions/analyze-market-manus/index.ts` — reescrita completa com API v2

### Sem mudanças no frontend
O `AgentNewPresentation.tsx` já chama `analyze-market-manus` e espera `{ success, comparables }` — o contrato se mantém.

## Exemplo do novo prompt enviado ao Manus

```text
Você é um pesquisador imobiliário. Sua tarefa é navegar nos portais 
imobiliários listados abaixo e encontrar imóveis comparáveis ao imóvel 
de referência.

INSTRUÇÕES IMPORTANTES:
1. Acesse CADA portal listado abaixo usando o navegador
2. Em cada portal, busque imóveis com características similares
3. Para CADA imóvel encontrado, copie o link direto do anúncio
4. Colete: título, preço, área, quartos, suítes, vagas, endereço, 
   bairro, e o LINK DO ANÚNCIO

Imóvel de referência: Apartamento, 3 quartos, 120m², Bairro X, Cidade Y
Portais: ZAP Imóveis (zapimoveis.com.br), Viva Real (vivareal.com.br)
Filtros: área 100-140m², preço R$700k-R$1M

Retorne JSON com source_url sendo a URL real do anúncio no portal.
```

