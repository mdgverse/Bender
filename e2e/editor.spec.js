import { test, expect } from '@playwright/test';
import {readFile} from 'node:fs/promises';

async function gotoAndStart(page,path) {
  await page.goto(path);
  if(await page.locator('#start-screen').isVisible()) await page.locator('#new-project-form button[type="submit"]').click();
}

for (const path of ['/', '/bender-studio.html']) {
  test(`projection and material controls work in browser: ${path}`, async ({page}) => {
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await gotoAndStart(page,path);await expect(page.locator('canvas')).toBeVisible();
    await expect(page.locator('#projection-label')).toHaveText('PERSPECTIVA');
    await page.keyboard.press('5');await expect(page.locator('#projection-label')).toHaveText('ORTOGRÁFICA');
    await page.keyboard.press('Numpad5');await expect(page.locator('#projection-label')).toHaveText('PERSPECTIVA');
    await page.locator('#projection-toggle').click();await expect(page.locator('#projection-label')).toHaveText('ORTOGRÁFICA');
    await page.locator('#materials-tab').click();
    await expect(page.locator('[data-material="roughness"]')).toBeVisible();
    await page.locator('[data-material-preset="metal"]').click();
    await expect(page.locator('[data-material="metalness"]')).toHaveValue('1.00');
    await page.reload();await page.locator('#materials-tab').click();await expect(page.locator('[data-material="metalness"]')).toHaveValue('1.00');
    expect(errors).toEqual([]);
  });
}

test('materials explain selection when no object is selected', async ({page}) => {
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#delete').click();
  await page.locator('#materials-tab').click();await expect(page.locator('#properties')).toContainText('Selecione um objeto');
});

test('desktop clipboard and project name preserve editable data', async ({page}) => {
  await gotoAndStart(page,'/bender-studio.html');
  await page.locator('#project-name').fill('Meu projeto');await page.locator('#project-name').press('Tab');
  await page.locator('[data-index="0"]').click();
  await page.keyboard.press('Control+c');await page.keyboard.press('Control+v');
  await expect(page.locator('#count')).toHaveText('2');
  await expect(page.locator('#object-name')).toHaveValue('Cubo cópia');
  await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('1');
  await page.reload();await expect(page.locator('#project-name')).toHaveValue('Meu projeto');
  await page.locator('#edit-menu').click();await expect(page.locator('#copy-object')).toBeVisible();
});

test('published page has working projection and material controls', async ({page}) => {
  test.skip(!process.env.BENDER_LIVE_URL, 'Public deployment is tested after publishing.');
  await gotoAndStart(page,process.env.BENDER_LIVE_URL);
  await expect(page.locator('#projection-label')).toHaveText('PERSPECTIVA');
  await page.keyboard.press('5');await expect(page.locator('#projection-label')).toHaveText('ORTOGRÁFICA');
  await page.locator('#materials-tab').click();await expect(page.locator('[data-material="roughness"]')).toBeVisible();
  await expect(page.locator('.status')).toContainText('v0.2.1');
});

test('linear and circular copies can be undone as single actions', async ({page}) => {
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#edit-menu').click();await page.locator('#array-open').click();
  await page.locator('#array-count').fill('3');await page.locator('#array-axis').selectOption('z');await page.locator('#array-distance').fill('1.5');await page.locator('#array-form button[type="submit"]').click();
  await expect(page.locator('#count')).toHaveText('4');let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects.map(o=>o.position[1])).toEqual([1,2.5,4,5.5]);
  await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('1');
  await page.locator('#edit-menu').click();await page.locator('#array-open').click();await page.locator('#array-mode').selectOption('radial');await page.locator('#array-count').fill('4');await page.locator('#array-radius').fill('3');await page.locator('#array-rotate').check();await page.locator('#array-form button[type="submit"]').click();
  await expect(page.locator('#count')).toHaveText('5');data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects[2].rotation).toBeCloseTo(-Math.PI/2);await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('1');
});

