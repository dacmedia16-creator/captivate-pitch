

# Detecção de Nova Versão — Build Hash Polling

## Abordagem escolhida

O projeto **não usa PWA nem service worker**, então a melhor estratégia é **polling do `index.html`** para detectar mudanças no hash dos assets do Vite.

**Como funciona:** A cada build, o Vite gera nomes de arquivo com hash único (ex: `main-abc123.js`). O sistema busca periodicamente o `index.html` do servidor e compara o `<script>` com o carregado. Se diferir, há nova versão.

**Quando verifica:**
- Ao retornar foco à aba (event `visibilitychange`)
- A cada 5 minutos em segundo plano
- **Não** no carregamento inicial (evita falso positivo)

**Anti-loop:** Uma flag `sessionStorage` impede recarregamento repetido.

## Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/hooks/useVersionCheck.ts` — hook com polling + detecção |
| Criar | `src/components/VersionUpdateBanner.tsx` — banner fixo bottom com botão "Atualizar sistema" |
| Editar | `src/App.tsx` — renderizar `<VersionUpdateBanner />` dentro do layout |

## Componente visual

Banner fixo no bottom da tela, com:
- Fundo azul RE/MAX (`#003DA5`) com leve blur
- Ícone de atualização + texto "Nova versão disponível"
- Descrição: "Uma atualização do sistema foi publicada. Clique para carregar a versão mais recente."
- Botão vermelho RE/MAX (`#DC1431`): "Atualizar sistema"
- Botão "X" para dispensar temporariamente
- Responsivo, elegante, coerente com o branding atual

## Hook `useVersionCheck`

```text
1. Ao montar, captura o src do <script type="module"> atual
2. Registra listener de visibilitychange
3. Registra setInterval de 5min
4. Em cada check: fetch("/index.html") com cache-bust
5. Extrai o src do script do HTML retornado
6. Se diferente → setState(updateAvailable = true)
7. Ao clicar "Atualizar": sessionStorage.set flag + window.location.reload()
8. No mount: se flag existe, limpa e não mostra banner
```

## Sem alterações em
- Lógica de negócio, banco de dados, Edge Functions
- Vite config (não precisa de plugin extra)

