# Bender Studio

Protótipo web de modelagem 3D. A cena inicial contém um cubo; é possível selecionar objetos, desenhar retângulos no plano e extrudá-los em caixas, editar posição e dimensões e excluir objetos. A cena é salva automaticamente no armazenamento local do navegador; limpar os dados do navegador pode apagá-la.

## Executar localmente

```sh
npm install
npm run dev
```

No computador, use o botão direito do mouse para orbitar e a roda para aproximar. No celular, selecione a ferramenta **Orbitar** e arraste com um dedo; use dois dedos para zoom e panorâmica. No celular, o botão de painel na barra superior mostra os objetos e propriedades.

Atalhos: V seleciona, R desenha retângulos, E extruda, O orbita, Delete exclui e Ctrl/Cmd+Z desfaz. O histórico de desfazer não é preservado ao recarregar.

A publicação estática em `bender-studio.html` é gerada a partir do build e publicada no GitHub Pages. Materiais, renderização e os menus superiores são apenas elementos visuais nesta versão. A extrusão altera a altura da caixa inteira, não faces individuais. `rea/` contém uma cópia separada da ferramenta REA para uso futuro.
