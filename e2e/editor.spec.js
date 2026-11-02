import { test, expect } from '@playwright/test';

for (const path of ['/', '/bender-studio.html']) {
  test(`projection and material controls work in browser: ${path}`, async ({page}) => {
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(path);await expect(page.locator('canvas')).toBeVisible();
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
  await page.goto('/bender-studio.html');await page.locator('#delete').click();
  await page.locator('#materials-tab').click();await expect(page.locator('#properties')).toContainText('Selecione um objeto');
});

test('desktop clipboard and project name preserve editable data', async ({page}) => {
  await page.goto('/bender-studio.html');
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
  await page.goto(process.env.BENDER_LIVE_URL);
  await expect(page.locator('#projection-label')).toHaveText('PERSPECTIVA');
  await page.keyboard.press('5');await expect(page.locator('#projection-label')).toHaveText('ORTOGRÁFICA');
  await page.locator('#materials-tab').click();await expect(page.locator('[data-material="roughness"]')).toBeVisible();
  await expect(page.locator('.status')).toContainText('v0.2.1');
});

test('linear and circular copies can be undone as single actions', async ({page}) => {
  await page.goto('/bender-studio.html');await page.locator('#edit-menu').click();await page.locator('#array-open').click();
  await page.locator('#array-count').fill('3');await page.locator('#array-axis').selectOption('z');await page.locator('#array-distance').fill('1.5');await page.locator('#array-form button[type="submit"]').click();
  await expect(page.locator('#count')).toHaveText('4');let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects.map(o=>o.position[1])).toEqual([1,2.5,4,5.5]);
  await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('1');
  await page.locator('#edit-menu').click();await page.locator('#array-open').click();await page.locator('#array-mode').selectOption('radial');await page.locator('#array-count').fill('4');await page.locator('#array-radius').fill('3');await page.locator('#array-rotate').check();await page.locator('#array-form button[type="submit"]').click();
  await expect(page.locator('#count')).toHaveText('5');data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects[2].rotation).toBeCloseTo(-Math.PI/2);await page.locator('#undo').click();await expect(page.locator('#count')).toHaveText('1');
});

test('locks protect objects, survive reload and are undoable', async ({page}) => {
  await page.goto('/bender-studio.html');await page.locator('[data-lock="0"]').click();await expect(page.locator('#properties')).toContainText('Selecione um objeto');
  await page.locator('[data-index="0"]').click();await expect(page.locator('#properties')).toContainText('Selecione um objeto');
  await page.reload();await expect(page.locator('[data-lock="0"]')).toHaveAttribute('title','Desbloquear objeto');
  await page.locator('[data-lock="0"]').click();await page.locator('[data-index="0"]').click();await expect(page.locator('#object-name')).toHaveValue('Cubo');
});

test('scene environment and quick transforms persist and undo', async ({page}) => {
  await page.goto('/bender-studio.html');await page.locator('#environment-open').click();await page.locator('#environment-background').fill('#556677');await page.locator('#environment-ambient').fill('1');await page.locator('#environment-direct').fill('3');await page.locator('#environment-form button[type="submit"]').click();
  let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.environment).toMatchObject({background:'556677',ambient:1,direct:3,lightPosition:[4,4,2],lightColor:'ffffff',showLight:true});
  await page.locator('.advanced-transforms summary').click();await page.locator('[data-action="double"]').click();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.objects[0].scale).toEqual([4,4,4]);
  await page.locator('#undo').click();await page.locator('#undo').click();data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.environment.background).toBe('242628');
});


test('point light visibly illuminates the model and its settings persist', async ({page}) => {
  await page.goto('/bender-studio.html');await page.locator('#scene-light').click();await expect(page.locator('#light-properties')).toBeVisible();
  await page.locator('#light-properties').click();await page.locator('#environment-ambient').fill('0');await page.locator('#environment-direct').fill('0');await page.locator('#light-marker-visible').uncheck();await page.locator('#environment-form button[type="submit"]').click();
  await page.locator('[data-index="0"]').click();await page.waitForTimeout(300);const dark=await page.locator('canvas').screenshot();
  await page.locator('#environment-open').click();await page.locator('#environment-direct').fill('5');await page.locator('#environment-form button[type="submit"]').click();
  await page.waitForTimeout(300);const lit=await page.locator('canvas').screenshot();expect(dark.equals(lit)).toBe(false);
  await page.locator('#environment-open').click();await page.locator('#light-x').fill('2');await page.locator('#light-y').fill('1');await page.locator('#light-z').fill('3');await page.locator('#environment-light-color').fill('#ffcc99');await page.locator('#environment-form button[type="submit"]').click();
  let data=await page.evaluate(()=>JSON.parse(localStorage.getItem('bender-scene-v1')));expect(data.environment).toMatchObject({ambient:0,direct:5,lightPosition:[2,3,1],lightColor:'ffcc99',showLight:false});
  await page.reload();await page.locator('#environment-open').click();await expect(page.locator('#light-z')).toHaveValue('3');await expect(page.locator('#environment-direct')).toHaveValue('5');await expect(page.locator('#light-marker-visible')).not.toBeChecked();
});
