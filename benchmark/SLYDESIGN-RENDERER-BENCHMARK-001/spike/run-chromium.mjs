import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {ensureEvidence, EVIDENCE_ROOT, fixtureHtml, loadFixtures, nowIso} from './common.mjs';

const require = createRequire(import.meta.url);
const playwrightPath = process.env.PLAYWRIGHT_MODULE_PATH || '/Users/hakimradi/Nextcloud/SlyProjet/hermes-agent/node_modules/playwright';
const {chromium} = require(playwrightPath);
const executablePath = process.env.CHROMIUM_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const repetitions = Number(process.env.DETERMINISM_REPETITIONS || 3);

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function countPdfPages(buffer) {
  const text = buffer.toString('latin1');
  return (text.match(/\/Type\s*\/Page(?!s)\b/g) || []).length;
}

async function measurePage(page) {
  return page.evaluate(() => {
    const content = document.querySelector('#content');
    const documentNode = document.querySelector('#document');
    const bounds = (node) => {
      const rect = node.getBoundingClientRect();
      return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};
    };
    const slotBounds = [...document.querySelectorAll('[data-slot-id]')].map((node) => ({
      slot_id: node.dataset.slotId,
      bounds: bounds(node),
    }));
    const pageHeightPx = 1122.52;
    const contentBounds = bounds(content);
    const pageBounds = bounds(documentNode);
    return {
      page_count: Math.max(1, Math.ceil(content.scrollHeight / pageHeightPx)),
      page_bounds: [pageBounds],
      content_bounds: contentBounds,
      slot_bounds: slotBounds,
      overflow_height: Math.max(0, content.scrollHeight - pageHeightPx),
      overflow_width: Math.max(0, content.scrollWidth - documentNode.clientWidth),
      affected_regions: slotBounds.filter(({bounds: slot}) => slot.y + slot.height > pageHeightPx).map(({slot_id}) => slot_id),
      constraint_measurements: [{constraint_id: 'cv-page-height', allowed: pageHeightPx, measured: content.scrollHeight}],
    };
  });
}

async function runFixture(browser, fixture) {
  const attempts = [];
  for (let repetition = 1; repetition <= repetitions; repetition += 1) {
    const page = await browser.newPage({
      locale: 'en-US',
      timezoneId: 'UTC',
      serviceWorkers: 'block',
    });
    await page.route('**/*', async (route) => {
      if (route.request().url().startsWith('data:') || route.request().url().startsWith('about:')) return route.continue();
      return route.abort();
    });
    const html = fixtureHtml(fixture);
    const start = process.hrtime.bigint();
    await page.setContent(html, {waitUntil: 'load'});
    await page.emulateMedia({media: 'print'});
    await page.evaluate(async () => document.fonts.ready);
    const measurements = await measurePage(page);
    const pdf = await page.pdf({format: 'A4', printBackground: true, preferCSSPageSize: true});
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    attempts.push({
      repetition,
      measurements: {...measurements, page_count: countPdfPages(pdf) || measurements.page_count},
      artifact_sha256: sha256(pdf),
      artifact_bytes: pdf.length,
      duration_ms: durationMs,
    });
    if (repetition === 1) {
      await fs.writeFile(path.join(EVIDENCE_ROOT, `${fixture.id.toLowerCase()}-chromium.pdf`), pdf);
    }
    await page.close();
  }
  const first = attempts[0];
  const functionalDeterminism = attempts.every((attempt) => JSON.stringify(attempt.measurements) === JSON.stringify(first.measurements) && attempt.artifact_bytes === first.artifact_bytes);
  const artifactHashStable = attempts.every((attempt) => attempt.artifact_sha256 === first.artifact_sha256);
  return {fixture_id: fixture.id, repetitions: attempts, functional_determinism: functionalDeterminism, artifact_hash_stable: artifactHashStable};
}

await ensureEvidence();
const fixtures = await loadFixtures();
const cpuStart = process.cpuUsage();
const start = process.hrtime.bigint();
const browser = await chromium.launch({headless: true, executablePath, args: ['--disable-gpu', '--font-render-hinting=none']});
const results = [];
for (const fixture of fixtures) results.push(await runFixture(browser, fixture));
await browser.close();
const cpu = process.cpuUsage(cpuStart);
const report = {
  benchmark: 'SLYDESIGN-RENDERER-BENCHMARK-001',
  stack: 'chromium-headless + playwright-execution-layer',
  status: 'SPIKE_ONLY / NON_PRODUCTION',
  executed_at: nowIso(),
  environment: {
    renderer_engine: 'Google Chrome',
    renderer_engine_version: (await import('node:child_process')).execFileSync(executablePath, ['--version'], {encoding: 'utf8'}).trim(),
    execution_layer: 'Playwright',
    execution_layer_version: require(`${playwrightPath}/package.json`).version,
    font_set: 'host font set, not yet frozen',
    locale: 'en-US',
    timezone: 'UTC',
    network_policy: 'blocked by route interception',
    page_configuration: 'A4 / print / preferCSSPageSize',
  },
  aggregate: {duration_ms: Number(process.hrtime.bigint() - start) / 1e6, cpu_user_us: cpu.user, cpu_system_us: cpu.system, memory_peak_unavailable: true},
  results,
  limitations: ['process peak memory was not sampled by this first harness', 'font set is not yet frozen', 'slot bounds are DOM measurements normalized by the spike adapter'],
};
await fs.writeFile(path.join(EVIDENCE_ROOT, 'chromium-results.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({stack: report.stack, fixtures: results.length, functional_deterministic: results.every((result) => result.functional_determinism), artifact_hash_stable: results.every((result) => result.artifact_hash_stable), evidence: path.join(EVIDENCE_ROOT, 'chromium-results.json')}, null, 2));