test('locks protect objects, survive reload and are undoable', async ({page}) => {
  await gotoAndStart(page,'/bender-studio.html');await page.locator('[data-lock="0"]').click();await expect(page.locator('#properties')).toContainText('Selecione um objeto');
  await page.locator('[data-index="0"]').click();await expect(page.locator('#properties')).toContainText('Selecione um objeto');
  await page.reload();await expect(page.locator('[data-lock="0"]')).toHaveAttribute('title','Desbloquear objeto');
  await page.locator('[data-lock="0"]').click();await page.locator('[data-index="0"]').click();await expect(page.locator('#object-name')).toHaveValue('Cubo');
});

test('scene environment and quick transforms persist and undo', async ({page}) => {
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#environment-open').click();await page.locator('#environment-background').fill('#556677');await page.locator('#environment-ambient').fill('1');await page.locator('#environment-direct').fill('3');await page.locator('#environment-form button[type="submit"]').click();
  let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.environment).toMatchObject({background:'556677',ambient:1,direct:3,lightPosition:[4,4,2],lightColor:'ffffff',showLight:true});
  await page.locator('.advanced-transforms summary').click();await page.locator('[data-action="double"]').click();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects[0].scale).toEqual([4,4,4]);
  await page.locator('#undo').click();await page.locator('#undo').click();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.environment.background).toBe('242628');
});


test('point light visibly illuminates the model and its settings persist', async ({page}) => {
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#scene-light').click();await expect(page.locator('#light-properties')).toBeVisible();
  await page.locator('#light-properties').click();await page.locator('#environment-ambient').fill('0');await page.locator('#environment-direct').fill('0');await page.locator('#light-marker-visible').uncheck();await page.locator('#environment-form button[type="submit"]').click();
  await page.locator('[data-index="0"]').click();await page.waitForTimeout(300);const dark=await page.locator('canvas').screenshot();
  await page.locator('#environment-open').click();await page.locator('#environment-direct').fill('5');await page.locator('#environment-form button[type="submit"]').click();
  await page.waitForTimeout(300);const lit=await page.locator('canvas').screenshot();expect(dark.equals(lit)).toBe(false);
  await page.locator('#environment-open').click();await page.locator('#light-x').fill('2');await page.locator('#light-y').fill('1');await page.locator('#light-z').fill('3');await page.locator('#environment-light-color').fill('#ffcc99');await page.locator('#environment-form button[type="submit"]').click();
  let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.environment).toMatchObject({ambient:0,direct:5,lightPosition:[2,3,1],lightColor:'ffcc99',showLight:false});
  await page.reload();await page.locator('#environment-open').click();await expect(page.locator('#light-z')).toHaveValue('3');await expect(page.locator('#environment-direct')).toHaveValue('5');await expect(page.locator('#light-marker-visible')).not.toBeChecked();
});

test('measure two points on the ground plane without modifying the project', async ({page}) => {
  await gotoAndStart(page,'/bender-studio.html');const before=await page.evaluate(()=>localStorage.getItem('bender-scene-v1'));await page.locator('[data-view="top"]').click();await page.keyboard.press('m');
  await expect(page.locator('#measure-readout')).toBeVisible();const rect=await page.locator('canvas').boundingBox();
  await page.mouse.click(rect.x+rect.width*.35,rect.y+rect.height*.35);await page.mouse.move(rect.x+rect.width*.65,rect.y+rect.height*.35);
  await expect(page.locator('#measure-values')).toContainText('Distância');const preview=await page.locator('#measure-values').textContent();expect(preview).not.toContain('Distância 0.00');
  await page.mouse.click(rect.x+rect.width*.65,rect.y+rect.height*.35);await expect(page.locator('#measure-values')).toHaveText(preview);
  expect(await page.evaluate(()=>localStorage.getItem('bender-scene-v1'))).toBe(before);await page.locator('#measure-clear').click();await expect(page.locator('#measure-values')).toContainText('primeiro ponto');
  await page.keyboard.press('v');await expect(page.locator('#measure-readout')).toBeHidden();
});

