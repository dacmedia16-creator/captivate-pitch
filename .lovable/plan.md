

# Auditoria Completa de Performance — Listing Studio AI

---

## A. Resumo Executivo

O sistema tem **dois gargalos principais**: (1) o bundle inicial carrega todas as 20+ páginas de uma vez, sem code splitting; (2) o banco de dados não tem índices nas colunas mais consultadas, fazendo com que toda query passe por sequential scans amplificados por RLS policies que chamam sub-selects. A percepção de lentidão vem da combinação desses dois fatores com a ausência de skeletons nas telas críticas.

---

## B. Onde Está a Lentidão Principal

| Área | Severidade |
|---|---|
| **Bundle / carregamento inicial** | CRÍTICA — todas as páginas no bundle principal |
| **Banco de dados (índices ausentes)** | ALTA — nenhum índice em `tenant_id`, `broker_id`, `presentation_id` |
| **RLS** | ALTA — sub-selects sem índice em cada policy |
| **Frontend (re-renders)** | MÉDIA — AuthContext e RoleContext sem memoização |
| **Edge Functions** | MÉDIA — queries sequenciais na generate-presentation-text |
| **Percepção visual** | MÉDIA — loaders genéricos, sem skeletons |

---

## C. Top 10 Gargalos em Ordem de Prioridade

### 1. Zero Code Splitting — Bundle Monolítico
- **Por que acontece**: `App.tsx` importa estaticamente todas as 20+ páginas (AdminDashboard, CompanyBranding, PresentationEditor, etc.). O Vite empacota tudo num único chunk.
- **Impacto no usuário**: Primeira carga lenta, especialmente em mobile. O corretor carrega código de super_admin que nunca usará.
- **Impacto técnico**: Bundle JS estimado em 500KB+ gzipped com recharts, framer-motion, todos os radix primitives, cmdk.
- **Correção**: Usar `React.lazy()` + `Suspense` para cada rota. Mínimo: lazy load das 3 áreas (admin, company, agent) separadamente.
- **Prioridade**: CRÍTICA

### 2. Índices Ausentes no Banco de Dados
- **Por que acontece**: Só existem índices de primary key. Nenhum índice em `presentations.broker_id`, `presentations.tenant_id`, `presentation_sections.presentation_id`, `market_analysis_jobs.presentation_id`, `competitive_differentials.tenant_id`, `marketing_actions.tenant_id`, `profiles.tenant_id`, `broker_profiles.user_id`, `agency_profiles.tenant_id`, `market_comparables.market_analysis_job_id`.
- **Impacto no usuário**: Toda query faz full table scan. Piora progressivamente com volume de dados.
- **Impacto técnico**: RLS policies executam sub-selects (ex: `SELECT presentations.id FROM presentations WHERE broker_id = auth.uid()`) sem índice — multiplicando o custo.
- **Correção**: Criar migração com ~12 índices nos campos de filtro mais usados.
- **Prioridade**: CRÍTICA

### 3. RLS Policies com Sub-Selects Cascateados
- **Por que acontece**: Policies como `user_own_comparables` fazem JOIN de `market_analysis_jobs` com `presentations` sem índices. A function `get_user_tenant_id()` é chamada em quase toda policy, fazendo um SELECT na `profiles` por request.
- **Impacto no usuário**: Latência crescente em queries de market_comparables, presentation_sections, export_history.
- **Impacto técnico**: Cada row avaliada executa os sub-selects. Com 100 comparáveis = 100 execuções do JOIN.
- **Correção**: (a) Adicionar índices (item 2 resolve 80%). (b) Considerar materializar tenant_id em tabelas filhas para evitar JOINs no RLS.
- **Prioridade**: ALTA

### 4. `logAudit()` Faz 2 Queries Desnecessárias por Chamada
- **Por que acontece**: `useAuditLog.ts` chama `supabase.auth.getUser()` + `profiles.select("tenant_id")` toda vez que loga uma ação. No `PresentationEditor`, é chamado no save, duplicate, AI generate, PDF export.
- **Impacto no usuário**: Cada ação do editor fica ~200-400ms mais lenta.
- **Impacto técnico**: 2 round trips extras ao banco por audit log.
- **Correção**: Receber `userId` e `tenantId` como parâmetros (já disponíveis no AuthContext), eliminando as 2 queries.
- **Prioridade**: ALTA

### 5. `PresentationEditor` — Save Sequencial Seção por Seção
- **Por que acontece**: `saveMutation` faz um `for` loop com `await` para cada seção: `for (const s of localSections) { await supabase.update... }`. Com 12 seções = 12 round trips sequenciais.
- **Impacto no usuário**: Botão "Salvar" trava por 3-5 segundos.
- **Impacto técnico**: 12 queries + 12 RLS evaluations sequenciais.
- **Correção**: Usar `Promise.all()` para salvar em paralelo, ou criar uma edge function que receba o array completo e faça batch update.
- **Prioridade**: ALTA

### 6. `AgentNewPresentation` — Geração com ~15 Queries Sequenciais
- **Por que acontece**: `handleGenerate()` faz insert da presentation, depois photos, depois market job, depois comparables, depois report, depois sections (via `generatePresentationSections` que faz 9 selects em paralelo + 1 insert), depois 2 updates de sections. Total: ~15-20 queries.
- **Impacto no usuário**: Tela "Gerando..." demora 5-10 segundos.
- **Impacto técnico**: Muitas queries são inevitáveis, mas a `generatePresentationSections` poderia ser uma edge function.
- **Correção**: (a) Paralelizar o que for possível. (b) Mover toda a lógica para uma edge function com service_role (sem overhead de RLS).
- **Prioridade**: MÉDIA

