

# Auth, Roles, Tabelas e Seed Demo — Ajuste Final

## Status Atual

Tudo ja esta implementado:

- **Auth**: Supabase Auth com email/senha, `handle_new_user` trigger criando profiles
- **Roles**: Tabela `user_roles` com enum `app_role` (super_admin, agency_admin, broker), funcao `has_role()` SECURITY DEFINER
- **22 tabelas**: Todas criadas com RLS ativo e policies por perfil
- **Portal sources**: 8 portais ja populados
- **Super admin**: dacmedia16@gmail.com com role super_admin
- **Multi-tenant**: `get_user_tenant_id()` SECURITY DEFINER, policies segregando por tenant

## Unica Pendencia: Seed Demo

Falta criar dados demo com 1 imobiliaria, 1 admin e 2 corretores. Isso requer:

### Migracao SQL (seed)

1. Criar 3 usuarios via `supabase.auth.admin.createUser` (nao e possivel via SQL puro) — alternativa: criar via edge function ou inserir direto nas tabelas `profiles` e `user_roles` sem vincular a auth.users (dados fictícios para visualizacao)

**Abordagem pratica**: Criar uma edge function `seed-demo` que:
- Cria 1 tenant "Imobiliaria Premium Demo"
- Cria 3 usuarios de teste via admin API (admin@demo.com, corretor1@demo.com, corretor2@demo.com, senha: 12345678)
- Atribui roles (agency_admin + 2 brokers)
- Cria agency_profile com branding demo
- Cria 2 broker_profiles com dados ficticios

### Arquivos

| Arquivo | Acao |
|---------|------|
| `supabase/functions/seed-demo/index.ts` | Criar — edge function one-shot para popular dados demo |

### Alternativa mais simples

Inserir diretamente via SQL migration apenas o tenant + agency_profile, e pedir ao usuario que crie as contas manualmente via signup. Isso evita complexidade de criar usuarios via admin API.

**Recomendacao**: Usar a edge function para seed completo, ja que o usuario quer tudo funcional automaticamente.

