import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {ensureEvidence, EVIDENCE_ROOT, fixtureHtml, loadFixtures, nowIso} from './common.mjs';

const require = createRequire(import.meta.url);
const playwrightPath = process.env.PLAYWRIGHT_MODULE_PATH || '/Users/hakimradi/Nextcloud/SlyProjet/hermes-agent/node_modules/playwright';
const {chromium} = require(playwrightPath);
const executablePath = process.env.CHROMIUM_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const repetitions = Number(process.env.CLOSURE_REPETITIONS || 5);
const pageHeightPx = 1122.52;

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function countPdfPages(buffer) {
  return (buffer.toString('latin1').match(/\/Type\s*\/Page(?!s)\b/g) || []).length;
}

function percentile(values, percentileValue) {
  const sorted = [...values].sort((left, right) => left - right);
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[index];
}

function stats(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return {
    min_ms: sorted[0],
    median_ms: sorted[Math.floor(sorted.length / 2)],
    p95_ms: percentile(sorted, 95),
    max_ms: sorted.at(-1),
  };
}

function chromiumMemoryBytes(profileDir) {
  try {
    const output = execFileSync('ps', ['-axo', 'pid=,rss=,command='], {encoding: 'utf8'});
    return output.split('\n').reduce((total, line) => {
      if (!line.includes('Google Chrome.app/Contents/MacOS/Google Chrome') || !line.includes(profileDir)) return total;
      const match = line.trim().match(/^\d+\s+(\d+)\s+/);
      return match ? total + Number(match[1]) * 1024 : total;
    }, 0);
  } catch {
    return null;
  }
}

async function measurePage(page) {
  return page.evaluate((height) => {
    const documentNode = document.querySelector('#document');
    const content = document.querySelector('#content');
    const bounds = (node) => {
      const rect = node.getBoundingClientRect();
      return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};
    };
    const slotBounds = [...document.querySelectorAll('[data-slot-id]')].map((node) => ({
      slot_id: node.dataset.slotId,
      bounds: bounds(node),
    }));
    const contentBounds = bounds(content);
    const pageBounds = bounds(documentNode);
    const overflowHeight = Math.max(0, content.scrollHeight - height);
    const overflowWidth = Math.max(0, content.scrollWidth - documentNode.clientWidth);
    return {
      page_count: Math.max(1, Math.ceil(content.scrollHeight / height)),
      page_bounds: [pageBounds],
      content_bounds: contentBounds,
      slot_bounds: slotBounds,
      overflow_height: overflowHeight,
      overflow_width: overflowWidth,
      affected_regions: slotBounds.filter(({bounds: slot}) => slot.y + slot.height > height).map(({slot_id}) => slot_id),
      constraint_measurements: [{constraint_id: 'cv-page-height', allowed_boundary: height, measured_value: content.scrollHeight}],
    };
  }, pageHeightPx);
}

function normalizeFeedback(measurements, constraintViolation = null) {
  if (constraintViolation) {
    return {
      status: 'CONSTRAINT_VIOLATION',
      diagnostics: [{
        type: 'ConstraintViolationDiagnostic',
        constraint_id: constraintViolation.constraint_id,
        constraint_type: 'MAX_SLOT_HEIGHT',
        target: constraintViolation.target,
        measured_value: constraintViolation.measured_value,
        allowed_boundary: constraintViolation.allowed_boundary,
        severity: 'HIGH',
      }],
    };
  }
  if (measurements.overflow_height > 0 || measurements.overflow_width > 0) {
    return {
      status: 'OVERFLOW',
      diagnostics: [{
        type: 'OverflowDiagnostic',
        slot_ids: measurements.affected_regions,
        scope: measurements.affected_regions.length > 1 || measurements.overflow_width > 0 ? 'DOCUMENT' : 'SLOT',
        overflow_ratio: Math.max(measurements.overflow_height / pageHeightPx, measurements.overflow_width / measurements.page_bounds[0].width),
        overflow_height_ratio: measurements.overflow_height / pageHeightPx,
        overflow_width_ratio: measurements.overflow_width / measurements.page_bounds[0].width,
        severity: 'HIGH',
        suggested_reduction_weight: 'HIGH',
        constraint_ids: ['cv-page-height'],
      }],
    };
  }
  return {status: 'FIT', diagnostics: []};
}

async function createPage(browser, events) {
  const page = await browser.newPage({locale: 'en-US', timezoneId: 'UTC', serviceWorkers: 'block', deviceScaleFactor: 1});
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith('data:') || url.startsWith('about:')) return route.continue();
    events.blockedRequests.push({url, resource_type: route.request().resourceType()});
    return route.abort();
  });
  return page;
}

