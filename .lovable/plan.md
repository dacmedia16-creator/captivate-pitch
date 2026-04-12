

# Expandir Lista de Diferenciais do Imóvel

Adicionar mais opções de diferenciais à lista `DIFFERENTIALS` em `SubjectPropertyForm.tsx`.

## Alteração

**`src/components/market-study/SubjectPropertyForm.tsx`** (linha 38-42) — expandir o array `DIFFERENTIALS`:

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

Novos itens: Quadra, Churrasqueira, Sauna, Academia, Salão de Festas, Playground, Brinquedoteca, Portaria 24h, Jardim, Lavabo, Despensa, Closet, Aquecimento Central, Ar Condicionado, Lareira, Depósito, Coworking, Pet Place, Bicicletário, Spa.

Ajustar o grid para `md:grid-cols-5` para acomodar mais itens.