test('shadows change the viewport and survive reload', async ({page}) => {
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#environment-open').click();await page.locator('#environment-shadows').uncheck();await page.locator('#environment-direct').fill('3');await page.locator('#light-marker-visible').uncheck();await page.locator('#environment-form button[type="submit"]').click();
  await page.waitForTimeout(500);const without=await page.locator('canvas').screenshot();
  await page.locator('#environment-open').click();await page.locator('#environment-shadows').check();await page.locator('#environment-form button[type="submit"]').click();
  await page.waitForTimeout(500);const withShadow=await page.locator('canvas').screenshot();expect(without.equals(withShadow)).toBe(false);
  await page.reload();await page.locator('#environment-open').click();await expect(page.locator('#environment-shadows')).toBeChecked();
});

test('imports OBJ geometry, duplicates and restores it through history and reload', async ({page}) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await gotoAndStart(page,'/bender-studio.html');await page.locator('#file-menu').click();
  const chooser=page.waitForEvent('filechooser');await page.locator('#import-obj').click();await (await chooser).setFiles({name:'triangulo.obj',mimeType:'text/plain',buffer:Buffer.from('o tri\nv 0 0 0\nv 2 0 0\nv 0 2 0\nf 1 2 3\n')});
  await expect(page.locator('#count')).toHaveText('2');await expect(page.locator('#object-name')).toHaveValue('triangulo');
  let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects[1].type).toBe('mesh');expect(data.objects[1].geometry).toHaveLength(9);
  await page.locator('#duplicate').click();await expect(page.locator('#count')).toHaveText('3');await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('2');
  await page.reload();await expect(page.locator('#count')).toHaveText('2');await expect(page.locator('#object-name')).toHaveValue('triangulo');expect(errors).toEqual([]);
});

test('imports STL and rejects malformed files without changing the scene',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#file-menu').click();const chooser=page.waitForEvent('filechooser');await page.locator('#import-stl').click();
  const stl='solid one\n facet normal 0 0 1\n outer loop\n vertex 0 0 0\n vertex 2 0 0\n vertex 0 2 0\n endloop\n endfacet\nendsolid one';
  await (await chooser).setFiles({name:'face.stl',mimeType:'model/stl',buffer:Buffer.from(stl)});await expect(page.locator('#count')).toHaveText('2');await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('1');
  const invalidDialog=page.waitForEvent('dialog');await page.locator('#file-menu').click();const chooser2=page.waitForEvent('filechooser');await page.locator('#import-obj').click();await (await chooser2).setFiles({name:'vazio.obj',mimeType:'text/plain',buffer:Buffer.from('v 0 0 0\n')});await (await invalidDialog).accept();await expect(page.locator('#count')).toHaveText('1');
});

test('creates independent recent projects with screenshots and unit conversion',async({page})=>{
  await page.goto('/bender-studio.html');await expect(page.locator('#start-screen')).toBeVisible();
  await page.locator('#new-project-name').fill('Cozinha');await page.locator('#new-project-unit').selectOption('cm');await page.locator('#new-project-form button[type="submit"]').click();
  await expect(page.locator('#start-screen')).toBeHidden();await expect(page.locator('[data-prop="width"]')).toHaveValue('200');
  await page.locator('[data-prop="width"]').fill('150');await page.locator('[data-prop="width"]').press('Tab');
  let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects[0].scale[0]).toBe(1.5);expect(data.units).toBe('cm');
  await page.locator('#project-units').selectOption('mm');await expect(page.locator('[data-prop="width"]')).toHaveValue('1500');await expect(page.locator('#snap-step')).toHaveValue('500');
  await page.locator('#open-start').click();await expect(page.locator('.recent-card')).toHaveCount(1);await expect(page.locator('.recent-card img')).toHaveAttribute('src',/^data:image\/jpeg;base64,/);
  await page.locator('#new-project-name').fill('Sala');await page.locator('#new-project-unit').selectOption('m');await page.locator('#new-project-form button[type="submit"]').click();await expect(page.locator('#project-name')).toHaveValue('Sala');
  await page.locator('#open-start').click();await expect(page.locator('.recent-card')).toHaveCount(2);await page.getByRole('button',{name:'Abrir Cozinha'}).click();await expect(page.locator('#project-units')).toHaveValue('mm');await expect(page.locator('[data-prop="width"]')).toHaveValue('1500');
  await page.locator('#open-start').click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Excluir Sala'}).click();await expect(page.locator('.recent-card')).toHaveCount(1);
});