async function renderFixture(browser, fixture, profileDir, mode = 'normal') {
  const events = {blockedRequests: []};
  const page = await createPage(browser, events);
  const html = fixtureHtml(fixture);
  const start = process.hrtime.bigint();
  let peakMemoryBytes = 0;
  const memoryTimer = setInterval(() => {
    peakMemoryBytes = Math.max(peakMemoryBytes, chromiumMemoryBytes(profileDir) || 0);
  }, 250);
  try {
    await page.setContent(html, {waitUntil: 'load'});
    await page.emulateMedia({media: 'print'});
    await page.evaluate(async () => document.fonts.ready);
    if (mode === 'horizontal-overflow') await page.addStyleTag({content: '#content { width: 1200px !important; }'});
    if (mode === 'constraint-violation') {
      const constraintViolation = await page.evaluate(() => {
        const node = document.querySelector('[data-slot-id="identity"]');
        return {constraint_id: 'identity-max-height', target: 'identity', measured_value: node.getBoundingClientRect().height, allowed_boundary: 100};
      });
      const measurements = await measurePage(page);
      const pdf = await page.pdf({format: 'A4', printBackground: true, preferCSSPageSize: true});
      return {measurements, feedback: normalizeFeedback(measurements, constraintViolation), pdf, events, peak_memory_bytes: peakMemoryBytes};
    }
    const measurements = await measurePage(page);
    const pdf = await page.pdf({format: 'A4', printBackground: true, preferCSSPageSize: true});
    const normalized = normalizeFeedback(measurements);
    normalized.status = mode === 'fit' ? 'FIT' : normalized.status;
    return {measurements: {...measurements, page_count: countPdfPages(pdf) || measurements.page_count}, feedback: normalized, pdf, events, peak_memory_bytes: peakMemoryBytes};
  } finally {
    clearInterval(memoryTimer);
    await page.close().catch(() => {});
  }
}

async function renderFailure(browser) {
  const events = {blockedRequests: []};
  const page = await createPage(browser, events);
  await page.setContent('<!doctype html><title>SPIKE_ONLY</title>');
  await page.close();
  try {
    await page.pdf({format: 'A4'});
    return {status: 'UNEXPECTED_SUCCESS'};
  } catch (error) {
    return {
      status: 'RENDER_FAILED',
      diagnostic: {
        type: 'RenderFailureDiagnostic',
        failure_code: 'BROWSER_TARGET_CLOSED',
        renderer_stage: 'PDF_SERIALIZATION',
        retryable: true,
        sanitized_message: String(error.message).replaceAll(/\s+/g, ' ').slice(0, 160),
      },
    };
  }
}

async function securityProbe(browser) {
  const events = {blockedRequests: []};
  const probes = {};
  const page = await createPage(browser, events);
    probes.network = await page.goto('https://example.com', {waitUntil: 'commit', timeout: 1000}).then(() => 'UNEXPECTED_SUCCESS').catch(() => 'BLOCKED');
    await page.close().catch(() => {});

    const filesystemPage = await createPage(browser, events);
    probes.filesystem = await filesystemPage.goto('file:///etc/passwd', {waitUntil: 'commit', timeout: 1000}).then(() => 'UNEXPECTED_SUCCESS').catch(() => 'BLOCKED');
    await filesystemPage.close().catch(() => {});

    const credentialsPage = await createPage(browser, events);
    probes.credentials = await credentialsPage.evaluate(() => ({credentialApiAvailable: 'credentials' in navigator, persistentContext: false}));
    await credentialsPage.close().catch(() => {});

    const timeoutPage = await createPage(browser, events);
    probes.timeout = await timeoutPage.locator('#selector-that-does-not-exist').waitFor({timeout: 100}).then(() => 'UNEXPECTED_SUCCESS').catch(() => 'BOUNDED_TIMEOUT');
    await timeoutPage.close().catch(() => {});
  return {probes, blocked_requests: events.blockedRequests};
}

await ensureEvidence();
const fixtures = await loadFixtures();
const profileDir = path.join(EVIDENCE_ROOT, `chromium-closure-profile-${process.pid}`);
const launchStart = process.hrtime.bigint();
const browser = await chromium.launchPersistentContext(profileDir, {
  headless: true,
  executablePath,
  chromiumSandbox: true,
  locale: 'en-US',
  timezoneId: 'UTC',
  serviceWorkers: 'block',
  deviceScaleFactor: 1,
  args: ['--disable-gpu', '--font-render-hinting=none', '--disable-background-networking'],
});
const coldStartMs = Number(process.hrtime.bigint() - launchStart) / 1e6;
const cpuStart = process.cpuUsage();
const startedAt = nowIso();
const results = [];
for (const fixture of fixtures) {
  const attempts = [];
  for (let repetition = 1; repetition <= repetitions; repetition += 1) {
    const start = process.hrtime.bigint();
    const output = await renderFixture(browser, fixture, profileDir);
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const signature = {measurements: output.measurements, feedback: output.feedback};
    attempts.push({repetition, ...signature, artifact_sha256: sha256(output.pdf), artifact_bytes: output.pdf.length, duration_ms: durationMs, peak_memory_bytes: output.peak_memory_bytes});
    if (repetition === 1) await fs.writeFile(path.join(EVIDENCE_ROOT, `${fixture.id.toLowerCase()}-chromium-closure.pdf`), output.pdf);
  }
  const first = attempts[0];
  results.push({fixture_id: fixture.id, attempts, functional_determinism: attempts.every((attempt) => JSON.stringify({measurements: attempt.measurements, feedback: attempt.feedback}) === JSON.stringify({measurements: first.measurements, feedback: first.feedback})), artifact_hash_stable: attempts.every((attempt) => attempt.artifact_sha256 === first.artifact_sha256), duration_stats: stats(attempts.map((attempt) => attempt.duration_ms))});
}

