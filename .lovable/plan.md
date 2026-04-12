

# Adicionar Botão Permanente "Atualizar Sistema" na TopBar

## O que muda

Adicionar um botão visível na barra superior (TopBar) que recarrega a página para buscar a versão mais recente. Sempre visível, sem depender de detecção automática.

## Arquivo a editar

### `src/components/TopBar.tsx`

- Adicionar um ícone `RefreshCw` ao lado dos outros botões (busca, notificações)
- Ao clicar: `sessionStorage.setItem("app_version_reloaded", "1")` + `window.location.reload()`
- Tooltip: "Atualizar sistema"
- Estilo consistente com os outros botões ghost da TopBar

## O banner automático

O `VersionUpdateBanner` continua funcionando normalmente como complemento — ele avisa quando há versão nova. O botão é para o usuário forçar a atualização quando quiser.