test('migrates the previous locally saved project without overwriting it',async({page})=>{
  const old={serial:1,title:'Projeto anterior',selected:0,objects:[{name:'Antigo',position:[0,1,0],scale:[2,2,2]}]};
  await page.addInitScript(data=>localStorage.setItem('bender-scene-v1',JSON.stringify(data)),old);await page.goto('/bender-studio.html');await expect(page.locator('#start-screen')).toBeVisible();await expect(page.getByRole('button',{name:'Abrir Projeto anterior'})).toBeVisible();
  await page.getByRole('button',{name:'Abrir Projeto anterior'}).click();await expect(page.locator('#object-name')).toHaveValue('Antigo');await expect(page.locator('#project-units')).toHaveValue('m');
});

test('aligns objects by bounds with unit-aware spacing and undo',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#project-units').selectOption('cm');
  await page.locator('#duplicate').click();const before=await page.evaluate(()=>localStorage.getItem('bender-scene-v1'));await page.locator('#align-open').click();await expect(page.locator('#align-inline')).toBeVisible();
  await page.locator('#align-reference').selectOption('0');await page.locator('#align-axis').selectOption('x');await page.locator('#align-mode').selectOption('after');await page.locator('#align-gap').fill('50');expect(await page.evaluate(()=>localStorage.getItem('bender-scene-v1'))).toBe(before);await page.locator('#align-form button[type="submit"]').click();
  let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects[1].position[0]).toBeCloseTo(2.5);expect(data.objects[1].position[2]).toBeCloseTo(.5);
  await page.locator('#undo').click();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects[1].position[0]).toBeCloseTo(.5);
  await page.locator('#redo').click();await page.reload();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects[1].position[0]).toBeCloseTo(2.5);
});

test('copies materials and resizes proportionally while preserving undo',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#materials-tab').click();await page.locator('[data-material-preset="glass"]').click();await page.locator('#copy-material').click();
  await page.locator('#modeling-tab').click();await page.locator('#add-menu').click();await page.locator('[data-add="cone"]').click();await page.locator('#materials-tab').click();await page.locator('#paste-material').click();await expect(page.locator('[data-material="opacity"]')).toHaveValue('0.35');
  await page.locator('#modeling-tab').click();await page.locator('#proportional-scale').check();await page.locator('[data-prop="width"]').fill('4');await page.locator('[data-prop="width"]').press('Tab');
  const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));const object=data.objects[1];expect(object.scale[0]).toBeCloseTo(4);expect(object.scale[1]).toBeCloseTo(4);expect(object.scale[2]).toBeCloseTo(4);expect(object.opacity).toBeCloseTo(.35);
  await page.locator('#undo').click();await expect(page.locator('[data-prop="width"]')).toHaveValue('2');
});

test('previews selected-edge bevel in place, cancels and applies with undo',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#bevel-open').click();await expect(page.locator('#bevel-inline')).toBeVisible();await page.locator('#bevel-edge-select').selectOption('0');
  const before=await page.evaluate(()=>localStorage.getItem('bender-scene-v1'));const first=await page.locator('#canvas canvas').screenshot();
  await page.locator('#bevel-size').fill('0.6');await expect(page.locator('#bevel-size')).toBeFocused();await page.locator('#bevel-segments').selectOption('8');const second=await page.locator('#canvas canvas').screenshot();expect(second.equals(first)).toBe(false);expect(await page.evaluate(()=>localStorage.getItem('bender-scene-v1'))).toBe(before);
  await page.locator('#bevel-cancel').click();let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(saved.objects[0].type).toBe('box');
  await page.locator('#bevel-open').click();await page.locator('#bevel-edge-select').selectOption('0');await page.locator('#bevel-size').fill('0.2');await page.locator('#bevel-apply').click();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(saved.objects[0].type).toBe('mesh');
  await page.locator('#undo').click();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(saved.objects[0].type).toBe('box');await page.locator('#redo').click();await page.reload();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(saved.objects[0].type).toBe('mesh');
});

