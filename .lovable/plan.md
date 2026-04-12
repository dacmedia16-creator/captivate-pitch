

# Dashboards, Cadastros e Configurações — Listing Studio AI

## Resumo

Implementar todos os dashboards funcionais (Super Admin e Admin da Imobiliária), CRUD de imobiliárias, CRUD de corretores, configuração institucional com 8 abas, plano de marketing, e configuração de portais. Criar componentes reutilizáveis (MetricCard, DataTable, ImageUploader, etc.).

## Pré-requisito: Storage Bucket

Criar um bucket `uploads` (público) para logos, fotos de agência, avatares e imagens de resultados/depoimentos.

## Componentes Reutilizáveis a Criar

| Componente | Caminho | Uso |
|---|---|---|
| MetricCard | `src/components/shared/MetricCard.tsx` | Cards de métricas nos dashboards |
| DataTable | `src/components/shared/DataTable.tsx` | Tabelas com busca e paginação |
| FormModal | `src/components/shared/FormModal.tsx` | Dialog genérico para CRUD |
| ImageUploader | `src/components/shared/ImageUploader.tsx` | Upload de imagens para Supabase Storage |
| StatusBadge | `src/components/shared/StatusBadge.tsx` | Badge de status (ativo/bloqueado/pendente) |
| ConfirmDialog | `src/components/shared/ConfirmDialog.tsx` | Confirmação de ações destrutivas |
| SortableList | `src/components/shared/SortableList.tsx` | Lista reordenável para itens com sort_order |

## Páginas a Implementar

### 1. Super Admin Dashboard (`AdminDashboard.tsx`)
- 6 MetricCards: imobiliárias, usuários, corretores, apresentações, estudos de mercado, PDFs exportados
- Queries agregadas via Supabase (count de cada tabela)
- Tabela de imobiliárias com logo, nome, status, total corretores, total apresentações, data criação, ações

### 2. Gestão de Imobiliárias (`AdminTenants.tsx`)
- DataTable com todas as imobiliárias
- FormModal para criar/editar tenant (nome, slug, status, plano via subscription_plans)
- Ações: editar, bloquear/ativar, visualizar detalhes
- Ao criar tenant, criar também um registro em `agency_profiles`

### 3. Gestão de Usuários (`AdminUsers.tsx`)
- Tabela de todos os usuários com perfil, tenant, papel, status
- Filtros por tenant e papel

### 4. Company Dashboard (`CompanyDashboard.tsx`)
- MetricCards: corretores ativos, apresentações, estudos, PDFs
- Tabela de últimas apresentações do tenant
- Tabela de corretores recentes
- Top corretores por número de apresentações

### 5. Gestão de Corretores (`CompanyTeam.tsx`)
- DataTable com foto, nome, email, telefone, status, total apresentações, data cadastro
- FormModal para criar/editar corretor (todos os campos de profiles + broker_profiles)
- Criar corretor: insere em profiles + user_roles (broker) + broker_profiles
- Ações: editar, ativar/desativar

### 6. Configuração Institucional (`CompanyBranding.tsx`)
- Página com 8 abas usando Tabs do shadcn:
  - **Dados da empresa**: nome, logo (ImageUploader), foto da agência
  - **Branding**: cor principal, cor secundária, preview visual
  - **Apresentação mundial**: textarea/rich-text para about_global
  - **Apresentação nacional**: textarea para about_national
  - **Apresentação regional**: textarea para about_regional + regional_numbers
  - **Diferenciais**: CRUD inline (competitive_differentials) — título, descrição, ordem, ativo
  - **Resultados**: CRUD inline (sales_results) — título, descrição, métrica, imagem, ordem
  - **Depoimentos**: CRUD inline (testimonials) — nome, cargo, texto, imagem, ordem

### 7. Plano de Marketing (`CompanySettings.tsx` ou nova rota)
- CRUD de marketing_actions do tenant
- Cada ação: título, descrição, ícone (select com opções Lucide), imagem, ordem, ativo/inativo
- Lista reordenável

### 8. Configuração de Portais (dentro de CompanySettings ou nova aba)
- Lista de portal_sources com toggle habilitado/desabilitado
- Campos: prioridade, peso
- Usa tenant_portal_settings para persistir

## Sidebar — Novas rotas

Adicionar ao adminNav:
- Marketing → `/company/marketing`
- Portais → `/company/portals`

## Navegação atualizada

Novas rotas no App.tsx:
- `/company/marketing` → CompanyMarketing
- `/company/portals` → CompanyPortals

## Migração SQL

- Criar bucket `uploads` no storage com policies públicas de leitura e autenticadas de escrita
- Não há alteração de schema (todas as tabelas já existem)

## Detalhes técnicos

- Todas as queries usam `@tanstack/react-query` com `useQuery` / `useMutation`
- Formulários com `react-hook-form` + `zod` para validação
- Contagens no dashboard via `.select('id', { count: 'exact', head: true })`
- Upload de imagens via `supabase.storage.from('uploads').upload()`
- Todas as operações respeitam RLS existente (tenant_id é setado automaticamente via AuthContext)

## Arquivos a criar

| Arquivo | Descrição |
|---|---|
| `src/components/shared/MetricCard.tsx` | Card de métrica reutilizável |
| `src/components/shared/DataTable.tsx` | Tabela com busca e paginação |
| `src/components/shared/FormModal.tsx` | Modal de formulário |
| `src/components/shared/ImageUploader.tsx` | Upload de imagem |
| `src/components/shared/StatusBadge.tsx` | Badge de status |
| `src/components/shared/ConfirmDialog.tsx` | Dialog de confirmação |
| `src/pages/admin/AdminDashboard.tsx` | Dashboard super admin (reescrever) |
| `src/pages/admin/AdminTenants.tsx` | CRUD imobiliárias (reescrever) |
| `src/pages/admin/AdminUsers.tsx` | Listagem de usuários (reescrever) |
| `src/pages/company/CompanyDashboard.tsx` | Dashboard imobiliária (reescrever) |
| `src/pages/company/CompanyTeam.tsx` | CRUD corretores (reescrever) |
| `src/pages/company/CompanyBranding.tsx` | 8 abas institucional (reescrever) |
| `src/pages/company/CompanyMarketing.tsx` | CRUD marketing actions (novo) |
| `src/pages/company/CompanyPortals.tsx` | Config portais (novo) |
| `src/App.tsx` | Adicionar novas rotas |
| `src/components/AppSidebar.tsx` | Adicionar Marketing e Portais ao menu |

