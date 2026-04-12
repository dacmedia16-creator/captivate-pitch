

# Auditoria Corretiva — Listing Studio AI

---

## A. Notas (0 a 10)

| Dimensão | Nota | Justificativa |
|---|---|---|
| **Arquitetura** | 6/10 | Boa separação de rotas por role, contexts bem definidos, mas sem service layer, lógica de negócio misturada em componentes |
| **Segurança** | 4/10 | RLS presente mas Edge Functions com falhas graves (sem auth obrigatória, service_role sem scoping), seed-demo aberto |
| **Escalabilidade** | 5/10 | Multi-tenant via RLS funcional, mas comparáveis simulados no cliente, sem paginação, sem rate limiting |
| **Prontidão** | 3/10 | README vazio, Index.tsx placeholder, signup sem atribuição de tenant/role, seed-demo exposto em produção |

---

## Pontos Positivos

- RLS bem estruturado em todas as 22 tabelas com `has_role()` e `get_user_tenant_id()` como security definer functions
- Separação clara de papéis (super_admin/agency_admin/broker) com mapeamento consistente entre DB e frontend
- Audit log implementado
- Branding multi-tenant funcional com layouts diferentes
- Fluxo de auth completo: login, signup, forgot/reset password com verificação de email

---

## B. Os 10 Principais Problemas (em ordem de prioridade)

### 1. Edge Function `seed-demo` sem autenticação — qualquer pessoa pode criar dados
**Por que é problema:** A função usa `SUPABASE_SERVICE_ROLE_KEY` sem verificar quem está chamando. Qualquer request anônimo cria tenant, usuários e dados completos.
**Impacto no negócio:** Um atacante pode criar milhares de tenants/usuários, poluir a base e consumir recursos.
**Impacto técnico:** Dados órfãos, possível DoS, credenciais demo expostas.
**Correção:** Adicionar verificação de JWT + role `super_admin` obrigatória. Idealmente, remover da produção ou proteger com um segredo de invocação.

### 2. Edge Function `export-pdf` — acessa qualquer apresentação sem validar ownership
**Por que é problema:** Linhas 20-26 de `export-pdf/index.ts` — o `userId` é extraído do token, mas nunca é comparado com `pres.broker_id` ou `pres.tenant_id`. Qualquer usuário autenticado (ou até anônimo, já que auth é opcional) pode exportar qualquer apresentação passando o `presentation_id`.
**Impacto no negócio:** Vazamento de dados de imóveis, preços e estratégias de outras imobiliárias.
**Impacto técnico:** Bypass completo do isolamento multi-tenant.
**Correção:** Verificar JWT obrigatoriamente, confirmar que `userId` pertence ao mesmo tenant da apresentação (ou é super_admin). Usar Supabase client com o token do usuário em vez do service_role para queries.

### 3. Edge Function `generate-presentation-text` — mesma falha de ownership
**Por que é problema:** Usa `SUPABASE_SERVICE_ROLE_KEY` para buscar qualquer apresentação sem verificar se o caller é o dono. Qualquer usuário autenticado pode gerar textos IA para apresentações de outros tenants.
**Impacto no negócio:** Consumo indevido de créditos de IA, acesso a dados confidenciais.
**Correção:** Validar JWT, verificar ownership via tenant_id/broker_id antes de processar.

### 4. Signup cria usuário sem tenant_id e sem role no `user_roles`
**Por que é problema:** Em `Signup.tsx` e `AuthContext.signUp`, o usuário é criado via `supabase.auth.signUp` que aciona o trigger `handle_new_user` para criar o profile, mas sem `tenant_id` e sem inserir em `user_roles`. O usuário fica com role `null` → mapeado como "agent" pelo `RoleContext.mapRole()`, mas sem tenant — não consegue acessar nenhum dado via RLS.
**Impacto no negócio:** Novos cadastros ficam em estado inútil, sem acesso a nada.
**Impacto técnico:** Usuário "fantasma" que consome auth mas não funciona.
**Correção:** Implementar fluxo de onboarding pós-signup: ou associar a um tenant via convite, ou criar fluxo de criação de imobiliária. No mínimo, inserir role `broker` no `user_roles` via trigger ou edge function.

### 5. Index.tsx é um placeholder não-funcional
**Por que é problema:** `src/pages/Index.tsx` exibe um SVG genérico "Your app will live here!". A rota `/` redireciona para `/dashboard`, mas se alguém acessar diretamente, vê conteúdo inacabado.
**Impacto no negócio:** Imagem não profissional se acessado diretamente.
**Correção:** Substituir por redirect para `/login` ou criar landing page. Remover o placeholder.

