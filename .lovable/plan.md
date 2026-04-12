

# Corrigir integração Manus — polling quebrado + timeout mata o fluxo

## Diagnóstico

A apresentação "Cannes 5" ficou em rascunho porque:

1. **Manus task é criada com sucesso** (`task_id: YuYu3VKUnmvSqJ6nJCHCdJ`)
2. **Polling retorna 404 "Task not found"** — o endpoint `task.listMessages` não encontra a task
3. **Após o 404, o polling continua por 3+ minutos** com `agent_status: undefined` até o edge function ser encerrado pelo runtime
4. **Edge function morre sem retornar resposta** → o cliente recebe erro de rede
5. **O `catch` no cliente mostra toast de erro e faz `return`** — nunca chega em `generatePresentationSections` → apresentação fica em "draft"

## Solução — 3 correções

### 1. Corrigir o polling da API Manus
O endpoint de polling pode estar errado. A API v2 do Manus provavelmente usa `/task.get` ou outro endpoint para verificar status, não `task.listMessages`. Vamos:
- Adicionar fallback: tentar primeiro `GET /task.get?task_id=X`, e se falhar tentar `GET /task.listMessages?task_id=X`
- Se receber 404 no polling, **não continuar em loop** — lançar erro imediatamente após 3 tentativas com 404

### 2. Reduzir timeout do Manus para 60s no edge function
O edge function tem um timeout do runtime (~60-120s). Com `MAX_POLL_TIME = 300_000` (5 min), o runtime mata a function antes do timeout interno. Reduzir para 55s para garantir que a function retorne uma resposta (com erro) antes de ser encerrada, permitindo o fallback para Firecrawl funcionar.

### 3. Proteger o fluxo do cliente contra falha total
No `AgentNewPresentation.tsx`, se o Manus E Firecrawl falharem com exceção (não só retorno de erro, mas timeout/network error), o código já faz `useSimulated = true` no `catch`. Mas o `catch` externo (linha 272) faz `return` e nunca gera as sections. Mover o `generatePresentationSections` para fora do try/catch de market analysis, ou garantir que o catch não aborte o fluxo todo.

## Arquivos a modificar

1. **`supabase/functions/analyze-market-manus/index.ts`**
   - Corrigir `pollManusTask`: abortar após 3 erros 404 consecutivos em vez de continuar polling
   - Reduzir `MAX_POLL_TIME` para 55000 (55s)
   - Tentar endpoint alternativo `task.get` antes de `task.listMessages`

2. **`src/pages/agent/AgentNewPresentation.tsx`**
   - Reestruturar o try/catch para que falha no market analysis NÃO impeça `generatePresentationSections` de rodar
   - O market analysis inteiro (Manus/Firecrawl/simulado) deve ficar num try/catch próprio que sempre resolve (com simulado no pior caso)
   - `generatePresentationSections` e as atualizações de seções devem rodar **fora** desse try/catch

## Fluxo corrigido

```text
1. Criar apresentação e job ✓
2. Tentar Manus (timeout 55s) → falha? Firecrawl → falha? Simulado
   ↑ NUNCA lança exceção para fora — sempre retorna dados (mesmo simulados)
3. generatePresentationSections() — SEMPRE executa
4. Atualizar seções com dados de mercado
5. setGenerationDone(true)
```