test('draws a rectangle on a face to create a through cut and undo',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('[data-view="top"]').click();await page.locator('[data-tool="cut-face"]').click();
  const box=await page.locator('#canvas canvas').boundingBox();const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x-15,y-15);await page.mouse.down();await page.mouse.move(x+15,y+15,{steps:8});await page.mouse.up();
  await expect(page.locator('#cut-inline')).toBeVisible();const before=await page.evaluate(()=>localStorage.getItem('bender-scene-v1'));await page.locator('#cut-depth').fill('0.8');await expect(page.locator('#cut-depth')).toBeFocused();expect(await page.evaluate(()=>localStorage.getItem('bender-scene-v1'))).toBe(before);await page.locator('#cut-mode').selectOption('through');await page.locator('#cut-apply').click();await expect(page.locator('#cut-inline')).toBeHidden();
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(saved.objects[0].type).toBe('mesh');expect(saved.objects[0].geometry.length).toBeGreaterThan(108);
  await page.locator('#undo').click();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(saved.objects[0].type).toBe('box');await page.locator('#redo').click();await page.reload();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(saved.objects[0].type).toBe('mesh');
});

test('object numeric parameters update without closing or losing focus',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');const width=page.locator('[data-prop="width"]');await width.fill('3');await expect(width).toBeFocused();let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(saved.objects[0].scale[0]).toBe(3);await width.fill('4');await expect(width).toBeFocused();await width.press('Tab');await page.locator('#undo').click();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(saved.objects[0].scale[0]).toBe(2);
});

test('bevel can be applied to a solid after a face cut',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('[data-view="top"]').click();await page.locator('[data-tool="cut-face"]').click();
  const box=await page.locator('#canvas canvas').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;await page.mouse.move(x-15,y-15);await page.mouse.down();await page.mouse.move(x+15,y+15,{steps:8});await page.mouse.up();
  await page.locator('#cut-mode').selectOption('through');await page.locator('#cut-apply').click();const cut=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(cut.objects[0].type).toBe('mesh');
  await page.locator('#bevel-open').click();await expect(page.locator('#bevel-inline')).toBeVisible();expect(await page.locator('#bevel-edge-select option').count()).toBeGreaterThan(1);await page.locator('#bevel-edge-select').selectOption({index:1});await page.locator('#bevel-size').fill('0.1');await expect(page.locator('#bevel-apply')).toBeEnabled();await page.locator('#bevel-apply').click();
  let result=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(result.objects[0].geometry).not.toEqual(cut.objects[0].geometry);await page.locator('#undo').click();result=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(result.objects[0].geometry).toEqual(cut.objects[0].geometry);await page.locator('#redo').click();await page.reload();result=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(result.objects[0].geometry).not.toEqual(cut.objects[0].geometry);
});

test('boolean preview, subtraction, undo, redo and reload keep projects safe',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#duplicate').click();const before=await page.evaluate(()=>localStorage.getItem('bender-scene-v1'));
  await page.locator('#boolean-open').click();await expect(page.locator('#boolean-inline')).toBeVisible();await page.locator('#boolean-reference').selectOption('0');await expect(page.locator('#boolean-apply')).toBeEnabled();expect(await page.evaluate(()=>localStorage.getItem('bender-scene-v1'))).toBe(before);
  await page.locator('#boolean-cancel').click();expect(await page.evaluate(()=>localStorage.getItem('bender-scene-v1'))).toBe(before);
  await page.locator('#boolean-open').click();await page.locator('#boolean-reference').selectOption('0');await page.locator('#boolean-apply').click();await expect(page.locator('#count')).toHaveText('1');let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects[0].type).toBe('mesh');
  await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('2');await page.locator('#redo').click();await expect(page.locator('#count')).toHaveText('1');await page.reload();state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects).toHaveLength(1);expect(state.objects[0].type).toBe('mesh');
});

