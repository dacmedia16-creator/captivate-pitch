

# Fix: Imagens cortadas nos slides institucionais

## Problema
As fotos nos slides `about_global`, `about_national` e `about_regional` usam `object-cover` com `max-h-56`, o que corta a imagem. O usuário quer ver a foto inteira, adaptando o tamanho.

## Solução
Trocar `object-cover` por `object-contain` e remover `max-h-56` fixo, usando altura flexível para que a imagem se adapte ao espaço disponível.

## Arquivos a alterar

| Arquivo | Linha | Mudança |
|---|---|---|
| `LayoutExecutivo.tsx` | 341 | `className="max-h-56 object-cover w-full rounded-lg"` → `className="w-full object-contain rounded-lg"` |
| `LayoutPremium.tsx` | 338 | Idem |
| `LayoutImpactoComercial.tsx` | 329 | Idem |

## Risco
Nenhum — apenas ajuste visual CSS.

