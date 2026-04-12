

# Auditoria dos Templates de Slides e Estrategia de Redesign Premium

## 1. Os 3 Templates Reais do Projeto

| Template | Arquivo | Personalidade Visual |
|---|---|---|
| **Executivo** | `src/components/layouts/LayoutExecutivo.tsx` (421 linhas) | Azul profundo + barra vermelha lateral. Gradientes lineares no cover. Clean, corporativo. |
| **Premium** | `src/components/layouts/LayoutPremium.tsx` (409 linhas) | Deep blue (`#001F5C`) + gradientes radiais + bordas sutis com accent. Mais atmosferico. |
| **Impacto Comercial** | `src/components/layouts/LayoutImpactoComercial.tsx` (400 linhas) | Uppercase bold, blocos solidos de cor, estilo "pitch deck" agressivo. Sem rounded corners. |

Todos compartilham:
- Mesma font stack: `'Gotham', 'Montserrat', sans-serif`
- Mesmas cores base: `BLUE=#003DA5`, `RED=#DC1431`
- Mesmas classes CSS utilitarias: `slide-title`, `slide-label`, `slide-metric`, `slide-body`
- O mesmo `SectionRenderer.tsx` como dispatcher

**Section keys suportadas** (iguais nos 3): `cover`, `broker_intro`, `property_summary`, `market_study_placeholder`, `pricing_scenarios`, `closing`, `objectives_alignment`, `agency_value_proposition`, `required_documentation`, `about_global/national/regional`, `differentials`, `results`, `marketing_actions`, `testimonials` + generic fallback.

## 2. Arquivos que Controlam os Templates

| Arquivo | Responsabilidade |
|---|---|
| `src/components/layouts/LayoutExecutivo.tsx` | Renderiza todos os section_keys no estilo Executivo |
| `src/components/layouts/LayoutPremium.tsx` | Idem, estilo Premium |
| `src/components/layouts/LayoutImpactoComercial.tsx` | Idem, estilo Impacto |
| `src/components/layouts/SectionRenderer.tsx` | Switch que decide qual layout usar |
| `src/index.css` | Classes utilitarias globais (`.slide-title`, `.slide-label`, `.slide-metric`, `.slide-body`, `.editorial-divider`) |
| `src/pages/agent/PresentationEditor.tsx` | Container do editor (define `max-w-3xl`, `slide-frame`, `bg-white`) |
| `src/pages/agent/PresentationMode.tsx` | Container da apresentacao fullscreen (`max-w-4xl`) |

## 3. Partes que Devem Virar Componentes Reutilizaveis

Hoje, cada layout repete os mesmos patterns inline. Extrair em componentes atomicos permitiria redesign centralizado:

| Componente Proposto | Pattern Repetido Hoje | Impacto |
|---|---|---|
| `SlideHeader` | Label + titulo + divider (repetido em TODOS os section_keys, 3x cada) | Centraliza tipografia e espacamento |
| `SlideMetricRow` | Grid de metricas numéricas (area, quartos, suites, vagas) | Usado em property_summary, about_*, value_proposition |
| `SlideCover` | Imagem + overlay gradiente + titulo + subtitulo | Cada layout tem cover mas com 90% da mesma logica |
| `SlideClosing` | Logo + ornamento + nome + contatos | Identico nos 3 layouts |
| `SlideStatBar` | Barra de stats com numeros grandes + labels pequenos | Repetido em about_*, agency_value_proposition |
| `SlideItemList` | Lista numerada de items (diferenciais, docs, acoes) | Repetido 4+ vezes em cada layout |
| `SlideImageGrid` | Grid de imagens do imovel (hero + thumbnails) | Repetido em property_summary |
| `SlideScenarios` | 3 colunas de preco (rapida/mercado/aspiracional) | Identico nos 3 layouts |

## 4. Como Aplicar uma Referencia Externa de Design

```text
Fluxo proposto:

  Referencia Externa (Canva/Figma/PDF)
          |
          v
  [Extrair Design Tokens]
  - Paleta de cores (primary, accent, surface, text)
  - Tipografia (font family, weights, sizes por hierarquia)
  - Espacamentos (padding, gaps, margins)
  - Decoradores (linhas, gradientes, shapes)
  - Proporcoes (aspect ratio do slide, grid columns)
          |
          v
  [Criar Arquivo de Tema]
  src/components/layouts/themes/
  ├── theme.types.ts        ← Interface SlideTheme
  ├── theme-executivo.ts    ← Tokens atuais
  ├── theme-premium.ts     ← Tokens atuais
  ├── theme-impacto.ts     ← Tokens atuais
  └── theme-novo.ts        ← Tokens da referencia externa
          |
          v
  [Componentes Atomicos recebem theme via prop]
  <SlideHeader theme={theme} /> em vez de cores hardcoded
          |
          v
  [Branding do tenant sobrescreve tokens selecionados]
  primary_color e secondary_color do banco continuam funcionando
```

**Passos concretos:**
1. Extrair componentes reutilizaveis (SlideHeader, SlideMetricRow, etc.)
2. Criar interface `SlideTheme` com todos os tokens visuais
3. Migrar os 3 layouts existentes para usar componentes + theme
4. Quando tiver a referencia externa: criar novo arquivo de tema + ajustar componentes
5. Resultado: trocar o visual inteiro mudando UM arquivo de tokens

## 5. Limitacoes Tecnicas Atuais

| Limitacao | Impacto | Solucao |
|---|---|---|
| **Sem escala fixa 1920x1080** | Slides se adaptam ao container com `min-h-[500px]`, nao tem proporcao fixa 16:9. No fullscreen e no editor, o aspecto visual muda. | Implementar `ScaledSlide` wrapper que renderiza a 1920x1080 e escala com `transform: scale()` |
| **Cores hardcoded inline** | Cada layout tem `BLUE`, `RED`, `DEEP` hardcoded. Mudar visual requer editar 3 arquivos. | Extrair para theme objects |
| **Sem aspect-ratio no container** | O slide no editor tem `max-w-3xl bg-white` sem proporcao. Nao parece uma apresentacao real. | Adicionar `aspect-ratio: 16/9` ao container do slide |
| **CSS utilitario limitado** | `.slide-title`, `.slide-metric` etc. usam tamanhos fixos em px. Nao escalam com o container. | Com ScaledSlide a 1920x1080, os px passam a funcionar corretamente |
| **Duplicacao massiva** | ~1200 linhas nos 3 layouts, com 60-70% de logica identica. Qualquer melhoria visual precisa ser feita 3 vezes. | Componentizar primeiro, depois redesignar |
| **Sem animacoes nos slides** | Transicoes entre slides existem (PresentationMode), mas dentro do slide nao ha motion. | Adicionar `framer-motion` ou CSS animations nos componentes |
| **Font Gotham nao carregada** | O CSS referencia `'Gotham'` mas so Montserrat e carregada via Google Fonts. Gotham e proprietaria. | Usar Montserrat como fallback real ou licenciar Gotham |

## Proximo Passo Recomendado

Antes de implementar qualquer redesign visual:

1. **Componentizar** -- extrair os 8 componentes atomicos listados acima
2. **Criar sistema de theme** -- interface `SlideTheme` + 3 temas atuais migrados
3. **Adicionar ScaledSlide** -- proporcao fixa 16:9 com escala automatica
4. Depois disso, voce traz a referencia visual externa e eu replico como um novo tema

Quer que eu comece pela componentizacao + sistema de temas?

