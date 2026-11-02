import { test, expect } from '@playwright/test';

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
  page.once('dialog',d=>d.accept());await page.locator('#file-menu').click();const chooser2=page.waitForEvent('filechooser');await page.locator('#import-obj').click();await (await chooser2).setFiles({name:'vazio.obj',mimeType:'text/plain',buffer:Buffer.from('v 0 0 0\n')});await expect(page.locator('#count')).toHaveText('1');
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
  await page.locator('#duplicate').click();await page.locator('#align-open').click();await expect(page.locator('#align-dialog')).toBeVisible();
  await page.locator('#align-reference').selectOption('0');await page.locator('#align-axis').selectOption('x');await page.locator('#align-mode').selectOption('after');await page.locator('#align-gap').fill('50');await page.locator('#align-form button[type="submit"]').click();
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
