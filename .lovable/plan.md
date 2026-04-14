

# Plano: Corrigir URLs individuais dos comparáveis

## Problema
A IA extrai múltiplos imóveis de uma página de resultados de busca e usa a URL da página de busca como `source_url` para todos. Resultado: 8 de 10 comparáveis apontam para a mesma URL genérica de busca, não para o anúncio individual.

## Causa raiz
No prompt de extração (`analyze-market-deep/index.ts`, linha 920):
> "Use a URL da página como source_url para todos os imóveis extraídos da mesma listagem."

Essa instrução contradiz a linha 932:
> "Inclua o URL EXATO do anúncio no campo source_url."

## Correção em `supabase/functions/analyze-market-deep/index.ts`

### 1. Atualizar o prompt de extração
Substituir a instrução conflitante por:
- "Para cada imóvel, extraia o URL individual do anúncio (link que leva direto à ficha do imóvel). Se a página é de resultados de busca, cada card deve ter um link individual — use esse link."
- "Se não for possível extrair o URL individual, use a URL da página e adicione o external_id do imóvel."
- Adicionar campo `individual_url` como alternativa no schema.

### 2. Fallback: construir URL individual quando possível
Após extração, se o `source_url` parece ser uma URL de busca (não contém `/imovel/` ou `id-`), e o `external_id` está presente, tentar montar a URL individual do portal. Para VivaReal/ZAP: `https://www.vivareal.com.br/imovel/{external_id}`.

### 3. Instrução no prompt para extrair external_id
Reforçar no prompt que o `external_id` é o código do anúncio no portal (ex: "id-2446277614") e deve ser extraído de cada card de resultado.

## Etapas
1. Corrigir prompt conflitante (remover linha 920, reforçar extração de URL individual)
2. Adicionar lógica de fallback para montar URL individual a partir do external_id
3. Deploy + teste

## Arquivo modificado
`supabase/functions/analyze-market-deep/index.ts` — ~10 linhas alteradas no prompt + ~15 linhas de fallback