test('shows surface and volume and mirrors objects with undo',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('.object-metrics summary').click();await expect(page.locator('#object-metrics-result')).toContainText('Área: 24 m²');await expect(page.locator('#object-metrics-result')).toContainText('Volume: 8 m³');
  await page.locator('.advanced-transforms summary').click();await page.locator('[data-mirror="x"]').click();let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects[0].type).toBe('mesh');await page.locator('#undo').click();state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects[0].type).toBe('box');
});

test('grid array previews with units, cancels, applies and can be undone',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#project-units').selectOption('cm');const before=await page.evaluate(()=>localStorage.getItem('bender-scene-v1'));
  await page.locator('#edit-menu').click();await page.locator('#array-open').click();await expect(page.locator('#array-inline')).toBeVisible();await page.locator('#array-mode').selectOption('grid');await page.locator('#grid-columns').fill('3');await page.locator('#grid-rows').fill('2');await page.locator('#grid-spacing-a').fill('150');await page.locator('#grid-spacing-b').fill('-200');await expect(page.locator('#array-error')).toContainText('5 cópia');expect(await page.evaluate(()=>localStorage.getItem('bender-scene-v1'))).toBe(before);await page.locator('#array-cancel').click();await expect(page.locator('#count')).toHaveText('1');
  await page.locator('#edit-menu').click();await page.locator('#array-open').click();await page.locator('#array-mode').selectOption('grid');await page.locator('#grid-columns').fill('3');await page.locator('#grid-rows').fill('2');await page.locator('#grid-spacing-a').fill('150');await page.locator('#grid-spacing-b').fill('-200');await page.locator('#array-apply').click();await expect(page.locator('#count')).toHaveText('6');let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects[5].position[0]).toBe(3);expect(state.objects[5].position[2]).toBe(-2);await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('1');await page.locator('#redo').click();await page.reload();await expect(page.locator('#count')).toHaveText('6');
});

test('environment controls preview directly and cancel without saving',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');const before=await page.evaluate(()=>localStorage.getItem('bender-scene-v1'));const initial=await page.locator('#canvas canvas').screenshot();await page.locator('#environment-open').click();await expect(page.locator('#environment-inline')).toBeVisible();await page.locator('#environment-background').fill('#556677');const changed=await page.locator('#canvas canvas').screenshot();expect(initial.equals(changed)).toBe(false);expect(await page.evaluate(()=>localStorage.getItem('bender-scene-v1'))).toBe(before);await page.locator('#environment-cancel').click();await expect(page.locator('#environment-inline')).toBeHidden();expect(await page.evaluate(()=>localStorage.getItem('bender-scene-v1'))).toBe(before);
});

test('exports and restores the entire project library as copies',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#project-name').fill('Teste backup');await page.locator('#project-name').press('Tab');await page.locator('#open-start').click();await expect(page.locator('.recent-card')).toHaveCount(1);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#backup-library').click()]);expect(download.suggestedFilename()).toBe('bender-biblioteca.json');await page.locator('#library-file').setInputFiles(await download.path());await expect(page.locator('.recent-card')).toHaveCount(2);await expect(page.locator('#start-error')).toContainText('1 projeto(s) importado(s)');
  const index=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-library-v1')));expect(index[0].id).not.toBe(index[1].id);expect(index.map(x=>x.title)).toEqual(['Teste backup','Teste backup']);
});

test('divides a rotated box into equal independent pieces with live preview',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#project-units').selectOption('cm');await page.locator('[data-prop="rotation"]').fill('90');await page.locator('[data-prop="rotation"]').press('Tab');
  const before=await page.evaluate(()=>localStorage.getItem('bender-scene-v1'));await page.locator('#split-open').click();await expect(page.locator('#split-inline')).toBeVisible();await page.locator('#split-count').fill('4');await page.locator('#split-gap').fill('10');await expect(page.locator('#split-error')).toContainText('4 peças');expect(await page.evaluate(()=>localStorage.getItem('bender-scene-v1'))).toBe(before);
  await page.locator('#split-apply').click();await expect(page.locator('#count')).toHaveText('4');let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));for(const object of state.objects){expect(object.scale[0]).toBeCloseTo(.425);expect(object.rotation).toBeCloseTo(Math.PI/2)}expect(state.objects[0].position[2]).toBeCloseTo(.7875);expect(state.objects[3].position[2]).toBeCloseTo(-.7875);
  await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('1');await page.locator('#redo').click();await page.reload();await expect(page.locator('#count')).toHaveText('4');
});

