

# Fase 2 — Motor de Similaridade + Ajustes Automáticos

## O que será criado

### 1. Hook `useMarketSimilarity`
Arquivo: `src/hooks/useMarketSimilarity.ts`

Calcula similarity score (0-100) entre o imóvel avaliado e cada comparável usando pesos:
- Mesmo condomínio: +25
- Mesmo bairro: +20
- Mesmo tipo de imóvel: +15
- Faixa de metragem (±20%): +15
- Quartos/suítes/vagas próximos: +10
- Mesmo padrão construtivo: +10
- Mesmo perfil (combinação geral): +5

Recebe o subject property e array de comparáveis, retorna comparáveis com scores atualizados. Descarta se score < threshold configurável (default 30).

### 2. Hook `useMarketAdjustments`
Arquivo: `src/hooks/useMarketAdjustments.ts`

Calcula ajustes automáticos no preço de cada comparável baseado nas diferenças com o imóvel avaliado:
- Piscina: ±4%
- Área gourmet: ±2.5%
- Suíte master (mais suítes): ±2%
- Mais vagas: ±1.5% por vaga
- Estado de conservação: ±3-8% (escala de 5 níveis)
- Idade do imóvel: ±2-5%
- Vista privilegiada: ±4%
- Terreno maior: proporcional à diferença de área
- Acabamento superior (padrão construtivo): ±5%

Retorna array de ajustes por comparável com `direction: positive | negative | neutral`, e o `adjusted_price` calculado.

### 3. Integrar no fluxo de criação do estudo
Arquivo: `src/pages/agent/NewMarketStudy.tsx`

Após criar o estudo e inserir comparáveis (simulados ou reais), rodar automaticamente:
1. `calculateSimilarityScores()` para atribuir scores
2. `calculateAdjustments()` para gerar ajustes e preços ajustados
3. Salvar ajustes na tabela `market_study_adjustments`
4. Calcular e salvar resultado na tabela `market_study_results`

### 4. Componente `AdjustmentBadge`
Arquivo: `src/components/market-study/AdjustmentBadge.tsx`

Badge visual: verde (positivo), vermelho (negativo), cinza (neutro) com percentual.

### 5. Atualizar tela de resultado
Arquivo: `src/pages/agent/MarketStudyResult.tsx`

- Mostrar ajustes por comparável na tabela (expandir linha ou tooltip)
- Mostrar `adjusted_price` ao lado do preço original
- Usar badges de ajuste
- Calcular e exibir preços sugeridos (anúncio, mercado, venda rápida) baseados nos preços ajustados

### 6. Hook de recálculo
Quando o usuário aprovar/rejeitar comparáveis na tela de resultado, recalcular scores, ajustes e preços em tempo real usando os mesmos hooks.

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useMarketSimilarity.ts` | Criar |
| `src/hooks/useMarketAdjustments.ts` | Criar |
| `src/components/market-study/AdjustmentBadge.tsx` | Criar |
| `src/pages/agent/NewMarketStudy.tsx` | Modificar — integrar motor |
| `src/pages/agent/MarketStudyResult.tsx` | Modificar — mostrar ajustes + recálculo |

Nenhuma migração de banco necessária — as tabelas `market_study_adjustments` e `market_study_results` já existem.

