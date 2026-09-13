import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {ensureEvidence, EVIDENCE_ROOT, fixtureHtml, loadFixtures, nowIso} from './common.mjs';

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || '/Users/hakimradi/Nextcloud/SlyProjet/hermes-agent/node_modules/playwright');
const executablePath = process.env.CHROMIUM_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const pagedPolyfill = path.resolve(new URL('../node_modules/pagedjs/dist/paged.polyfill.js', import.meta.url).pathname);
const repetitions = Number(process.env.DETERMINISM_REPETITIONS || 3);

function sha256(buffer) { return createHash('sha256').update(buffer).digest('hex'); }

async function renderFixture(browser, fixture) {
  const attempts = [];
  for (let repetition = 1; repetition <= repetitions; repetition += 1) {
    const page = await browser.newPage({locale: 'en-US', timezoneId: 'UTC', serviceWorkers: 'block'});
    await page.route('**/*', async (route) => route.abort());
    await page.setContent(fixtureHtml(fixture), {waitUntil: 'load'});
    await page.addScriptTag({path: pagedPolyfill});
    await page.waitForFunction(() => document.querySelectorAll('.pagedjs_page').length > 0, null, {timeout: 10000});
    const measurements = await page.evaluate(() => {
      const pages = [...document.querySelectorAll('.pagedjs_page')];
      const bounds = (node) => { const rect = node.getBoundingClientRect(); return {x: rect.x, y: rect.y, width: rect.width, height: rect.height}; };
      return {
        page_count: pages.length,
        page_bounds: pages.map(bounds),
        content_bounds: document.querySelector('#content') ? bounds(document.querySelector('#content')) : null,
        slot_bounds: [...document.querySelectorAll('[data-slot-id]')].map((node) => ({slot_id: node.dataset.slotId, bounds: bounds(node)})),
        overflow_height: null,
        overflow_width: null,
        affected_regions: [],
        constraint_measurements: [],
      };
    });
    const started = process.hrtime.bigint();
    const pdf = await page.pdf({format: 'A4', printBackground: true, preferCSSPageSize: true});
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    attempts.push({repetition, measurements, artifact_sha256: sha256(pdf), artifact_bytes: pdf.length, duration_ms: durationMs});
    if (repetition === 1) await fs.writeFile(path.join(EVIDENCE_ROOT, `${fixture.id.toLowerCase()}-pagedjs.pdf`), pdf);
    await page.close();
  }
  const first = attempts[0];
  return {
    fixture_id: fixture.id,
    repetitions: attempts,
    functional_determinism: attempts.every((attempt) => JSON.stringify(attempt.measurements) === JSON.stringify(first.measurements) && attempt.artifact_bytes === first.artifact_bytes),
    artifact_hash_stable: attempts.every((attempt) => attempt.artifact_sha256 === first.artifact_sha256),
  };
}

await ensureEvidence();
const browser = await chromium.launch({headless: true, executablePath, args: ['--disable-gpu', '--font-render-hinting=none']});
const results = [];
for (const fixture of await loadFixtures()) {
  try { results.push(await renderFixture(browser, fixture)); }
  catch (error) { results.push({fixture_id: fixture.id, status: 'RENDER_FAILED', failure_type: error.name, sanitized_message: String(error.message).slice(0, 240)}); }
}
await browser.close();
const report = {
  benchmark: 'SLYDESIGN-RENDERER-BENCHMARK-001',
  stack: 'pagedjs-pagination + chromium-headless + playwright-execution-layer',
  status: 'SPIKE_ONLY / NON_PRODUCTION',
  executed_at: nowIso(),
  environment: {renderer_engine: 'Google Chrome', execution_layer: 'Playwright', pagination_layer: 'Paged.js', locale: 'en-US', timezone: 'UTC', network_policy: 'blocked by route interception'},
  results,
  limitations: ['Paged.js pagination measurements do not yet normalize overflow fields into RFC-002 diagnostics'],
};
await fs.writeFile(path.join(EVIDENCE_ROOT, 'pagedjs-results.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({stack: report.stack, fixtures: results.length, functional_deterministic: results.every((result) => result.functional_determinism), artifact_hash_stable: results.every((result) => result.artifact_hash_stable), evidence: path.join(EVIDENCE_ROOT, 'pagedjs-results.json')}, null, 2));
