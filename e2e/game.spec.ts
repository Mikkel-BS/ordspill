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
  await page.goto('./'); await createPlayer(page, 'Ada');
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
  await page.goto('./'); await createPlayer(page,'Mia');
  await page.getByRole('button',{ name:'Færre bokstaver' }).click();
  await expect(page.getByText('Nå vises bare bokstaver som er med i ordet.')).toBeVisible();
  await expect(page.getByRole('button',{ name:'A',exact:true })).toHaveCount(0);
  await page.reload(); await page.getByRole('button',{ name:/Mia.*0 ord funnet/ }).click();
  await expect(page.getByText('Nå vises bare bokstaver som er med i ordet.')).toBeVisible();
  await enterWord(page,'SOL'); await expect(page.getByRole('heading',{ name:'Du fant sol!' })).toBeVisible();
});
test('full Norwegian keyboard supports Æ Ø Å and symbol feedback', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.setItem('ordreise:profiles:v1',JSON.stringify([{id:'test',nickname:'Ola',avatar:0,currentLevel:2,discoveredWords:[],puzzleHistory:[],activePuzzle:{wordId:'nb-båt',guesses:[],hints:[],solved:false}}])));
  await page.reload(); await page.getByRole('button',{name:/Ola.*0 ord funnet/}).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const letter of ['Æ','Ø','Å']) await expect(page.getByRole('button',{name:letter,exact:true})).toBeEnabled();
  await enterWord(page,'BIL'); await expect(page.getByLabel('B: Riktig plass',{exact:true})).toContainText('✓');
  await enterWord(page,'BÅT'); await expect(page.getByRole('heading',{name:'Du fant båt!'})).toBeVisible();
});
test('works offline after the app shell is installed', async ({ page, context }) => {
  await page.goto('./'); await createPlayer(page,'Iben');
  await page.getByRole('button',{name:'Se et bilde'}).click();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange',()=>resolve(),{once:true})); });
  const keys = await page.evaluate(async () => { const cache = await caches.open('ordreise-v1'); return (await cache.keys()).map(r => r.url); });
  expect(keys.some(url => url.endsWith('.js'))).toBe(true);
  expect(keys.some(url => url.endsWith('.css'))).toBe(true);
  page.on('pageerror', error => console.log('OFFLINE PAGE ERROR', error.message));
  page.on('console', msg => { if (msg.type() === 'error') console.log('OFFLINE CONSOLE', msg.text()); });
  await context.setOffline(true); await page.reload();
  await page.getByRole('button',{name:/Iben.*0 ord funnet/}).click();
  await expect(page.getByRole('complementary', { name: 'Temaspor' })).toContainText('Tema: Vær og himmel');
  await enterWord(page,'SOL'); await expect(page.getByRole('heading',{name:'Du fant sol!'})).toBeVisible();
  await expect(page.getByText('Sola skinner på huset.')).toBeVisible();
});

test('theme follows the word through play, discovery and collection without counting as a hint', async ({ page }) => {
  await page.goto('./'); await createPlayer(page, 'Liv');
  const clue = page.getByRole('complementary', { name: 'Temaspor' });
  await expect(clue).toContainText('Tema: Vær og himmel');
  await expect(clue).toContainText('Vi leter etter noe vi kan se ute eller på himmelen.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await enterWord(page, 'BIL'); // Valid guesses may come from a different theme.
  await expect(page.getByRole('log')).toContainText('B');
  await enterWord(page, 'SOL');
  await expect(page.getByRole('heading', { name: 'Du fant sol!' })).toBeVisible();
  await expect(page.locator('.discovery .theme-tag')).toHaveText('🌤️ Tema: Vær og himmel');
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('ordreise:profiles:v1')!)[0].puzzleHistory);
  expect(history[0].independent).toBe(true); expect(history[0].hints).toEqual([]);
  await page.getByRole('button', { name: 'Neste oppdagelse' }).click();
  await expect(clue).toContainText('Tema: Byen');
  await page.reload(); await page.getByRole('button', { name: /Liv.*1 ord funnet/ }).click();
  await expect(clue).toContainText('Tema: Byen');
  await page.getByRole('button', { name: 'Min ordbok' }).click();
  await expect(page.getByRole('button', { name: /SOL/ })).toContainText('Tema: Vær og himmel');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    console.log('FAILURE DOM', await page.locator('body').innerText().catch(() => 'unavailable'));
    console.log('KEY GEOMETRY', await page.locator('.key').evaluateAll(elements => elements.map(e => ({letter:e.getAttribute('aria-label'),rect:e.getBoundingClientRect().toJSON()}))).catch(() => []));
  }
});

test('accepts SNU as a real Norwegian guess', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.setItem('ordreise:profiles:v1',JSON.stringify([{id:'snu-test',nickname:'Siri',avatar:0,currentLevel:1,discoveredWords:[],puzzleHistory:[],activePuzzle:{wordId:'nb-hus',guesses:[],hints:[],solved:false}}])));
  await page.reload(); await page.getByRole('button',{name:/Siri.*0 ord funnet/}).click();
  await enterWord(page,'SNU');
  await expect(page.getByRole('log')).toContainText('S');
  await expect(page.getByText('Nye spor! Se på bokstavene og prøv igjen.')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ordreise:profiles:v1')!)[0].activePuzzle.guesses)).toEqual(['SNU']);
});
