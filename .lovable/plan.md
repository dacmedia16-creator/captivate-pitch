

# Corrigir OLX: 21 encontrados, 0 válidos

## Diagnóstico

Mesmo problema do Viva Real: a URL nativa gerada (`/imoveis/venda/apartamentos/estado-sp/sorocaba-e-regiao/parque-campolim`) não funciona no OLX. O site ignora os segmentos de cidade/bairro e retorna resultados de todo o estado de São Paulo. O filtro `isWrongCityUrl` corretamente descarta tudo como "Outra cidade".

Além disso, o regex para identificar anúncios individuais do OLX está errado — usa `/imoveis/` mas os anúncios reais usam `/d/anuncio/`.

## Correções

### `supabase/functions/inngest-serve/index.ts`

1. **Remover URL nativa do OLX** — OLX não suporta filtragem por cidade/bairro via URL. Retornar `null` no `buildPortalNativeUrl` para o case `"olx"`, forçando uso apenas do Google Search (que já inclui cidade+bairro na query):
   ```typescript
   case "olx":
     return null; // OLX não suporta filtro por cidade via URL
   ```

2. **Corrigir regex de listing do OLX** — trocar `olx\.com\.br\/.*\/imoveis\/` por `olx\.com\.br\/d\/anuncio\/` nos dois lugares onde aparece (linhas 313 e ~210):
   ```typescript
   olx: /olx\.com\.br\/d\/anuncio\//
   ```

3. **Redeploy** da edge function

## Escopo
- 1 arquivo editado (3 alterações pequenas)
- Redeploy de 1 edge function

