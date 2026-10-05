import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
async function createPlayer(page: Page, name: string) {
  await page.getByLabel('Hva vil du bli kalt?').fill(name);
  await page.getByRole('button', { name: 'La oss utforske' }).click();
  await expect(page.getByRole('heading', { name: `Hei, ${name}!` })).toBeVisible();
}
async function enterWord(page: Page, word: string) {
  for (const letter of word) await page.getByRole('button', { name: new RegExp(`^${letter}(,|$)`) }).click();
  await page.getByRole('button', { name: 'Prøv ordet' }).click();
}
test('solve, discover meaning, collect, and isolate children', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await createPlayer(page, 'Ada');
  await enterWord(page, 'BIL');
  await expect(page.getByRole('log')).toContainText('B');
  await page.getByRole('button', { name: 'Se et bilde' }).click();
  await page.getByRole('button', { name: 'Første bokstav' }).click();
  await expect(page.getByText('Første bokstav er')).toBeVisible();
  await enterWord(page, 'SOL');
  await expect(page.getByRole('heading', { name: 'Du fant sol!' })).toBeVisible();
  await expect(page.getByText('Sola skinner på huset.')).toBeVisible();
  await page.getByRole('button', { name: 'Vil du klappe stavelsene?' }).click();
  await page.getByRole('button', { name: '1 klapp' }).click();
  await expect(page.getByText('Ja! Du hørte stavelsene.')).toBeVisible();
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('ordreise:profiles:v1')!)[0].puzzleHistory);
  expect(history[0].independent).toBe(false); expect(history[0].hints).toEqual(['picture', 'first-letter']);
  await page.getByRole('button', { name: 'Min ordbok' }).click();
  await expect(page.getByRole('button', { name: /SOL/ })).toBeVisible();
  await page.getByRole('button', { name: /Ada/ }).click(); await createPlayer(page, 'Ben');
  await page.getByRole('button', { name: 'Min ordbok' }).click();
  await expect(page.getByText('Ordboka di venter på sitt første ord.')).toBeVisible();
  await page.reload(); await page.getByRole('button', { name: /Ada.*1 ord funnet/ }).click();
  await page.getByRole('button', { name: 'Min ordbok' }).click();
  await expect(page.getByRole('button', { name: /SOL/ })).toBeVisible();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('resumes hints and removes impossible letters without losing answer letters', async ({ page }) => {
  await page.goto('/'); await createPlayer(page,'Mia');
  await page.getByRole('button',{ name:'Færre bokstaver' }).click();
  await expect(page.getByText('Nå vises bare bokstaver som er med i ordet.')).toBeVisible();
  await expect(page.getByRole('button',{ name:'A',exact:true })).toBeDisabled();
  await page.reload(); await page.getByRole('button',{ name:/Mia.*0 ord funnet/ }).click();
  await expect(page.getByText('Nå vises bare bokstaver som er med i ordet.')).toBeVisible();
  await enterWord(page,'SOL'); await expect(page.getByRole('heading',{ name:'Du fant sol!' })).toBeVisible();
});
test('full Norwegian keyboard supports Æ Ø Å and symbol feedback', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('ordreise:profiles:v1',JSON.stringify([{id:'test',nickname:'Ola',avatar:0,currentLevel:2,discoveredWords:[],puzzleHistory:[],activePuzzle:{wordId:'nb-båt',guesses:[],hints:[],solved:false}}])));
  await page.reload(); await page.getByRole('button',{name:/Ola.*0 ord funnet/}).click();
  for (const letter of ['Æ','Ø','Å']) await expect(page.getByRole('button',{name:letter,exact:true})).toBeEnabled();
  await enterWord(page,'BIL'); await expect(page.getByLabel('B: Riktig plass',{exact:true})).toContainText('✓');
  await enterWord(page,'BÅT'); await expect(page.getByRole('heading',{name:'Du fant båt!'})).toBeVisible();
});
test('works offline after the app shell is installed', async ({ page, context }) => {
  await page.goto('/'); await createPlayer(page,'Iben');
  await page.getByRole('button',{name:'Se et bilde'}).click();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange',()=>resolve(),{once:true})); });
  await context.setOffline(true); await page.reload();
  await page.getByRole('button',{name:/Iben.*0 ord funnet/}).click();
  await enterWord(page,'SOL'); await expect(page.getByRole('heading',{name:'Du fant sol!'})).toBeVisible();
  await expect(page.getByText('Sola skinner på huset.')).toBeVisible();
});
