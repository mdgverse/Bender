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
