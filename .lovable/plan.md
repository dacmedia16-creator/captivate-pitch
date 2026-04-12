

# Opções para os links dos portais

## Situação atual
Os links são fictícios (`https://zapimoveis.com.br/imovel/543210`) porque os comparáveis são simulados. Clicar neles leva a páginas que não existem.

## Opções

### Opção A — Remover os links dos comparáveis simulados
- Não gerar `source_url` nos comparáveis simulados
- Mostrar apenas o nome do portal como texto, sem link clicável
- Quando integração real existir, os links voltam

### Opção B — Manter links mas com aviso visual
- Adicionar badge "Simulado" ao lado do link
- Manter o link como referência visual do portal de origem

### Opção C — Não mexer agora
- Deixar como está até a integração real com portais ser implementada

## Recomendação
**Opção A** — remover links fictícios evita confusão. Mudança em 1 arquivo (`useSimulateComparables.ts`): setar `source_url: ""` nos comparáveis gerados.

