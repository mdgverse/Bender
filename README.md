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

- Selecione uma **caixa ou malha fechada** e escolha **Chanfro por aresta…**. Clique em uma aresta laranja no modelo ou escolha uma na lista do painel; ajuste a largura e os segmentos com prévia em tempo real. Um segmento cria um chanfro plano; mais segmentos arredondam a aresta. Aplique ou cancele no mesmo painel. Em malhas já cortadas, são suportadas arestas retas convexas entre faces perpendiculares alinhadas aos eixos locais; arestas côncavas e faces inclinadas ainda não são suportadas.
- Para fazer um entalhe ou abertura, use **Desenhar corte na face** no painel (ou o botão de corte na barra de ferramentas), clique e arraste um retângulo sobre uma face plana. Solte e escolha **Entalhe com profundidade** ou **Corte atravessando** no painel lateral, visualizando o resultado antes de aplicar. Girar a vista antes de desenhar pode facilitar a seleção da face. O retângulo pode ultrapassar uma borda para criar um recorte aberto.
- Cortes funcionam em caixas e malhas fechadas com faces planas alinhadas aos eixos locais. O chanfro e o corte convertem o objeto em malha triangulada; as propriedades, materiais, desfazer/refazer, salvamento e exportação continuam disponíveis. A ferramenta antiga de empurrar/puxar continua exclusiva de caixas não convertidas. Esta ainda não é uma edição livre de faces como a do SketchUp: não há desenho arbitrário, chanfro em várias arestas de uma só vez ou em qualquer geometria. As operações booleanas são experimentais e podem falhar em malhas abertas, complexas ou degeneradas; faça backups.

## Operações sólidas, espelhamento e medidas

- **Operações sólidas…** combina o objeto selecionado com outro objeto visível: subtrair, unir ou manter apenas a interseção. Escolha o segundo objeto e veja uma prévia antes de aplicar. Por padrão o segundo objeto é consumido; marque **Manter outro objeto** para preservá-lo. Desfazer restaura ambos.
- Em **Ações rápidas**, espelhe a geometria no eixo local X, Y ou Z. O objeto convertido continua editável como malha e a operação pode ser desfeita.
- Em **Medidas da geometria**, consulte a caixa envolvente global, a área superficial, a quantidade de triângulos e, para malhas verificadas como fechadas e orientadas, o volume. A área e o volume usam a unidade do projeto ao quadrado e ao cubo; geometrias abertas ou com topologia não verificada não recebem cálculo confiável de volume.
- As operações sólidas são experimentais: exigem sólidos fechados e podem falhar em superfícies abertas, interseções degeneradas ou malhas complexas. As operações geram malhas trianguladas, preservam o material do objeto selecionado, mas não preservam materiais ou texturas do segundo objeto. Faça backups dos projetos importantes.

## Posicionamento e materiais

- Selecione um objeto e use **Alinhar a outro…** no painel de modelagem. Escolha uma referência, eixo e alinhamento de centros ou bordas; também é possível colocar o objeto antes ou depois da referência com um espaço definido na unidade do projeto. O cálculo usa a caixa envolvente no espaço global, inclusive para objetos girados, e não faz contato entre superfícies irregulares.
- Marque **Manter proporções** antes de editar uma dimensão para redimensionar os três eixos juntos, preservando a base vertical do objeto. A opção vale durante a sessão e pode ser desmarcada.
- Na aba Materiais, use **Copiar material** e **Colar material** para reutilizar cor, rugosidade, metalização e opacidade em outro objeto. A cópia de material dura apenas durante a sessão do projeto.
- Essas alterações podem ser desfeitas e refeitas; os resultados são salvos no projeto.

## Escada reta

Em **Adicionar → Escada reta**, ajuste largura, profundidade, altura total e número de degraus com prévia em tempo real. A escada é uma malha sólida no centro da cena, apoiada no chão. A ferramenta usa a unidade do projeto e permite cancelar antes de criar; a criação pode ser desfeita. O número de degraus continua editável diretamente nas propriedades mesmo após salvar e reabrir; largura, profundidade e altura podem ser ajustadas em Dimensões. O histórico permite desfazer essas alterações, e cópias preservam os parâmetros. Escadas criadas antes deste recurso continuam sendo malhas comuns. Operações que substituem a geometria, como chanfro e corte, ainda são destrutivas: ao aplicá-las à escada, há um aviso e os degraus deixam de ser editáveis, mas é possível desfazer.

## Deformar caixas

