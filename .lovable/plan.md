

# ImovelWeb: 30 encontrados, 2 válidos — Análise

## Diagnóstico

Diferente do OLX e Viva Real (onde a URL nativa estava quebrada), o ImovelWeb **está funcionando corretamente**:
- A URL nativa `apartamentos-venda-parque-campolim-sorocaba.html` retorna resultados corretos de Sorocaba
- O regex `/propriedades/` detecta anúncios individuais corretamente
- Os 30 URLs são coletados com sucesso

O problema é que **28 dos 30 comparáveis são descartados na fase de scoring**, provavelmente por:

1. **Similaridade mínima alta (40/100)** — sem bairro ou cidade no dado extraído pela IA, o comparável perde 20-25 pontos
2. **AI extraction incompleta** — a IA não extrai `neighborhood` ou `city` de algumas páginas do ImovelWeb, resultando em score baixo
3. **Área fora da faixa** — comparáveis com metragem muito diferente perdem até 15 pontos

## Correções propostas

### `supabase/functions/inngest-serve/index.ts`

1. **Inferir cidade/bairro do ImovelWeb pela URL** — URLs do ImovelWeb contêm o bairro no slug (ex: `propriedades/apartamento-a-venda-parque-campolim-3029242645.html`). Adicionar lógica no pós-processamento de AI extraction para preencher `city` e `neighborhood` quando ausentes, usando o contexto da busca (property.city/neighborhood)

2. **Reduzir similaridade mínima de 40 para 30** — O threshold de 40 é muito restritivo quando a IA não extrai todos os campos. Com 30, comparáveis que têm preço+área compatíveis mas faltam dados de localização ainda passam

3. **Melhorar prompt de extração para ImovelWeb** — Adicionar instrução explícita para extrair bairro e cidade do título e endereço das páginas do ImovelWeb

## Impacto esperado
- De ~2 válidos para ~8-15 válidos do ImovelWeb
- Sem afetar qualidade (comparáveis ruins ainda serão filtrados por preço/área/duplicata)

## Escopo
- 1 arquivo editado (3 alterações)
- Redeploy de 1 edge function

