

# Base do App — Status e Ajuste Final

## Already Implemented (no changes needed)

Everything from this prompt is already built:

- **3 Profiles**: `super_admin`, `agency_admin`, `broker` with `user_roles` table and `RoleGuard`
- **Multi-tenant architecture**: 22 tables with RLS policies
- **Premium visual design**: Dark sidebar, gold accents, glass cards, Playfair Display + Inter typography
- **Layout**: `AppLayout` with `SidebarProvider`, `AppSidebar`, `TopBar`
- **Auth**: Login (`/login`) and Signup (`/signup`) pages
- **All routes and pages**: Super Admin (dashboard, tenants, users, settings), Agency Admin (dashboard, team, branding, templates, marketing, portals, settings), Broker (dashboard, presentations, new presentation, profile, market study, editor, presentation mode)
- **Responsive**: Desktop and tablet ready

## Missing: Password Recovery

Add a forgot password flow:

1. **Login page**: Add "Esqueceu a senha?" link below the form
2. **Forgot password page** (`/forgot-password`): Email input that calls `supabase.auth.resetPasswordForEmail()` with redirect to `/reset-password`
3. **Reset password page** (`/reset-password`): Form to set new password, checks for `type=recovery` in URL hash, calls `supabase.auth.updateUser({ password })`
4. **Routes**: Add both new routes in `App.tsx` as public routes

### Files to create/modify

| File | Action |
|------|--------|
| `src/pages/auth/ForgotPassword.tsx` | Create — email form |
| `src/pages/auth/ResetPassword.tsx` | Create — new password form |
| `src/pages/auth/Login.tsx` | Add "Esqueceu a senha?" link |
| `src/App.tsx` | Add `/forgot-password` and `/reset-password` routes |