### 7. `AgentDashboard` — 5 Count Queries Simultâneas
- **Por que acontece**: 5 queries `select("id", { count: "exact", head: true })` em paralelo, mas `market_analysis_jobs` e `presentation_templates` não filtram por `broker_id` — retornam contagens globais (ou filtradas por RLS com sub-selects caros).
- **Impacto no usuário**: Dashboard demora ~1-2s para carregar métricas.
- **Impacto técnico**: As queries de count com RLS complexa são pesadas.
- **Correção**: (a) Adicionar filtro de `broker_id` ou `tenant_id` nas queries de studies e templates. (b) Índices (item 2).
- **Prioridade**: MÉDIA

### 8. Bibliotecas Pesadas no Bundle
- **Por que acontece**: `recharts` (~200KB), `framer-motion` (~120KB), `cmdk` (~30KB), `react-day-picker` (~40KB), `embla-carousel` (~20KB) estão no bundle principal mesmo que só sejam usados em páginas específicas.
- **Impacto no usuário**: Tempo de parse/execute do JS no primeiro load.
- **Impacto técnico**: Bundle size inflado.
- **Correção**: Lazy load das páginas (item 1) resolve automaticamente — recharts só carrega quando abre MarketStudyDetail, framer-motion só quando abre StepGeneration.
- **Prioridade**: MÉDIA (resolvido pelo item 1)

### 9. `AuthContext` — fetchUserData Duplicada
- **Por que acontece**: `onAuthStateChange` e `getSession` ambos chamam `fetchUserData`, resultando em chamada dupla no mount. São 3 queries (profile + tenant + role) × 2 = 6 queries no login.
- **Impacto no usuário**: Flash de loading desnecessário.
- **Impacto técnico**: Race condition possível entre as duas chamadas.
- **Correção**: Usar um flag/ref para evitar chamada duplicada. O `onAuthStateChange` já cobre o caso do `getSession`.
- **Prioridade**: MÉDIA

### 10. Ausência de Skeletons e Feedback Visual
- **Por que acontece**: Todas as páginas mostram apenas `<Loader2 className="animate-spin" />` durante loading. Nenhuma usa skeleton ou shimmer.
- **Impacto no usuário**: Percepção de lentidão maior que a real. Tela fica em branco com spinner.
- **Impacto técnico**: Nenhum — é puramente UX.
- **Correção**: Adicionar skeletons nas páginas mais visitadas: AgentDashboard, AgentPresentations, PresentationEditor.
- **Prioridade**: BAIXA

---

## D. Plano de Ação em 3 Fases

### Fase 1 — Impacto Imediato (1-2 dias)

1. **Criar migração com índices** — ~12 índices nas colunas de filtro e FK:
   ```sql
   CREATE INDEX idx_presentations_broker_id ON presentations(broker_id);
   CREATE INDEX idx_presentations_tenant_id ON presentations(tenant_id);
   CREATE INDEX idx_presentation_sections_presentation_id ON presentation_sections(presentation_id);
   CREATE INDEX idx_presentation_images_presentation_id ON presentation_images(presentation_id);
   CREATE INDEX idx_market_analysis_jobs_presentation_id ON market_analysis_jobs(presentation_id);
   CREATE INDEX idx_market_comparables_job_id ON market_comparables(market_analysis_job_id);
   CREATE INDEX idx_market_reports_job_id ON market_reports(market_analysis_job_id);
   CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
   CREATE INDEX idx_broker_profiles_user_id ON broker_profiles(user_id);
   CREATE INDEX idx_agency_profiles_tenant_id ON agency_profiles(tenant_id);
   CREATE INDEX idx_competitive_differentials_tenant_id ON competitive_differentials(tenant_id);
   CREATE INDEX idx_marketing_actions_tenant_id ON marketing_actions(tenant_id);
   CREATE INDEX idx_export_history_presentation_id ON export_history(presentation_id);
   CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
   CREATE INDEX idx_presentations_share_token ON presentations(share_token);
   ```

2. **Lazy load de rotas** — Converter todos os imports de páginas em `App.tsx` para `React.lazy()` com `Suspense`.

3. **Fix `logAudit()`** — Receber userId e tenantId como parâmetros diretos.

4. **Fix save sequencial no Editor** — Trocar `for await` por `Promise.all()`.

### Fase 2 — Estabilização (3-5 dias)

5. **Fix AuthContext** — Evitar fetchUserData duplicada no mount.
6. **Fix AgentDashboard queries** — Adicionar filtros corretos em studies e templates.
7. **Paralelizar geração de apresentação** — Agrupar queries independentes.
8. **Edge function generate-presentation-text** — Paralelizar as queries de dados (branding, broker, jobs, comparables fazem 7 queries sequenciais).

### Fase 3 — Refinamentos (quando possível)

9. **Skeletons** — Adicionar shimmer loading em AgentDashboard, AgentPresentations, PresentationEditor.
10. **Prefetch** — Adicionar `prefetchQuery` no hover dos links de apresentações para carregamento percebido instantâneo.

---

## E. Telas para Medir Primeiro

1. `/dashboard` (AgentDashboard) — 5 queries paralelas + RLS
2. `/presentations/:id/edit` (PresentationEditor) — 3 queries + save pesado
3. `/presentations/new` → Step 4 (geração) — 15+ queries sequenciais
4. `/company/branding` — 4 queries no mount