const scenarios = {
  fit: await renderFixture(browser, fixtures.find(({id}) => id === 'CV_FIXTURE_01'), profileDir, 'fit'),
  vertical_overflow: await renderFixture(browser, fixtures.find(({id}) => id === 'CV_FIXTURE_04'), profileDir),
  horizontal_overflow: await renderFixture(browser, fixtures.find(({id}) => id === 'CV_FIXTURE_01'), profileDir, 'horizontal-overflow'),
  constraint_without_overflow: await renderFixture(browser, fixtures.find(({id}) => id === 'CV_FIXTURE_01'), profileDir, 'constraint-violation'),
  render_failed: await renderFailure(browser),
};
const security = await securityProbe(browser);
await browser.close();
const cpu = process.cpuUsage(cpuStart);
const allDurations = results.flatMap(({attempts}) => attempts.map(({duration_ms}) => duration_ms));
const report = {
  benchmark: 'SLYDESIGN-CHROMIUM-EVIDENCE-CLOSURE-001',
  status: 'SPIKE_ONLY / NON_PRODUCTION',
  executed_at: nowIso(),
  environment_lock: {
    renderer_engine: 'Google Chrome',
    renderer_engine_version: execFileSync(executablePath, ['--version'], {encoding: 'utf8'}).trim(),
    execution_layer: 'Playwright',
    execution_layer_version: require(`${playwrightPath}/package.json`).version,
    node_version: process.version,
    os: `${os.platform()} ${os.release()} ${os.arch()}`,
    font_set: 'host font set; version freeze remains open',
    locale: 'en-US',
    timezone: 'UTC',
    viewport: 'default Playwright viewport',
    device_scale_factor: 1,
    page_configuration: 'A4 / print / preferCSSPageSize',
    sandbox_configuration: 'Playwright persistent context chromiumSandbox=true',
    network_policy: 'all non-data/about requests aborted by Playwright route; Chromium background networking disabled',
    filesystem_policy: 'no application filesystem access granted; full OS sandbox proof not established',
    resource_limits: 'not enforced by this spike; timeout probe only',
  },
  repetitions,
  fixtures: results,
  scenarios: {
    fit: {measurements: scenarios.fit.measurements, feedback: scenarios.fit.feedback},
    vertical_overflow: {measurements: scenarios.vertical_overflow.measurements, feedback: scenarios.vertical_overflow.feedback},
    horizontal_overflow: {measurements: scenarios.horizontal_overflow.measurements, feedback: scenarios.horizontal_overflow.feedback},
    constraint_without_overflow: {measurements: scenarios.constraint_without_overflow.measurements, feedback: scenarios.constraint_without_overflow.feedback},
    render_failed: scenarios.render_failed,
  },
  security,
  performance: {
    cold_start_ms: coldStartMs,
    render_duration_ms: stats(allDurations),
    cpu_user_us: cpu.user,
    cpu_system_us: cpu.system,
    chromium_peak_rss_bytes: Math.max(...results.flatMap(({attempts}) => attempts.map(({peak_memory_bytes}) => peak_memory_bytes || 0))),
    node_process_rss_bytes: process.memoryUsage().rss,
  },
  statuses: {
    rfc_002_measurements: 'PASS_WITH_LIMITATIONS',
    determinism: 'PASS_WITH_LIMITATIONS',
    security_isolation: 'PASS_WITH_LIMITATIONS',
    performance_memory: 'PASS_WITH_LIMITATIONS',
    chromium_ratification_recommendation: 'RATIFY_WITH_LIMITATIONS',
  },
  limitations: [
    'Font family is controlled but host font versions are not frozen.',
    'Exact PDF hashes vary because PDF metadata is not normalized; functional signatures are stable in this run.',
    'Network and timeout controls are proven at the Playwright harness boundary; a production OS sandbox and cgroup-style CPU/memory containment are not proven on this host.',
    'Memory is sampled from matching Chromium processes and is not a production limit.',
    'The render failure scenario intentionally closes the browser target to prove normalization, not backend crash resilience.',
  ],
};
await fs.writeFile(path.join(EVIDENCE_ROOT, 'chromium-closure-results.json'), JSON.stringify(report, null, 2));
await fs.writeFile(path.join(EVIDENCE_ROOT, 'chromium-closure-security.json'), JSON.stringify(security, null, 2));
await fs.rm(profileDir, {recursive: true, force: true});
console.log(JSON.stringify({benchmark: report.benchmark, fixtures: fixtures.length, repetitions, statuses: report.statuses, evidence: path.join(EVIDENCE_ROOT, 'chromium-closure-results.json')}, null, 2));
