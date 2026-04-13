

# Expandir Diferenciais no Wizard de Apresentações

O array `DIFFERENTIALS` em `src/components/wizard/StepPropertyData.tsx` (linha 26-30) ficou com apenas 12 itens. Precisa ser atualizado para incluir os mesmos 32 itens que já existem em `SubjectPropertyForm.tsx`.

## Alteração

**`src/components/wizard/StepPropertyData.tsx`** (linhas 26-30) — substituir o array:

```typescript
const DIFFERENTIALS = [
  "Piscina", "Área Gourmet", "Escritório", "Energia Solar", "Automação",
  "Planejados", "Vista Privilegiada", "Esquina", "Quintal Amplo", "Varanda",
  "Elevador", "Mobiliado", "Quadra", "Churrasqueira", "Sauna", "Academia",
  "Salão de Festas", "Playground", "Brinquedoteca", "Portaria 24h",
  "Jardim", "Lavabo", "Despensa", "Closet", "Aquecimento Central",
  "Ar Condicionado", "Lareira", "Depósito", "Coworking", "Pet Place",
  "Bicicletário", "Spa",
];
```

Verificar também se o grid de checkboxes usa `md:grid-cols-5` (ou ajustar se necessário).