Selecione uma caixa original e use **Deformar caixa** para afunilar o topo ou incliná-lo em X ou Y local, mantendo a base no lugar. Os campos mostram prévia no modelo; cancelar preserva o original e aplicar cria uma malha independente, com desfazer/refazer. O deslocamento usa a unidade do projeto. A ferramenta funciona somente em caixas ainda não convertidas em malha; após aplicar, as ferramentas específicas de caixas deixam de estar disponíveis para aquele objeto.

## Organização avançada da cena

Na lista da cena, **Filtros e ordenação** permite combinar busca e etiqueta com tipo e estado (visível, oculto, bloqueado ou desbloqueado), ordenar por nome ou tipo e limpar os filtros. A ordenação é somente visual: não altera a ordem dos objetos na cena. O contador mostra quantos objetos correspondem aos filtros.

Em **Ações dos resultados filtrados**, é possível mostrar, ocultar, bloquear, desbloquear, aplicar ou remover uma etiqueta e excluir os resultados; essas ações são desfeitas pelo histórico. A exclusão pede confirmação e inclui objetos ocultos e bloqueados que correspondam aos filtros. Enquadrar visíveis ajusta a câmera para os resultados visíveis sem mudar a cena. Confira a lista e o contador antes de executar ações em lote. É possível aplicar aos resultados o material copiado do objeto selecionado, renomeá-los em sequência (com prévia e numeração configurável) ou baixar apenas eles em um JSON de projeto independente; esses recursos incluem objetos ocultos e bloqueados. Renomeação e material em lote podem ser desfeitos.

## Etiquetas de objetos

Atribua uma **Etiqueta** nas propriedades de um objeto, por exemplo “Paredes” ou “Móveis”. O seletor na lista da cena filtra objetos por etiqueta ou mostra apenas os sem etiqueta; a busca por nome funciona junto com o filtro. O filtro afeta somente a lista, não oculta objetos no viewport nem altera o que é exportado.

Em **Ações da etiqueta filtrada**, oculte, mostre, bloqueie ou desbloqueie todos os objetos dessa etiqueta, mesmo se estiverem fora dos resultados da busca. As ações podem ser desfeitas. Etiquetas são salvas no projeto e mantidas em duplicações, cópias, repetições e divisões de caixas. Projetos antigos continuam compatíveis. As etiquetas são rótulos de organização, não grupos hierárquicos de transformação.

## Organizar projetos e cenas

- Na biblioteca inicial, busque projetos pelo nome e ordene por nome, mais recentes ou mais antigos. Em cada cartão, use os botões para renomear, duplicar, baixar um JSON individual ou excluir o projeto. Duplicar cria um projeto independente, com sua própria cópia da cena e miniatura.
- A biblioteca aceita até 200 projetos; quando está cheia, o aplicativo recusa novos projetos em vez de remover um projeto antigo da lista.
- Na lista de objetos, **Ações para todos os objetos** permite ocultar, inverter a visibilidade, bloquear ou desbloquear a cena inteira. As ações incluem objetos ocultos e filtrados pela busca, e podem ser desfeitas.

## Divisão, alinhamento e exportação

- **Dividir caixa…** cria peças iguais ao longo de um eixo local da caixa; ajuste quantidade e espaço entre elas com prévia na cena. A rotação e o material são preservados, e a divisão inteira pode ser desfeita. Por enquanto, funciona em caixas que ainda não foram convertidas em malha.
- **Alinhar a outro…** mostra uma prévia enquanto você ajusta eixo, bordas e distância no painel lateral; aplicar salva uma única ação e cancelar restaura a posição original.
- Em **Arquivo**, as opções **Exportar selecionado** geram GLB, OBJ ou STL somente do objeto escolhido, sem ocultar ou modificar os demais. As opções de exportação comuns continuam exportando todos os objetos visíveis.

## Repetições e ambiente

- Em **Editar → Repetir objeto…**, crie cópias lineares, circulares ou em **grade 2D**. Na grade, defina linhas, colunas, eixos e espaçamentos (inclusive negativos). A prévia aparece na cena enquanto os valores são ajustados; só vira geometria ao aplicar. Uma repetição inteira pode ser desfeita de uma vez.
- **Ambiente** agora é editado no painel lateral com prévia imediata de fundo, iluminação, posição da luz e sombras. **Cancelar** restaura o ambiente anterior; **Aplicar** salva as alterações como uma ação no histórico.
- Na tela de projetos, **Baixar biblioteca** reúne todos os projetos e miniaturas em um JSON. **Importar biblioteca** acrescenta os projetos como cópias, sem sobrescrever os existentes. A importação valida o arquivo e tenta reverter as cópias se o armazenamento estiver cheio. O limite é 20 MB por backup e 200 projetos na biblioteca; ainda é importante guardar o arquivo fora do navegador.

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
