# Bender Studio

Protótipo web de modelagem 3D com foco em desktop, publicado em [Bender Studio](https://mdgverse.github.io/Bender/bender-studio.html).

## Modelagem e cena

- Seleção, retângulos no plano, extrusão por altura e movimentação no plano; primitivas de cubo, esfera, cilindro, cone, pirâmide, toro, tetraedro e icosaedro.
- Gizmos de movimentação, rotação e escala; empurrar/puxar faces de caixas mantendo a face oposta fixa. Nome, posição, dimensões locais, rotação nos três eixos, cor, duplicação, exclusão e encaixe opcional.
- Apoiar no chão, centralizar no plano, zerar rotação, e isolar objeto. A lista permite buscar objetos, ocultar ou mostrar e restaurar a visibilidade de todos. Alterações da cena participam do histórico de desfazer/refazer.
- Estatísticas de objetos e triângulos visíveis; grade e modo aramado opcionais.
- Na aba Materiais, selecione um objeto e ajuste seus materiais básicos: cor, rugosidade, metalização e opacidade, com presets fosco, metal e translúcido. O preset translúcido usa transparência simples, não refração física.
- Vista de frente, lado, topo, trás, esquerda e baixo; enquadrar selecionado ou todos os objetos visíveis.

Empurrar/puxar redimensiona a caixa inteira pela face escolhida: não cria novas faces ou topologia. A ferramenta Extrudar anterior altera a altura do objeto inteiro. Os gizmos usam a convenção do Three.js: **Y é vertical e Z é profundidade**, enquanto o painel usa Z como vertical. As vistas podem ser usadas em projeção perspectiva ou ortográfica. Não há edição de vértices/faces, materiais avançados ou renderização final ainda. As dimensões são medidas no espaço local do objeto, antes da rotação.

## Arquivos

A cena é salva automaticamente no armazenamento local do navegador; limpar esses dados pode apagá-la. Use Arquivo → Baixar projeto para fazer backup em JSON, e Arquivo → Abrir projeto para restaurá-lo. O histórico não é preservado ao recarregar. Projetos da versão anterior continuam compatíveis.

É possível exportar os objetos **visíveis** em GLB, OBJ ou STL, ou salvar uma captura PNG do viewport. GLB inclui cor, rugosidade, metalização e opacidade; OBJ e STL exportam geometria, sem cores ou materiais. As preferências de visualização, como projeção, grade e aramado, não são salvas no projeto.

## Controles desktop

Botão central ou direito orbita; Shift com um desses botões faz panorâmica; a roda controla o zoom. As ferramentas à esquerda também funcionam por clique e arraste.

| Atalho | Ação |
|---|---|
| 1 / 2 / 3 / P | Gizmos de mover / girar / escalar / empurrar-puxar face de caixa |
| V / G / R / E / O | Selecionar / mover / retângulo / extrudar / orbitar |
| Shift+A / Shift+D | Adicionar / duplicar |
| F / Home | Enquadrar selecionado / todos os visíveis |
| H / Shift+H | Ocultar selecionado / mostrar todos |
| 5 ou Num 5 | Alternar perspectiva / ortográfica |
| Num 1 / 3 / 7 | Vistas frontal / lateral / superior |
| Ctrl+Num 1 / 3 / 7 | Vistas traseira / esquerda / inferior |
| Delete / Backspace | Excluir selecionado |
| Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z | Desfazer / refazer |
| Ctrl/Cmd+S | Baixar projeto JSON |
| Esc | Cancelar gesto ou voltar à seleção |

No celular, selecione **Orbitar** e arraste com um dedo; use dois dedos para zoom e panorâmica. O botão de painel na barra superior mostra os objetos e propriedades.

## Desenvolvimento

```sh
npm install
npm run dev
npm test
npm run build
```

O build também gera `bender-studio.html`, o arquivo independente publicado no GitHub Pages. Os testes incluem integração de interface com renderizador simulado e testes de edição de faces, câmeras, geometrias, exportadores GLB/OBJ/STL e validação de projetos; não substituem testes de WebGL em um navegador real. `rea/` contém uma cópia local separada da ferramenta REA para uso futuro.
