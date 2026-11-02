import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);

test('desktop editor integrates primitives, history, visibility and persistence', async () => {
  const dom=new JSDOM('<!doctype html><div id="app"></div>',{url:'http://localhost/',pretendToBeVisual:true});
  const {window}=dom;
  for(const key of ['window','document','localStorage','navigator','HTMLElement','SVGElement','Element','Node','Blob','FileReader']) Object.defineProperty(globalThis,key,{value:window[key],configurable:true,writable:true});
  globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=()=>0;globalThis.ResizeObserver=class{observe(){}};
  const result=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'cjs',platform:'node',loader:{'.css':'empty'},plugins:[{name:'mock-renderer',setup(build){
    build.onResolve({filter:/^three$/},args=>args.importer.endsWith('/src/main.js')?{path:'renderer',namespace:'mock'}:null);
    build.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:`export * from ${JSON.stringify(require.resolve('three'))}; export class WebGLRenderer { constructor(){this.domElement=document.createElement('canvas');this.shadowMap={}} setPixelRatio(){} setSize(){} render(){} }`,loader:'js',resolveDir:process.cwd()}));
  }}]});
  const mod={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(require,mod,mod.exports);
  const $=selector=>window.document.querySelector(selector);const click=selector=>{assert.ok($(selector),selector);$(selector).click()};
  assert.equal($('#count').textContent,'1');
  window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'5',code:'Digit5'}));assert.equal($('#projection-label').textContent,'ORTOGRÁFICA');window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'5',code:'Numpad5'}));assert.equal($('#projection-label').textContent,'PERSPECTIVA');
  click('#projection-toggle');assert.equal($('#projection-label').textContent,'ORTOGRÁFICA');click('#frame-all');click('#projection-toggle');assert.equal($('#projection-label').textContent,'PERSPECTIVA');
  click('#materials-tab');assert.equal($('#materials-tab').getAttribute('aria-pressed'),'true');assert.ok($('.sidebar').classList.contains('material-mode'));
  click('[data-material-preset="metal"]');let current=JSON.parse(window.localStorage.getItem('bender-scene-v1'));assert.equal(current.objects[0].metalness,1);assert.equal(current.objects[0].roughness,.25);
  click('#undo');current=JSON.parse(window.localStorage.getItem('bender-scene-v1'));assert.equal(current.objects[0].metalness,0);
  click('[data-material-preset="glass"]');current=JSON.parse(window.localStorage.getItem('bender-scene-v1'));assert.equal(current.objects[0].opacity,.35);click('#undo');
  click('#modeling-tab');assert.equal($('#modeling-tab').getAttribute('aria-pressed'),'true');assert.ok(!$('.sidebar').classList.contains('material-mode'));
  for(const tool of ['gizmo-move','gizmo-rotate','gizmo-scale','face','select']){click(`[data-tool="${tool}"]`);assert.ok($(`[data-tool="${tool}"]`).classList.contains('active'))}
  click('#add-menu');click('[data-add="cone"]');assert.equal($('#count').textContent,'2');
  $('#object-name').value='Minha peça';$('#object-name').dispatchEvent(new window.Event('change'));
  $('#properties input[data-material="roughness"]').value='0.35';$('#properties input[data-material="roughness"]').dispatchEvent(new window.Event('change'));
  click('#duplicate');assert.equal($('#count').textContent,'3');assert.equal(JSON.parse(window.localStorage.getItem('bender-scene-v1')).objects[2].roughness,.35);click('#undo');assert.equal($('#count').textContent,'2');click('#redo');assert.equal($('#count').textContent,'3');
  $('#scene-search').value='Minha';$('#scene-search').dispatchEvent(new window.Event('input'));assert.equal(window.document.querySelectorAll('.scene-row').length,1);
  $('#scene-search').value='';$('#scene-search').dispatchEvent(new window.Event('input'));
  click('[data-visible="0"]');assert.match($('#scene-stats').textContent,/2 visíveis/);click('#show-all');assert.match($('#scene-stats').textContent,/3 visíveis/);
  click('#grid-toggle');assert.equal($('#grid-toggle').getAttribute('aria-pressed'),'false');click('#wire-toggle');assert.equal($('#wire-toggle').getAttribute('aria-pressed'),'true');
  $('#scene-search').value='impossível';$('#scene-search').dispatchEvent(new window.Event('input'));
  window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'h'}));assert.match($('#scene-stats').textContent,/2 visíveis/);
  click('#show-all');$('#scene-search').value='';$('#scene-search').dispatchEvent(new window.Event('input'));
  click('[data-index="1"]');$('#properties input[data-prop="rotX"]').value='45';$('#properties input[data-prop="rotX"]').dispatchEvent(new window.Event('change'));
  assert.ok(Math.abs(JSON.parse(window.localStorage.getItem('bender-scene-v1')).objects[1].rotationX-Math.PI/4)<1e-8);
  click('#isolate-object');assert.match($('#scene-stats').textContent,/1 visíveis/);click('#undo');assert.match($('#scene-stats').textContent,/3 visíveis/);
  const saved=JSON.parse(window.localStorage.getItem('bender-scene-v1'));assert.equal(saved.objects.length,3);assert.equal(saved.objects[1].type,'cone');assert.equal(saved.objects[1].name,'Minha peça');
  window.close();
});
