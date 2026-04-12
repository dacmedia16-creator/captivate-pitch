
# Fix: Redirecionamento do Wizard para o Editor

## Problema
`handleAnimationDone` captura `createdId` via closure no momento da criação do callback. Como `setCreatedId` é async, o valor ainda é `null` quando `handleAnimationDone` executa.

## Solução
Usar `useRef` para armazenar o `createdId` e acessá-lo dentro do `setTimeout`.

## Arquivo
`src/pages/agent/AgentNewPresentation.tsx`

## Mudanças
1. Adicionar `const createdIdRef = useRef<string | null>(null);`
2. Em `handleGenerate`, após `setCreatedId(pres.id)`, adicionar `createdIdRef.current = pres.id;`
3. Em `handleAnimationDone`, trocar `if (createdId)` por `if (createdIdRef.current)` e usar `createdIdRef.current` no navigate

Mudança mínima — apenas 3 linhas alteradas.
