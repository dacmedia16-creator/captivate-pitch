

# Fase 3 — Skeletons de Performance

## Estratégia

Criar 3 componentes skeleton dedicados em `src/components/skeletons/`, um para cada página. Cada skeleton replica a estrutura visual exata da página real usando o `Skeleton` existente. Os spinners `Loader2` nas 3 páginas serão substituídos pelo skeleton correspondente.

## Arquivos a criar

### 1. `src/components/skeletons/AgentDashboardSkeleton.tsx`
Replica:
- Header: skeleton de título (h1 largo) + texto de apoio + botão retangular à direita
- Grid 5 colunas: 5 cards de métrica com skeleton de ícone + número + label
- Grid 2 colunas: 2 cards glass com header (título skeleton) + 4-5 linhas de item (dot + texto + badge)

### 2. `src/components/skeletons/AgentPresentationsSkeleton.tsx`
Replica:
- Header: título + texto + botão à direita
- TabsList com 2 tabs skeleton
- 4 cards de apresentação: cada um com título + subtexto + badge + 2 botões icon

### 3. `src/components/skeletons/PresentationEditorSkeleton.tsx`
Replica o layout flex de 3 painéis:
- Toolbar: barra horizontal com skeletons de botões
- Sidebar esquerda (w-56): 6-8 retângulos de slide thumbnail
- Centro: retângulo grande (slide preview) dentro do container
- Painel direito (w-72): campos de edição skeleton (labels + inputs)

## Arquivos a editar

### 4. `src/pages/agent/AgentDashboard.tsx` (linha 60-62)
Substituir o bloco `if (isLoading)` de `Loader2` por `<AgentDashboardSkeleton />`

### 5. `src/pages/agent/AgentPresentations.tsx` (linha 78-80)
Substituir o bloco `if (isLoading)` de `Loader2` por `<AgentPresentationsSkeleton />`

### 6. `src/pages/agent/PresentationEditor.tsx` (linha 137-139)
Substituir o bloco `if (loadingPres || loadingSections)` de `Loader2` por `<PresentationEditorSkeleton />`

## Regras
- Zero alteração em lógica de negócio, queries, auth ou RLS
- Usa exclusivamente o `Skeleton` de `@/components/ui/skeleton`
- Responsivo: grids adaptam entre mobile e desktop igual à página real

