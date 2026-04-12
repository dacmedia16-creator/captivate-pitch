

# Banco de Dados, Auth e Papéis — Listing Studio AI

## Resumo

Implementar autenticação com Supabase, sistema de papéis (super_admin, agency_admin, broker), estrutura multi-tenant com RLS, e todas as 20+ tabelas descritas no prompt.

## Pré-requisito

**Ativar Lovable Cloud** — o projeto ainda não tem Supabase conectado. Será necessário habilitar o Lovable Cloud (ou conectar um projeto Supabase externo) para criar o banco de dados, autenticação e edge functions.

## Etapas

### 1. Habilitar backend (Lovable Cloud)
- Configurar Supabase via Lovable Cloud para ter banco de dados, auth e storage disponíveis.
- Instalar `@supabase/supabase-js` no projeto.

### 2. Criar tabelas via migrações

Uma migração SQL criará todas as tabelas na ordem correta de dependências:

```text
Ordem de criação:
1. app_role enum (super_admin, agency_admin, broker)
2. tenants
3. subscription_plans
4. profiles (refs auth.users)
5. user_roles (refs auth.users, usa app_role enum)
6. broker_profiles (refs profiles)
7. agency_profiles (refs tenants)
8. marketing_actions (refs tenants)
9. competitive_differentials (refs tenants)
10. sales_results (refs tenants)
11. testimonials (refs tenants)
12. portal_sources
13. tenant_portal_settings (refs tenants, portal_sources)
14. presentations (refs tenants, profiles)
15. presentation_images (refs presentations)
16. presentation_sections (refs presentations)
17. presentation_templates (refs tenants, profiles)
18. market_analysis_jobs (refs tenants, presentations)
19. market_comparables (refs market_analysis_jobs)
20. market_reports (refs market_analysis_jobs)
21. export_history (refs presentations, profiles)
22. audit_logs
```

**Nota sobre papéis**: Seguindo as melhores práticas de segurança, os papéis serão armazenados em uma tabela separada `user_roles` (não na tabela profiles). Uma função `has_role()` com SECURITY DEFINER será usada nas policies RLS para evitar recursão infinita. O campo `role` em `profiles` será mantido apenas como cache/display, não para controle de acesso.

### 3. Row Level Security (RLS)

Todas as tabelas terão RLS habilitado. Estratégia:

- **Função `has_role()`**: SECURITY DEFINER para checar papéis sem recursão
- **Função `get_user_tenant_id()`**: SECURITY DEFINER para obter o tenant_id do usuário autenticado
- **super_admin**: acesso total a todas as tabelas
- **agency_admin**: acesso filtrado por `tenant_id` do próprio tenant
- **broker**: acesso filtrado por `tenant_id` + `broker_id` (próprios dados) nas tabelas de apresentações; leitura dos dados institucionais do tenant

### 4. Seed com dados demo

Inserir dados iniciais:
- 1 tenant demo ("Imobiliária Premium")
- 1 super_admin, 1 agency_admin, 1 broker
- Portal sources (vivareal, zap, olx, etc.)
- Subscription plan padrão
- Dados de exemplo: marketing actions, diferenciais, resultados, depoimentos

### 5. Integração no frontend

- Criar `src/integrations/supabase/client.ts` com o cliente Supabase
- Criar `src/contexts/AuthContext.tsx` com login/logout, estado de sessão, e papel do usuário
- Criar páginas `/login` e `/signup`
- Atualizar `RoleGuard` para usar papel real do banco (via `user_roles`)
- Atualizar `AppSidebar` e `TopBar` para usar dados do perfil autenticado
- Proteger todas as rotas (redirecionar para login se não autenticado)
- Remover o seletor de papel de demo da sidebar (substituído por auth real)

### 6. Tipos TypeScript

- Gerar tipos para todas as tabelas do Supabase
- Criar `src/integrations/supabase/types.ts` com as interfaces

## Detalhes técnicos

**Função has_role (evita recursão RLS):**
```sql
CREATE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

**Função get_user_tenant_id:**
```sql
CREATE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT tenant_id FROM public.profiles
  WHERE id = _user_id LIMIT 1
$$;
```

**Exemplo de policy RLS para tabela multi-tenant:**
```sql
-- Super admin vê tudo
CREATE POLICY "super_admin_all" ON presentations
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Agency admin vê do próprio tenant
CREATE POLICY "agency_admin_tenant" ON presentations
  FOR ALL USING (
    public.has_role(auth.uid(), 'agency_admin')
    AND tenant_id = public.get_user_tenant_id(auth.uid())
  );

-- Broker vê apenas os próprios
CREATE POLICY "broker_own" ON presentations
  FOR ALL USING (
    public.has_role(auth.uid(), 'broker')
    AND broker_id = auth.uid()
  );
```

**Trigger para criar profile automaticamente no signup:**
```sql
CREATE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, status)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'active');
  RETURN NEW;
END;
$$;
```

## Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| Migração SQL (20+ tabelas + RLS + funções + seed) | Criar via migration tool |
| `src/integrations/supabase/client.ts` | Criar |
| `src/integrations/supabase/types.ts` | Criar |
| `src/contexts/AuthContext.tsx` | Criar |
| `src/pages/auth/Login.tsx` | Criar |
| `src/pages/auth/Signup.tsx` | Criar |
| `src/components/RoleGuard.tsx` | Atualizar (usar auth real) |
| `src/components/AppSidebar.tsx` | Atualizar (remover demo switcher) |
| `src/components/TopBar.tsx` | Atualizar (dados reais do perfil) |
| `src/contexts/RoleContext.tsx` | Refatorar para usar AuthContext |
| `src/App.tsx` | Adicionar rotas de auth, proteger rotas |

