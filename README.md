# Bender Studio

Protótipo web de modelagem 3D, publicado em [Bender Studio](https://mdgverse.github.io/Bender/bender-studio.html).

## Recursos

- Seleção, desenho de retângulos no plano, extrusão de caixas e movimentação no plano.
- Duplicação, exclusão, cor, rotação vertical, posição e dimensões de objetos.
- Encaixe opcional em incrementos de 0,5 unidade (ícone de ímã), desfazer e refazer.
- Salvamento automático no navegador, download e abertura de projeto JSON, e exportação de geometria e cor em GLB pelo menu Arquivo.

A cena fica no armazenamento local do navegador; limpar os dados do navegador pode apagá-la. Baixe o projeto para ter uma cópia. O histórico de desfazer não é preservado ao recarregar. A extrusão altera a altura da caixa inteira, não faces individuais; materiais avançados e renderização ainda não estão disponíveis.

## Uso

No computador, use o botão direito do mouse para orbitar e a roda para aproximar. No celular, selecione a ferramenta **Orbitar** e arraste com um dedo; use dois dedos para zoom e panorâmica. O botão de painel na barra superior mostra os objetos e suas propriedades.

Atalhos: V seleciona, G move, R desenha retângulos, E extruda, O orbita, Delete exclui, Ctrl/Cmd+Z desfaz e Ctrl/Cmd+Shift+Z refaz.

## Desenvolvimento

```sh
npm install
npm run dev
npm test
npm run build
```

O build também gera `bender-studio.html`, o arquivo independente publicado no GitHub Pages. `rea/` contém uma cópia local separada da ferramenta REA para uso futuro.
