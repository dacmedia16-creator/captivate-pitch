

# Redesign Premium dos Layouts de Slides

## Direção Visual Geral — "Editorial Atelier"

Inspiração: revistas de arquitetura de luxo (Architectural Digest, Dezeen), keynotes da Apple, lookbooks de moda. A ideia central é tratar cada slide como uma **peça editorial**, não como um dashboard.

### Princípios visuais
- **Assimetria intencional**: composições off-center, texto alinhado à esquerda com margens generosas. Nunca centralizar tudo.
- **Tipografia como protagonista**: Playfair Display em tamanhos dramáticos (48-72px nos títulos), Inter thin/light para corpo. Contrastes de peso extremos.
- **Whitespace agressivo**: 40-60% do slide é espaço vazio. Respiração visual cria percepção de luxo.
- **Cor como acento cirúrgico**: fundos predominantemente brancos ou quase-brancos, com cor (primary/gold) usada em detalhes precisos — linhas finas, números, badges mínimos.
- **Sem bordas genéricas**: eliminar `border border-gray-100` e `rounded-lg` repetitivos. Usar separação por espaçamento, linhas finas (1px) e mudanças de tom.
- **Elementos gráficos sutis**: linhas decorativas verticais/horizontais de 1px, blocos de cor sólida como acentos geométricos, overlays com gradientes suaves.

### O que muda dos layouts atuais
| Aspecto | Antes | Depois |
|---------|-------|--------|
| Títulos | 24-32px, ícone ao lado | 40-56px, sem ícone, tracking tight |
| Subtítulos | Genéricos, pequenos | Uppercase 10px tracking widíssimo, cor accent |
| Cards de dados | Bordas cinza, bg quase invisível | Sem borda, fundo contrastante sólido, tipografia bold |
| Imagens | Grid uniforme, cantos arredondados | Full-bleed ou recortes assimétricos, sem rounded |
| Dividers | Linha dourada curta | Linha vertical lateral como barra de acento |
| Layout geral | Centrado, uniforme | Grids assimétricos 60/40, blocos de cor |
| Ícones Lucide | Em todo header | Removidos dos slides (poluição visual) |

---

## Tipo 1 — Slide de Abertura / Impacto
**Usado em**: `cover`, `broker_intro`

**Conceito**: Full-bleed visual com overlay de gradiente escuro. Título enorme posicionado no terço inferior esquerdo. Composição cinematográfica.

- **Cover**: imagem ocupa 100% do slide. Overlay gradiente de baixo para cima. Título em 48-56px, branco, alinhado à esquerda. Localização em uppercase tracking largo. Logo pequeno no canto superior esquerdo. Barra vertical dourada de 3px ao lado do título.
- **Broker intro**: split layout 40% (foto do broker com máscara geométrica) / 60% (texto). Background branco. Nome em Playfair 40px. Bio em Inter light. Sem badges/chips — dados em lista mínima.

**Sensação**: impacto emocional, cinema, sofisticação.

---

## Tipo 2 — Slide de Conteúdo / Informação
**Usado em**: `property_summary`, `marketing_plan`, `differentials`, `market_study_placeholder`, `pricing_scenarios`, sections genéricas

**Conceito**: Grid editorial assimétrico. Coluna esquerda estreita com label + título. Coluna direita com conteúdo. Sem cards com borda — dados em blocos limpos com fundo sutil.

- **Property summary**: header mínimo + galeria em layout masonry (1 grande + 2 pequenas, sem gap). Métricas em row horizontal sem bordas — número grande + label pequeno.
- **Marketing plan / differentials**: grid 2 colunas, items sem borda, separados por linha fina horizontal. Numeração em Playfair bold, cor primary.
- **Pricing scenarios**: 3 blocos verticais sem borda, separados por linha fina vertical. Número gigante (36px), label micro. Cores: vermelho / primary / verde.
- **Market study**: estatísticas em row horizontal limpo + gráfico de barras com estilo refinado (cantos arredondados menores, sem grid lines pesadas).

**Sensação**: clareza editorial, escaneabilidade, dados com personalidade.

---

## Tipo 3 — Slide de Prova / Fechamento
**Usado em**: `results`, `closing`

**Conceito**: Composição centrada com hierarquia vertical forte. Fundo escuro (primary) com acentos dourados. Tipografia emotiva.

- **Results**: fundo escuro. Métricas enormes (48px) em dourado. Testimonials em itálico com aspas decorativas grandes. Layout vertical, sem grid.
- **Closing**: fundo escuro com gradiente sutil. Logo no topo. Título em Playfair 40px. Nome do broker em dourado. Contato em Inter light. Elemento decorativo: duas linhas horizontais convergindo num ponto dourado (já existe, refinar).

**Sensação**: conclusão memorável, confiança, profissionalismo.

---

## Implementação — Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/layouts/LayoutExecutivo.tsx` | Rewrite completo com novo design system |
| `src/components/layouts/LayoutPremium.tsx` | Rewrite completo — versão mais luxuosa |
| `src/components/layouts/LayoutImpactoComercial.tsx` | Rewrite completo — versão mais bold/comercial |
| `src/components/charts/MarketCharts.tsx` | Refinar estilo dos gráficos (remover grid lines pesadas, tipografia menor) |
| `src/index.css` | Adicionar utilitários CSS para slides (`.slide-label`, `.slide-metric`, etc.) |

**Sem alterações em**: lógica de negócio, `SectionRenderer.tsx` (interface mantida), rotas, Edge Functions, banco de dados.

### Componentes visuais reutilizáveis (inline nos layouts)
- `AccentBar`: barra vertical 3px na cor do branding
- `SectionLabel`: uppercase 10px tracking-[0.25em]
- `MetricBlock`: número grande + label micro, sem borda
- `EditorialDivider`: linha horizontal 1px com opacidade

### Diferenciação entre os 3 layouts
- **Executivo**: clean, minimalista, whitespace dominante, cor como acento pontual
- **Premium**: serif pesado, dourado como fio condutor, texturas de gradiente radial
- **Impacto Comercial**: bold, uppercase, blocos de cor sólida, contraste alto

