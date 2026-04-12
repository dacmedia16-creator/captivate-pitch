

# Implementar Página "Meu Perfil" do Corretor

## Problema
A página `/profile` é apenas um placeholder — não tem formulário nem funcionalidade.

## Solução
Construir uma página completa que permite ao corretor editar seus dados pessoais e profissionais, usando as tabelas `profiles` e `broker_profiles` que já existem.

## Dados disponíveis

**profiles**: `full_name`, `email`, `phone`, `avatar_url`
**broker_profiles**: `creci`, `short_bio`, `years_in_market`, `education`, `specialties`, `service_regions`, `vgv_summary`, `preferred_tone`, `preferred_layout`

## Arquivo a editar

### `src/pages/agent/AgentProfile.tsx` — Rewrite completo

- Buscar dados do usuário logado via `useAuth()` + queries em `profiles` e `broker_profiles`
- Formulário organizado em seções com cards:
  - **Dados Pessoais**: avatar (usando `ImageUploader`), nome, email (readonly), telefone
  - **Dados Profissionais**: CRECI, bio curta, anos de mercado, formação, especialidades, regiões de atuação
  - **Preferências de Apresentação**: resumo VGV, tom preferido, layout preferido
- Mutation para salvar: update `profiles` + upsert `broker_profiles`
- Toast de sucesso/erro
- Visual coerente com branding RE/MAX (usa componentes shadcn existentes)

## Sem alterações em
- Banco de dados (tabelas já existem)
- Lógica de negócio, rotas, outros componentes

