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
