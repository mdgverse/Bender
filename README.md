# Bender Studio

Protótipo web de modelagem 3D com foco em desktop, publicado em [Bender Studio](https://mdgverse.github.io/Bender/bender-studio.html).

## Modelagem e cena

- Seleção, retângulos no plano, extrusão por altura e movimentação no plano; primitivas de cubo, esfera, cilindro, cone, pirâmide, toro, tetraedro, icosaedro, octaedro, dodecaedro e cápsula.
- Gizmos de movimentação, rotação e escala; empurrar/puxar faces de caixas mantendo a face oposta fixa. Nome, posição, dimensões locais, rotação nos três eixos, cor, duplicação, exclusão e encaixe opcional.
- Apoiar no chão, centralizar no plano, zerar rotação, isolar, mover à origem, normalizar dimensões, girar 90° nos eixos e escalar pela metade ou pelo dobro. A lista permite buscar objetos, ocultar, mostrar, bloquear/desbloquear objetos e restaurar a visibilidade de todos. Objetos bloqueados não podem ser selecionados ou editados até serem desbloqueados. Alterações da cena participam do histórico de desfazer/refazer.
- Repetições lineares por eixo e circulares no plano XY, com número de cópias, distância ou raio configuráveis; a operação inteira pode ser desfeita de uma vez. As cópias são independentes.
- Sombras opcionais da luz pontual sobre o chão e outros objetos, configuradas em Ambiente; ficam desativadas por padrão para melhor desempenho.
- Luz pontual visível na cena: selecione a lâmpada no viewport ou clique em **Luz principal** na lista e arraste o gizmo. Em **Ambiente**, ajuste posição, cor, potência, luz ambiente, visibilidade da lâmpada e fundo. As configurações são salvas no projeto e podem ser desfeitas. A luz é apenas do viewport; não é exportada como luz no GLB. Projetos antigos mantêm sua intensidade de luz ambiente; se o efeito estiver pouco visível, reduza-a ou use Padrão no diálogo Ambiente.
- Medição temporária de distância no plano XY: selecione a régua ou pressione M, clique em dois pontos e use o encaixe se quiser. A medição não é salva nem exportada.
- Estatísticas de objetos e triângulos visíveis; grade e modo aramado opcionais.
- Na aba Materiais, selecione um objeto e ajuste seus materiais básicos: cor, rugosidade, metalização e opacidade, com presets fosco, metal e translúcido. O preset translúcido usa transparência simples, não refração física.
- Vista de frente, lado, topo, trás, esquerda e baixo; enquadrar selecionado ou todos os objetos visíveis.

Empurrar/puxar redimensiona a caixa inteira pela face escolhida: não cria novas faces ou topologia. A ferramenta Extrudar anterior altera a altura do objeto inteiro. Os gizmos usam a convenção do Three.js: **Y é vertical e Z é profundidade**, enquanto o painel usa Z como vertical. As vistas podem ser usadas em projeção perspectiva ou ortográfica. Não há edição de vértices/faces, materiais avançados ou renderização final ainda. As dimensões são medidas no espaço local do objeto, antes da rotação.

## Chanfro e cortes em faces

- Selecione uma **caixa** e escolha **Chanfro da caixa…**. Clique em uma aresta laranja no modelo ou escolha uma na lista do painel; ajuste a largura e os segmentos com prévia em tempo real. Um segmento cria um chanfro plano; mais segmentos arredondam a aresta. Aplique ou cancele no mesmo painel.
- Para fazer um entalhe ou abertura, use **Desenhar corte na face** no painel (ou o botão de corte na barra de ferramentas), clique e arraste um retângulo sobre uma face plana. Solte e escolha **Entalhe com profundidade** ou **Corte atravessando** no painel lateral, visualizando o resultado antes de aplicar. Girar a vista antes de desenhar pode facilitar a seleção da face. O retângulo pode ultrapassar uma borda para criar um recorte aberto.
- Cortes funcionam em caixas e malhas fechadas com faces planas alinhadas aos eixos locais. O chanfro e o corte convertem o objeto em malha triangulada; as propriedades, materiais, desfazer/refazer, salvamento e exportação continuam disponíveis. A ferramenta antiga de empurrar/puxar continua exclusiva de caixas não convertidas. Esta ainda não é uma edição livre de faces como a do SketchUp: não há desenho arbitrário, chanfro em várias arestas de uma só vez ou em qualquer geometria. As operações booleanas são experimentais e podem falhar em malhas abertas, complexas ou degeneradas; faça backups.

## Posicionamento e materiais

- Selecione um objeto e use **Alinhar a outro…** no painel de modelagem. Escolha uma referência, eixo e alinhamento de centros ou bordas; também é possível colocar o objeto antes ou depois da referência com um espaço definido na unidade do projeto. O cálculo usa a caixa envolvente no espaço global, inclusive para objetos girados, e não faz contato entre superfícies irregulares.
- Marque **Manter proporções** antes de editar uma dimensão para redimensionar os três eixos juntos, preservando a base vertical do objeto. A opção vale durante a sessão e pode ser desmarcada.
- Na aba Materiais, use **Copiar material** e **Colar material** para reutilizar cor, rugosidade, metalização e opacidade em outro objeto. A cópia de material dura apenas durante a sessão do projeto.
- Essas alterações podem ser desfeitas e refeitas; os resultados são salvos no projeto.

## Projetos e unidades

Na tela inicial, crie um projeto ou abra um dos projetos recentes pela miniatura. O botão **Projetos** retorna à biblioteca; a lixeira exclui um projeto local após confirmação. As alterações e miniaturas são salvas no armazenamento deste navegador, não na nuvem: podem ser perdidas ao limpar dados, trocar de navegador ou exceder o espaço disponível. Mantenha backups JSON. Uma cena salva pela versão anterior é migrada automaticamente e a cópia antiga é preservada.

Escolha **m, cm, mm ou px** ao criar o projeto; é possível mudar no editor sem alterar a geometria. As dimensões, posições, medições, encaixe, repetições e posição da luz usam a unidade escolhida. A unidade px é uma convenção de modelagem (100 px = 1 m), não um pixel físico de tela. Os dados internos e as exportações GLB usam metros; OBJ e STL exportam os valores internos sem metadados de unidade.

## Arquivos

O nome do projeto pode ser editado na barra superior e será usado nos arquivos exportados. A área de transferência de objetos é interna e dura até a página ser recarregada.

A cena é salva automaticamente no armazenamento local do navegador; limpar esses dados pode apagá-la. Use Arquivo → Baixar projeto para fazer backup em JSON, e Arquivo → Abrir projeto para restaurá-lo. O histórico não é preservado ao recarregar. Projetos da versão anterior continuam compatíveis.

O menu Arquivo permite importar malhas triangulares STL ou OBJ (até 2 MB por arquivo, 10.000 vértices triangulares por malha e 60.000 coordenadas importadas por cena). A geometria fica no projeto e pode ser transformada, duplicada e exportada; materiais, texturas, normais originais e arquivos MTL não são importados. As coordenadas usam Y vertical, como nos arquivos exportados pelo Bender. Não há edição individual de faces nessas malhas importadas.

É possível exportar os objetos **visíveis** em GLB, OBJ ou STL, ou salvar uma captura PNG do viewport. GLB inclui cor, rugosidade, metalização e opacidade; OBJ e STL exportam geometria, sem cores ou materiais. As preferências de visualização, como projeção, grade e aramado, não são salvas no projeto.

## Controles desktop

Botão central ou direito orbita; Shift com um desses botões faz panorâmica; a roda controla o zoom. As ferramentas à esquerda também funcionam por clique e arraste.

| Atalho | Ação |
|---|---|
| 1 / 2 / 3 / P | Gizmos de mover / girar / escalar / empurrar-puxar face de caixa |
| M | Medir dois pontos no plano XY |
| V / G / R / E / O | Selecionar / mover / retângulo / extrudar / orbitar |
| Shift+A / Shift+D | Adicionar / duplicar |
| F / Home | Enquadrar selecionado / todos os visíveis |
| H / Shift+H | Ocultar selecionado / mostrar todos |
| 5 ou Num 5 | Alternar perspectiva / ortográfica |
| Num 1 / 3 / 7 | Vistas frontal / lateral / superior |
| Ctrl+Num 1 / 3 / 7 | Vistas traseira / esquerda / inferior |
| Delete / Backspace | Excluir selecionado |
| Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z | Desfazer / refazer |
| Ctrl/Cmd+C / Ctrl/Cmd+V / Ctrl/Cmd+X | Copiar / colar / recortar objeto na sessão |
| Ctrl/Cmd+S | Baixar projeto JSON |
| Esc | Cancelar gesto ou voltar à seleção |

No celular, selecione **Orbitar** e arraste com um dedo; use dois dedos para zoom e panorâmica. O botão de painel na barra superior mostra os objetos e propriedades.

## Desenvolvimento

```sh
npm install
npm run dev
npm test
npm run build
npx playwright install chromium
npx playwright test
```

O build também gera `bender-studio.html`, o arquivo independente publicado no GitHub Pages. Os testes incluem integração de interface com renderizador simulado e testes de edição de faces, câmeras, geometrias, exportadores GLB/OBJ/STL e validação de projetos; incluem também testes de interface em Chromium no GitHub Actions. `rea/` contém uma cópia local separada da ferramenta REA para uso futuro.
