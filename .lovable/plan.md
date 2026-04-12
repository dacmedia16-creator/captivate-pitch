

# Estudo de Mercado, IA, PDF e Link Compartilhavel — Plano

## Status Atual

A maioria dos itens ja esta implementada:

- **MarketStudyDetail.tsx**: tabela de comparaveis com score, preco, area, quartos, vagas, imagem, fonte, aprovar/remover, adicionar manualmente, calculos automaticos, 3 cards de cenario
- **generate-presentation-text**: edge function com Lovable AI Gateway (Gemini), tool calling para gerar resumo do imovel, perfil comprador, analise mercado, justificativa preco, cenarios, fechamento
- **export-pdf**: edge function que gera HTML estilizado e salva no storage
- **SharedPresentation.tsx**: rota publica `/share/:token` com branding
- **PresentationEditor.tsx**: botoes de exportar PDF, compartilhar, gerar IA, duplicar, salvar modelo
- **useAuditLog.ts**: funcao `logAudit` usada em criacao, edicao, geracao IA, exportacao PDF

## Pendencias Identificadas

### 1. MarketStudyDetail — mostrar filtros e portais (pequeno)
A pagina nao mostra os filtros usados nem os portais selecionados do job. Adicionar card com essas informacoes.

### 2. Export PDF — melhorar qualidade (medio)
O edge function atual gera HTML simples. Precisa melhorar para ter aparencia premium com branding, paginacao, e visual profissional. Nao e possivel usar headless browser no edge function, mas podemos melhorar significativamente o HTML/CSS gerado.

### 3. Seed Demo — dados de apresentacao e estudo (medio)
Falta criar dados demo:
- 1 apresentacao demo vinculada ao corretor1
- 12 sections geradas
- 1 market_analysis_job
- 5-8 comparaveis ficticios
- 1 market_report com cenarios calculados

### 4. Filtros no MarketStudyDetail (pequeno)
Adicionar card mostrando filtros (raio, faixa de preco, faixa de area) e portais selecionados a partir do campo `filters` e `selected_portals` do job.

## Arquivos a Modificar/Criar

| Arquivo | Acao |
|---------|------|
| `src/pages/agent/MarketStudyDetail.tsx` | Adicionar cards de filtros usados e portais selecionados |
| `supabase/functions/export-pdf/index.ts` | Melhorar HTML com branding premium, paginacao, cores, logo |
| `supabase/functions/seed-demo/index.ts` | Adicionar seed de 1 apresentacao + sections + estudo + comparaveis + report |

## Detalhes Tecnicos

### MarketStudyDetail — filtros e portais
- Ler `job.filters` (jsonb) e `job.selected_portals` (jsonb) 
- Renderizar em card apos resumo do imovel
- Buscar nomes dos portais de `portal_sources`

### Export PDF — upgrade visual
- Adicionar logo da imobiliaria no header
- Usar cores do branding (primary_color, secondary_color)
- Melhorar tipografia com fontes web-safe (Georgia para headings)
- Adicionar page breaks entre secoes
- Footer com branding em cada pagina
- Manter como HTML (PDF real requer headless browser nao disponivel)

### Seed Demo
- Criar apresentacao para corretor1@demo.com no tenant demo
- Gerar as 12 sections com conteudo ficticio realista
- Criar market_analysis_job com status "completed"
- Inserir 6 comparaveis ficticios com precos e scores
- Criar market_report com cenarios calculados
- Executar via chamada ao edge function seed-demo atualizado

