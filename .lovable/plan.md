

# Gráfico de Pizza + Layout Melhorado no Slide de Estatísticas

## O que muda
Substituir o `MarketPriceBarChart` (barras verticais) por um **gráfico de pizza (PieChart)** mostrando a distribuição de preços dos comparáveis por faixa. Melhorar o layout geral do slide com métricas em cards e melhor distribuição espacial.

## Passos

### 1. Criar componente `MarketPricePieChart` em `MarketCharts.tsx`
- Usar `PieChart` + `Pie` + `Cell` do Recharts
- Agrupar comparáveis em faixas de preço (ex: abaixo da média, na média, acima da média)
- Cores: verde (abaixo), primary (na média), accent/vermelho (acima)
- Labels com porcentagem e faixa
- Tooltip com contagem e valores

### 2. Melhorar `MarketStats` 
- Cada métrica em um card com fundo sutil, borda, e ícone
- Layout mais espaçado e profissional

### 3. Atualizar slide `market_study_stats` nos 3 layouts
- Layout lado a lado: métricas + pie chart à direita
- Substituir `MarketPriceBarChart` por `MarketPricePieChart`
- Melhor uso do espaço vertical

### Arquivos alterados
- `src/components/charts/MarketCharts.tsx` — adicionar `MarketPricePieChart`, melhorar `MarketStats`
- `src/components/layouts/LayoutExecutivo.tsx` — slide market_study_stats
- `src/components/layouts/LayoutPremium.tsx` — slide market_study_stats
- `src/components/layouts/LayoutImpactoComercial.tsx` — slide market_study_stats

### Build error
Os erros de deploy são transientes (transaction expired) e não relacionados ao código — serão resolvidos automaticamente no próximo deploy.

