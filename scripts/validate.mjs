import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

// Tests only the static production export, served at a nested URL.
// The server and browser live inside this foreground command and always close.
const root = resolve(process.env.SITE_DIST || 'dist');
const artifacts = resolve(process.env.ARTIFACTS_DIR || 'artifacts');
await mkdir(artifacts, { recursive: true });
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!path.startsWith('/preview/')) { res.writeHead(404).end(); return; }
    const file = resolve(root, path.slice('/preview/'.length) || 'index.html');
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404).end('Not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const results = [];
const errors = [];
const resourceErrors = [];
let browser;
async function check(name, run) { await run(); results.push({ name, result: 'PASS' }); console.log(`PASS ${name}`); }
const delay = async (page) => { await page.waitForTimeout(80); };
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => resourceErrors.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) resourceErrors.push(`${response.status()} ${response.url()}`); });
  await page.goto(url, { waitUntil: 'networkidle' });
  const cards = page.locator('.feed-section .tweet-card');
  const search = page.getByRole('searchbox', { name: 'Search tweets' });
  const count = async () => cards.count();
  await check('Production export loads at /preview/ with six initial tweets', async () => { assert.equal(await count(), 6); assert.equal(await page.title(), 'IdentityMD — The community signal'); });
  await check('Local font and all rendered images load', async () => {
    assert.equal(await page.evaluate(() => document.fonts.check('400 16px "Manrope Variable"')), true);
    assert.equal(await page.locator('img').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0)), true);
  });
  await check('Desktop automated accessibility scan', async () => {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    await writeFile(resolve(artifacts, 'axe-desktop.json'), JSON.stringify({ violations: result.violations, incomplete: result.incomplete.map(i => ({ id: i.id, impact: i.impact, nodes: i.nodes.length })) }, null, 2));
    assert.deepEqual(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
  });
  await page.screenshot({ path: resolve(artifacts, 'desktop.png'), fullPage: true });
  await check('Keyboard skip link is visible and enters the feed', async () => {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Skip to tweets');
    await page.screenshot({ path: resolve(artifacts, 'keyboard-focus.png') });
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'feed');
  });
  await check('Search shortcut, matching query, empty state and reset', async () => {
    await page.keyboard.press('/'); assert.equal(await search.evaluate(e => e === document.activeElement), true);
    await search.fill('weekend'); assert.equal(await count(), 1);
    await search.fill('nothing-matches-this'); assert.equal(await count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Clear filters', exact: true }).count(), 1);
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click(); assert.equal(await count(), 6);
  });
  await check('Topic filters and time period compose', async () => {
    await page.getByRole('button', { name: 'Building', exact: true }).click(); assert.equal(await count(), 2);
    await page.getByLabel('Time period').selectOption('24h'); assert.equal(await count(), 1);
    await page.getByRole('button', { name: 'All tweets', exact: true }).click(); assert.equal(await count(), 6);
    await page.getByLabel('Time period').selectOption('all');
  });
  await check('Newest sorting and Latest navigation show the newest tweet first', async () => {
    await page.getByLabel('Sort tweets').selectOption('newest'); assert.equal(await cards.first().getAttribute('data-tweet-id'), 'signal-03');
    await page.getByRole('link', { name: 'Latest', exact: true }).click(); assert.equal(await cards.first().getAttribute('data-tweet-id'), 'signal-03');
    await page.getByRole('link', { name: 'Top tweets', exact: false }).first().click(); assert.equal(await cards.first().getAttribute('data-tweet-id'), 'signal-01');
  });
  await check('Most-liked sort and load more reveal all nine tweets', async () => {
    await page.getByLabel('Sort tweets').selectOption('likes'); assert.equal(await cards.first().getAttribute('data-tweet-id'), 'signal-01');
    await page.getByRole('button', { name: /Show more tweets/ }).click(); assert.equal(await count(), 9);
    assert.equal(await page.getByText('You’re all caught up. Stay curious, fren.').count(), 1);
  });
  await check('Save via keyboard persists across reload and can be removed', async () => {
    const save = cards.first().getByRole('button', { name: 'Save tweet by Pepe with a plan' });
    await save.focus(); await page.keyboard.press('Enter'); assert.equal(await save.getAttribute('aria-pressed'), 'true');
    await page.getByRole('link', { name: /Saved tweets/ }).click(); assert.equal(await count(), 1);
    await page.reload({ waitUntil: 'networkidle' }); assert.equal(await count(), 1);
    await cards.first().getByRole('button', { name: 'Unsave tweet by Pepe with a plan' }).click(); assert.equal(await count(), 0);
    assert.equal(await page.getByText('Your good-idea collection starts here.').count(), 1);
    await page.getByRole('button', { name: 'Explore top tweets' }).click(); assert.equal(await count(), 6);
  });
  await check('Trending topics and tweet hashtags filter the feed', async () => {
    await page.getByRole('button', { name: /#BuildInPublic Less talking/ }).click(); assert.equal(await count(), 2);
    await cards.first().getByRole('button', { name: '#IdentityMD', exact: true }).click(); assert.equal(await count(), 6);
    await search.fill('');
  });
  await check('Tweet dialog supports keyboard open, trapped focus, Escape and focus return', async () => {
    const trigger = cards.first().getByRole('button', { name: 'Read tweet by Pepe with a plan' });
    await trigger.focus(); await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'A little more context' }); await dialog.waitFor();
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]')), true); }
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); assert.equal(audit.violations.length, 0);
    await page.screenshot({ path: resolve(artifacts, 'dialog-focus.png') });
    await page.keyboard.press('Escape'); assert.equal(await dialog.isVisible(), false); assert.equal(await trigger.evaluate(e => e === document.activeElement), true);
  });
  await check('Share copies a working deep link', async () => {
    await cards.first().getByRole('button', { name: 'Share tweet by Pepe with a plan' }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText()); assert.equal(copied, `${url}#tweet=signal-01`);
    await page.goto(copied, { waitUntil: 'networkidle' }); await page.getByRole('dialog', { name: 'A little more context' }).waitFor();
    await page.keyboard.press('Escape');
  });
  await check('About dialog discloses fictional data and real X search links', async () => {
    await page.getByRole('button', { name: 'About this demo', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'A little signal. A lot of possibility.' }); await dialog.waitFor();
    assert.match(await dialog.textContent(), /fictional examples/);
    assert.match(await dialog.getByRole('link').getAttribute('href'), /^https:\/\/x.com\/search\?q=/);
    await page.keyboard.press('Escape');
  });
  await check('Back and forward navigation restore feed views', async () => {
    await page.getByRole('link', { name: 'Latest', exact: true }).click();
    await page.getByRole('link', { name: /Saved tweets/ }).click();
    await page.goBack(); await delay(page); assert.equal(await cards.first().getAttribute('data-tweet-id'), 'signal-03');
    await page.goForward(); await delay(page); assert.equal(await count(), 0);
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await check('Rendered semantic text and focus color pairs meet WCAG thresholds', async () => {
    const pairs = await page.evaluate(() => {
      const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
      const lum = color => rgb(color).map(n => { const v = n / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((a, n, i) => a + n * [.2126, .7152, .0722][i], 0);
      return [
        ['body text', '.tweet-copy', '.tweet-card', 4.5],
        ['muted author', '.author-info > span', '.tweet-card', 4.5],
        ['primary button', '.primary-button', '.primary-button', 4.5],
        ['selected filter', '.topic-filters .selected', '.topic-filters .selected', 4.5],
        ['page metadata', '.page-footer', 'body', 4.5],
        ['focus ring on surface', '.tweet-copy', '.tweet-card', 3],
      ].map(([name, front, back, threshold]) => {
        const fg = name.startsWith('focus') ? getComputedStyle(document.documentElement).getPropertyValue('--color-focus') : getComputedStyle(document.querySelector(front)).color;
        const probe = document.createElement('span'); probe.style.color = fg; document.body.append(probe); const foreground = getComputedStyle(probe).color; probe.remove();
        let el = document.querySelector(back), background;
        while (el) { background = getComputedStyle(el).backgroundColor; if (background !== 'rgba(0, 0, 0, 0)') break; el = el.parentElement; }
        const a = lum(foreground), b = lum(background);
        return { name, foreground, background, ratio: Number(((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2)), threshold };
      });
    });
    await writeFile(resolve(artifacts, 'contrast.json'), JSON.stringify(pairs, null, 2));
    pairs.forEach(pair => assert.ok(pair.ratio >= pair.threshold, `${pair.name}: ${pair.ratio}`));
  });
  for (const width of [1440, 1024, 768, 590, 390, 320]) {
    await check(`Responsive reflow at ${width}px; no horizontal overflow`, async () => {
      await page.setViewportSize({ width, height: 900 }); await page.evaluate(() => window.scrollTo(0, 0)); await delay(page);
      const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
      assert.ok(dimensions.scroll <= dimensions.viewport, JSON.stringify(dimensions));
      assert.equal(await cards.first().isVisible(), true);
      if ([1024, 390, 320].includes(width)) await page.screenshot({ path: resolve(artifacts, `viewport-${width}.png`), fullPage: true });
    });
  }
  await check('Tablet icon navigation retains names and passes accessibility scan', async () => {
    await page.setViewportSize({ width: 768, height: 900 });
    for (const name of ['Top tweets', 'Latest', 'Saved tweets']) assert.equal(await page.getByRole('link', { name, exact: true }).count(), 1);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    await writeFile(resolve(artifacts, 'axe-tablet.json'), JSON.stringify({ violations: audit.violations, incomplete: audit.incomplete.map(i => ({ id: i.id, impact: i.impact, nodes: i.nodes.length })) }, null, 2));
    assert.equal(audit.violations.length, 0);
  });
  await check('Mobile search, filter, bookmark and dialog interactions', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(artifacts, 'mobile-first-screen.png') });
    await page.locator('#feed').evaluate(e => e.scrollIntoView({block: 'start'}));
    await page.screenshot({ path: resolve(artifacts, 'mobile-feed.png') });
    await page.getByRole('button', { name: 'AI agents', exact: true }).click(); assert.equal(await count(), 2);
    await search.fill('small files'); assert.equal(await count(), 1);
    await cards.first().getByRole('button', { name: 'Save tweet by neural fren' }).click();
    await cards.first().getByRole('button', { name: 'Read tweet by neural fren' }).click();
    assert.equal(await page.getByRole('dialog').isVisible(), true);
    await page.getByRole('button', { name: 'Close tweet', exact: true }).click();
    await page.getByRole('link', { name: /Saved tweets/ }).click(); assert.equal(await count(), 1);
  });
  await check('Mobile saved state automated accessibility scan', async () => {
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    await writeFile(resolve(artifacts, 'axe-mobile.json'), JSON.stringify({ violations: audit.violations, incomplete: audit.incomplete.map(i => ({ id: i.id, impact: i.impact, nodes: i.nodes.length })) }, null, 2));
    assert.equal(audit.violations.length, 0);
  });
  await check('200% root-font enlargement reflows at 768px (rem-sized text only)', async () => {
    await page.setViewportSize({ width: 768, height: 900 }); await page.goto(url); await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  });
  await check('Reduced motion disables button transitions', async () => { assert.equal(await page.locator('.primary-button').evaluate(e => getComputedStyle(e).transitionDuration), '0s'); });
  await check('Clipboard denial has a selectable link fallback', async () => {
    const fallback = await browser.newContext(); const p = await fallback.newPage();
    await p.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('Blocked')) } }); });
    await p.goto(url); await p.locator('.feed-section .tweet-card').first().getByRole('button', { name: 'Share tweet by Pepe with a plan' }).click();
    await p.getByLabel('Copy this tweet link').waitFor(); assert.match(await p.getByLabel('Copy this tweet link').inputValue(), /#tweet=signal-01$/);
    await fallback.close();
  });
  await check('Unavailable storage keeps bookmarks in-session with a warning', async () => {
    const fallback = await browser.newContext(); const p = await fallback.newPage();
    await p.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage disabled'); }; });
    await p.goto(url); await p.locator('.feed-section .tweet-card').first().getByRole('button', { name: 'Save tweet by Pepe with a plan' }).click();
    assert.match(await p.getByRole('alert').textContent(), /Saved tweets will last until you leave/);
    await p.getByRole('link', { name: /Saved tweets/ }).click(); assert.equal(await p.locator('.feed-section .tweet-card').count(), 1);
    await fallback.close();
  });
  await check('Malformed saved data recovers without breaking the feed', async () => {
    const fallback = await browser.newContext(); const p = await fallback.newPage();
    await p.addInitScript(() => localStorage.setItem('identitymd-saved-v1', '{invalid'));
    await p.goto(url); assert.equal(await p.locator('.feed-section .tweet-card').count(), 6); await fallback.close();
  });
  await check('Site requires no third-party runtime network', async () => {
    await page.route('**/*', route => route.request().url().startsWith(url) ? route.continue() : route.abort());
    await page.reload({ waitUntil: 'networkidle' }); assert.equal(await count(), 6);
    assert.equal(await page.locator('img').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0)), true);
  });
  await check('No browser console, page or resource errors', async () => { assert.deepEqual(errors, []); assert.deepEqual(resourceErrors, []); });
  console.log(`\n${results.length} checks passed.`);
} catch (error) {
  results.push({ result: 'FAIL', message: error.stack });
  console.error(error); process.exitCode = 1;
} finally {
  await writeFile(resolve(artifacts, 'interaction-results.json'), JSON.stringify({ date: new Date().toISOString(), testedExport: 'dist/ served at /preview/', results, consoleErrors: errors, resourceErrors }, null, 2));
  await browser?.close(); await new Promise(r => server.close(r));
}
