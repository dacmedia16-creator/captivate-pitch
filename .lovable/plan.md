

# Melhorar Layout de Fotos no Slide Resultados

## Referencia
A imagem mostra cards de portfolio com: fotos grandes, overlay com tipo do imóvel e localização, badge "VENDIDO em X dias". Layout horizontal com 4 cards de tamanho igual e boa proporção.

## Problema Atual
As 3 layouts (Executivo, Premium, Impacto) usam `flex-1` com `height: 200px` — fotos pequenas, sem sombra, captions básicos com gradient escuro.

## Solução
Melhorar o grid de fotos nos 3 layouts com:

1. **Aumentar altura** de 200px para 280px — mais impacto visual
2. **Adicionar rounded corners + shadow** — cards mais refinados
3. **Melhorar overlay** — gradient mais suave, caption com fundo semi-transparente tipo card, tipografia melhor (título do imóvel em bold, caption menor abaixo)
4. **Adicionar numeração/badge** — indicador visual de sequência (1, 2, 3, 4) no canto superior

### Arquivos alterados
- `src/components/layouts/LayoutExecutivo.tsx` — seção results, bloco portfolioImgs (linhas 474-488)
- `src/components/layouts/LayoutPremium.tsx` — seção results, bloco portfolioImgs (linhas 468-482)
- `src/components/layouts/LayoutImpactoComercial.tsx` — seção results, bloco portfolioImgs (linhas 159-173)

### Novo layout dos cards (aplicado nos 3 arquivos)
```tsx
{portfolioImgs.length > 0 && (
  <div className="flex gap-4">
    {portfolioImgs.slice(0, 4).map((img, i) => (
      <div key={i} className="relative flex-1 overflow-hidden rounded-xl" 
           style={{ minWidth: 0, height: "280px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
        <img src={img.image_url} alt={img.caption || ""} className="w-full h-full object-cover" />
        {/* Número no canto */}
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center"
             style={{ backgroundColor: accent, color: "#fff", fontSize: "16px", fontWeight: 700 }}>
          {i + 1}
        </div>
        {/* Caption overlay melhorado */}
        <div className="absolute inset-x-0 bottom-0" 
             style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}>
          <div className="p-4">
            {img.caption && (
              <p className="font-bold leading-tight" 
                 style={{ fontSize: "20px", color: "#fff" }}>{img.caption}</p>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
)}
```

### Impacto
- Apenas visual, sem mudanças de schema ou dados
- Fotos maiores e mais profissionais
- Consistente nos 3 temas