test('exports only the selected object without changing visibility',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#add-menu').click();await page.locator('[data-add="sphere"]').click();await page.locator('[data-index="0"]').click();await page.locator('#file-menu').click();const [file]=await Promise.all([page.waitForEvent('download'),page.locator('#export-selected-obj').click()]);const content=await readFile(await file.path(),'utf8');expect(file.suggestedFilename()).toBe('Cubo.obj');expect(content).toContain('o Cubo');expect(content).not.toMatch(/o Esfera/);const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects).toHaveLength(2);expect(state.objects.every(o=>o.visible)).toBe(true);
});

test('finds, sorts, renames, duplicates and exports projects from the library',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#project-name').fill('Sala');await page.locator('#project-name').press('Tab');await page.locator('#open-start').click();
  await page.getByRole('button',{name:'Duplicar Sala'}).click();await expect(page.locator('.recent-card')).toHaveCount(2);await page.getByRole('button',{name:'Renomear Sala cópia'}).click();await page.locator('.recent-rename:not([hidden]) input').fill('Quarto');await page.locator('.recent-rename:not([hidden]) button[type="submit"]').click();
  await page.locator('#recent-sort').selectOption('name');await expect(page.locator('.recent-card .recent-info strong')).toHaveText(['Quarto','Sala']);await page.locator('#recent-search').fill('quar');await expect(page.locator('.recent-card')).toHaveCount(1);await expect(page.locator('#recents-count')).toHaveText('1 de 2');
  const [file]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Baixar Quarto'}).click()]);expect(file.suggestedFilename()).toBe('Quarto.json');const data=JSON.parse(await readFile(await file.path(),'utf8'));expect(data.title).toBe('Quarto');expect(data.objects).toHaveLength(1);
  await page.locator('#recent-search').fill('impossível');await expect(page.locator('.recent-empty')).toContainText('Nenhum projeto encontrado');await page.locator('#recent-search').fill('');await page.getByRole('button',{name:'Abrir Quarto'}).click();await page.locator('[data-prop="width"]').fill('3');await page.locator('[data-prop="width"]').press('Tab');await page.locator('#open-start').click();await page.getByRole('button',{name:'Abrir Sala',exact:true}).click();await expect(page.locator('[data-prop="width"]')).toHaveValue('2');
});

test('bulk visibility and locking apply to the entire scene and support undo',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#add-menu').click();await page.locator('[data-add="sphere"]').click();await page.locator('#scene-search').fill('Cubo');await page.locator('.scene-batch summary').click();await page.locator('#lock-all').click();let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects.every(o=>o.locked)).toBe(true);await page.locator('#undo').click();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects.every(o=>!o.locked)).toBe(true);
  await page.locator('#hide-all').click();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects.every(o=>!o.visible)).toBe(true);await page.locator('#invert-visibility').click();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects.every(o=>o.visible)).toBe(true);await page.locator('#lock-all').click();await page.locator('#unlock-all').click();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects.every(o=>!o.locked)).toBe(true);
});