### 6. `PresentationEditor` não valida ownership no frontend
**Por que é problema:** Em `PresentationEditor.tsx` linha 27, a query busca apresentação apenas por `id` sem filtrar por `broker_id`. O RLS protege no backend, mas se RLS falhar ou for mal configurado, qualquer broker acessaria apresentações de outros.
**Impacto no negócio:** Risco mitigado pelo RLS, mas defesa em profundidade ausente.
**Correção:** Adicionar filtro `broker_id` ou `tenant_id` nas queries do frontend como segunda camada. Exibir erro específico se a apresentação não pertence ao usuário.

### 7. Share token previsível e sem expiração
**Por que é problema:** O `share_token` é gerado via `crypto.randomUUID()` (bom) mas a política RLS `anon_read_shared_presentations` permite leitura de qualquer apresentação com `share_token IS NOT NULL`. Não há expiração, revogação, ou controle de acesso ao link.
**Impacto no negócio:** Links compartilhados são eternos e impossíveis de revogar sem apagar o token manualmente.
**Correção:** Adicionar campo `share_expires_at` e condição na RLS policy. Adicionar botão de revogar compartilhamento no editor.

### 8. `AgentNewPresentation` — lógica de negócio extensa (260 linhas) misturada com UI
**Por que é problema:** O componente `AgentNewPresentation.tsx` contém toda a lógica de criação: insert de presentation, photos, market_analysis_job, comparáveis simulados, market_report, e atualização de sections. Isso torna difícil testar, reutilizar e manter.
**Impacto técnico:** Alto acoplamento, difícil de depurar e testar.
**Correção:** Extrair `handleGenerate` para um hook `useCreatePresentation` ou service function. Separar operações de DB em camada de serviço.

### 9. Sem Foreign Keys no banco de dados
**Por que é problema:** Nenhuma tabela tem foreign keys definidas (conforme schema). Isso significa que referências como `presentations.broker_id → profiles.id` não são enforced pelo banco. Dados órfãos podem ser criados (ex: deletar um tenant sem cascadear).
**Impacto técnico:** Integridade referencial não garantida, possíveis erros silenciosos.
**Correção:** Adicionar FKs com `ON DELETE CASCADE` ou `SET NULL` conforme a semântica de cada relação (tenant_id, broker_id, presentation_id, etc.).

### 10. README vazio e sem documentação de setup
**Por que é problema:** O `README.md` diz apenas "TODO: Document your project here". Outro desenvolvedor não sabe como rodar, quais variáveis precisa, nem como o sistema funciona.
**Impacto no negócio:** Onboarding de novos devs lento, dependência de conhecimento tácito.
**Correção:** Documentar: arquitetura (3 roles, multi-tenant), variáveis de ambiente, como rodar localmente, como rodar seed-demo, estrutura de pastas.

---

## C. Detalhes por Problema

*(Já incluídos acima em cada item)*

---

## D. Plano de Ação em 3 Fases

### Fase 1: URGENTE (segurança — fazer imediatamente)

| # | Ação | Arquivos |
|---|------|----------|
| 1 | Proteger `seed-demo` com auth super_admin obrigatória | `supabase/functions/seed-demo/index.ts` |
| 2 | Proteger `export-pdf` — JWT obrigatório + validar ownership (broker_id ou tenant_id) | `supabase/functions/export-pdf/index.ts` |
| 3 | Proteger `generate-presentation-text` — JWT obrigatório + validar ownership | `supabase/functions/generate-presentation-text/index.ts` |
| 4 | Adicionar expiração e revogação ao share token | Migration SQL + `PresentationEditor.tsx` |
| 5 | Corrigir signup: inserir role `broker` em `user_roles` via trigger `handle_new_user` | Migration SQL (alter trigger) |

### Fase 2: ESTABILIZAÇÃO (qualidade e consistência — próximas 2 semanas)

| # | Ação | Arquivos |
|---|------|----------|
| 6 | Adicionar Foreign Keys em todas as tabelas | Migration SQL |
| 7 | Extrair lógica de `AgentNewPresentation` para hook/service | `src/hooks/useCreatePresentation.ts` (novo) |
| 8 | Adicionar filtros de ownership nas queries do frontend (defesa em profundidade) | `PresentationEditor.tsx`, `MarketStudyDetail.tsx` |
| 9 | Substituir `Index.tsx` placeholder por redirect ou landing | `src/pages/Index.tsx` |
| 10 | Adicionar input validation (Zod) nas Edge Functions | Todas as 3 functions |

### Fase 3: EVOLUÇÃO (prontidão para produção)

| # | Ação | Arquivos |
|---|------|----------|
| 11 | Documentar README com setup, arquitetura e variáveis | `README.md` |
| 12 | Implementar onboarding pós-signup (convite ou criação de tenant) | Novo fluxo de páginas |
| 13 | Adicionar paginação nas listagens (apresentações, comparáveis, users) | Pages de listagem |
| 14 | Criar service layer para operações Supabase (separar DB do UI) | `src/services/` (novo diretório) |
| 15 | Implementar rate limiting nas Edge Functions | Edge functions |

