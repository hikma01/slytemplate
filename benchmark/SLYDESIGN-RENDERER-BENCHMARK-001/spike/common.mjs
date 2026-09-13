import fs from 'node:fs/promises';
import path from 'node:path';

export const BENCHMARK_ROOT = path.resolve(new URL('..', import.meta.url).pathname);
export const FIXTURE_PATH = path.join(BENCHMARK_ROOT, 'fixtures', 'fixtures.json');
export const EVIDENCE_ROOT = path.join(BENCHMARK_ROOT, 'evidence');

export async function loadFixtures() {
  return JSON.parse(await fs.readFile(FIXTURE_PATH, 'utf8'));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function repeatedText(fixture, index) {
  const suffix = fixture.specialCharacters
    ? ' — Élève, façade, naïf, Straße, 東京, Montréal, Łódź, résumé.'
    : '';
  return `Mission ${index + 1}: led measurable delivery, improved quality, and documented decisions for stakeholders.${suffix}`;
}

export function fixtureHtml(fixture) {
  const experiences = Array.from({length: fixture.experienceCount}, (_, index) => `
    <section class="slot experience-slot" data-slot-id="experience_${index + 1}">
      <h2>Experience ${index + 1}</h2>
      ${Array.from({length: fixture.paragraphsPerExperience}, (_, paragraph) => `<p>${escapeHtml(repeatedText(fixture, index + paragraph))}</p>`).join('')}
    </section>${fixture.pageBreakAfterExperience === index + 1 ? '<div class="page-break"></div>' : ''}`).join('');
  const skills = Array.from({length: fixture.skillCount}, (_, index) => `<li>Skill ${index + 1}${fixture.specialCharacters ? ' — sécurité & qualité' : ''}</li>`).join('');
  const education = Array.from({length: fixture.educationCount}, (_, index) => `<li>Education ${index + 1} — certification and continuing learning</li>`).join('');
  const constraintClass = fixture.targetOverflow ? ' constraint-target' : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(fixture.id)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: white; color: #17202a; }
    body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.32; }
    #document { width: 182mm; margin: 0 auto; }
    #content { min-height: 269mm; }
    header { border-bottom: 2px solid #17202a; padding-bottom: 5mm; margin-bottom: 5mm; }
    h1 { font-size: 22pt; margin: 0 0 2mm; }
    h2 { font-size: 12pt; margin: 4mm 0 1.5mm; color: #254b70; }
    h3 { font-size: 10pt; margin: 3mm 0 1mm; }
    p { margin: 0 0 2mm; }
    ul { margin: 0 0 3mm; padding-left: 5mm; }
    .columns { display: grid; grid-template-columns: 2fr 1fr; gap: 7mm; }
    .slot { break-inside: avoid; }
    .page-break { break-before: page; page-break-before: always; }
    .constraint-target { border-bottom: 2px solid #b42318; }
    .fixture-label { color: #667085; font-size: 8pt; }
  </style>
</head>
<body>
  <main id="document" data-fixture-id="${escapeHtml(fixture.id)}">
    <div id="content" class="${constraintClass.trim()}">
      <header class="slot" data-slot-id="identity">
        <div class="fixture-label">SPIKE_ONLY / NON_PRODUCTION — ${escapeHtml(fixture.label)}</div>
        <h1>${escapeHtml(fixture.name)}</h1>
        <div>${escapeHtml(fixture.title)}</div>
        <p>${escapeHtml(fixture.summary)}</p>
      </header>
      <div class="columns">
        <div>
          <section class="slot" data-slot-id="experience">
            <h2>Experience</h2>
            ${experiences}
          </section>
        </div>
        <aside>
          <section class="slot" data-slot-id="skills"><h2>Skills</h2><ul>${skills}</ul></section>
          <section class="slot" data-slot-id="education"><h2>Education</h2><ul>${education}</ul></section>
        </aside>
      </div>
    </div>
  </main>
</body>
</html>`;
}

export async function ensureEvidence() {
  await fs.mkdir(EVIDENCE_ROOT, {recursive: true});
}

export function nowIso() {
  return new Date().toISOString();
}