test('tags organize, filter and batch manage objects while preserving copies and undo',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#object-tag').fill('Paredes');await page.locator('#object-tag').press('Tab');await page.locator('#duplicate').click();
  let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects.map(o=>o.tag)).toEqual(['Paredes','Paredes']);
  await page.locator('#add-menu').click();await page.locator('[data-add="sphere"]').click();await page.locator('#object-tag').fill('Móveis');await page.locator('#object-tag').press('Tab');await page.locator('#scene-tag-filter').selectOption('tag:Paredes');await expect(page.locator('.scene-row')).toHaveCount(2);
  await page.locator('.tag-actions summary').click();await page.locator('#scene-search').fill('inexistente');await page.locator('#tag-hide').click();state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects.map(o=>o.visible)).toEqual([false,false,true]);await page.locator('#undo').click();state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects.every(o=>o.visible)).toBe(true);
  await page.locator('#tag-lock').click();state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects.map(o=>o.locked)).toEqual([true,true,false]);await page.locator('#tag-unlock').click();await page.locator('#scene-search').fill('');await page.locator('[data-index="0"]').click();await page.keyboard.press('Control+c');await page.keyboard.press('Control+v');state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects[3].tag).toBe('Paredes');
  await page.reload();await page.locator('#scene-tag-filter').selectOption('tag:Paredes');await expect(page.locator('.scene-row')).toHaveCount(3);await page.locator('#scene-tag-filter').selectOption('tag:Móveis');await expect(page.locator('.scene-row')).toHaveCount(1);
});

test('repetition and box splitting retain the source tag',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#object-tag').fill('Estrutura');await page.locator('#object-tag').press('Tab');await page.locator('#edit-menu').click();await page.locator('#array-open').click();await page.locator('#array-count').fill('2');await page.locator('#array-apply').click();let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects.map(o=>o.tag)).toEqual(['Estrutura','Estrutura','Estrutura']);await page.locator('#undo').click();
  await page.locator('#split-open').click();await page.locator('#split-count').fill('3');await page.locator('#split-apply').click();state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects.map(o=>o.tag)).toEqual(['Estrutura','Estrutura','Estrutura']);
});

test('scene filters and sorting combine without changing scene order',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#object-name').fill('Cubo 10');await page.locator('#object-name').press('Tab');await page.locator('#duplicate').click();await page.locator('#object-name').fill('Cubo 2');await page.locator('#object-name').press('Tab');await page.locator('#add-menu').click();await page.locator('[data-add="sphere"]').click();
  await page.locator('.scene-filter-tools summary').click();await page.locator('#scene-sort').selectOption('name');await expect(page.locator('.scene-name')).toHaveText(['Cubo 2','Cubo 10','Esfera 03']);
  await page.locator('#scene-type-filter').selectOption('box');await expect(page.locator('.scene-row')).toHaveCount(2);await page.locator('[data-lock="0"]').click();await page.locator('#scene-state-filter').selectOption('locked');await expect(page.locator('.scene-name')).toHaveText(['Cubo 10']);await expect(page.locator('#scene-filter-count')).toHaveText('1 de 3 objetos na lista');
  await page.locator('#scene-clear-filters').click();await expect(page.locator('.scene-name')).toHaveText(['Cubo 10','Cubo 2','Esfera 03']);
});

test('filtered batch actions, tagging and deletion are undoable',async({page})=>{
  await gotoAndStart(page,'/bender-studio.html');await page.locator('#duplicate').click();await page.locator('#add-menu').click();await page.locator('[data-add="sphere"]').click();await page.locator('.scene-filter-tools summary').click();await page.locator('#scene-type-filter').selectOption('box');await page.locator('.filtered-actions summary').click();
  await page.locator('#filtered-tag').fill('Estrutura');await page.locator('#filtered-tag-apply').click();let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects.map(o=>o.tag)).toEqual(['Estrutura','Estrutura','']);
  await page.locator('#filtered-hide').click();state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects.map(o=>o.visible)).toEqual([false,false,true]);await page.locator('#undo').click();state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects.every(o=>o.visible)).toBe(true);
  await page.locator('#filtered-lock').click();state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects.map(o=>o.locked)).toEqual([true,true,false]);await page.locator('#filtered-unlock').click();
  page.once('dialog',dialog=>dialog.accept());await page.locator('#filtered-delete').click();await expect(page.locator('#count')).toHaveText('1');await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('3');state=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(state.objects.map(o=>o.tag)).toEqual(['Estrutura','Estrutura','']);
});
