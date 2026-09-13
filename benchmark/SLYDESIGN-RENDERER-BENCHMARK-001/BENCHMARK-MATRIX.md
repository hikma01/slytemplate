# SlyDesign Renderer Benchmark Matrix

> **SPIKE_ONLY / NON_PRODUCTION** — `SLYDESIGN-RENDERER-BENCHMARK-001`

This matrix reuses the criteria and weights ratified in ADR-SLYDESIGN-001. It
does not introduce a new scoring method. Scores use the ADR scale `0..5` and
the aggregate formula `sum(weight × score / 5)`.

## Candidate stacks

| Candidate | Architectural role | Evidence |
|---|---|---|
| Chromium Headless + Playwright | Rendering engine + execution layer | `evidence/chromium-results.json` |
| Paged.js + Chromium Headless + Playwright | Pagination layer + rendering/execution stack | `evidence/pagedjs-results.json` |
| WeasyPrint | Alternative document renderer | `evidence/weasyprint-results.json` |

Playwright is not scored as a competing rendering engine. Puppeteer was not
run because it occupies the same execution-layer role for this benchmark.

## Weighted results

| Criterion | Weight | Expected | Chromium | Paged.js | WeasyPrint |
|---|---:|---|---:|---:|---:|
| PDF generation | 10 | PDF for every valid fixture | 5 | 5 | 4 |
| CV pagination | 12 | Stable multi-page CV pagination | 4 | 4 | 3 |
| HTML/CSS capability | 10 | Expressive CV composition | 5 | 5 | 3 |
| Headless execution | 6 | Repeatable unattended execution | 5 | 5 | 4 |
| Overflow measurement | 10 | RFC-002 geometry and overflow | 4 | 2 | 1 |
| Constraint measurement | 8 | Normalized constraint measurements | 2 | 1 | 1 |
| Typography/fonts | 8 | Controlled typography and font handling | 4 | 4 | 4 |
| Deterministic rendering | 10 | Functional repeatability under locked inputs | 3 | 3 | 1 |
| Security/isolation | 8 | Enforceable process/network/filesystem controls | 2 | 2 | 2 |
| Automated testability | 6 | Scriptable evidence and diagnostics | 4 | 4 | 3 |
| Performance | 4 | Measurable render duration and CPU | 3 | 3 | 4 |
| Memory footprint | 3 | Measurable bounded memory | 2 | 2 | 4 |
| Operational simplicity | 2 | Manageable runtime operations | 3 | 2 | 4 |
| Backend isolation | 1 | Adapter behind public contract | 3 | 3 | 3 |
| Backend replaceability | 1 | Replaceable without DTO changes | 4 | 3 | 4 |
| Future multi-format potential | 1 | Extensible without V1 scope expansion | 4 | 4 | 3 |
| **Weighted aggregate / 100** | **100** |  | **74.20** | **68.00** | **54.00** |

The numeric result is not sufficient for selection. RFC-001, RFC-002 and the
ADR define hard architectural gates.

## Observed evidence and limitations

| Criterion | Chromium | Paged.js | WeasyPrint |
|---|---|---|---|
| Fixtures | 6/6, three repetitions | 6/6, three repetitions | 6/6 attempted; 5 success, 1 failure |
| PDF/pages | 1, 2, 4, 10, 1, 3 pages | 1, 2, 4, 4, 1, 3 pages | 1, failure, 3, 10, 1, 2 pages |
| Geometry | Page, content, slot bounds; height/width overflow; affected regions | Page and slot bounds; normalized overflow unavailable | Page count/bounds only; slot and overflow unavailable |
| Constraint diagnostics | Fixture measurements present, no isolated constraint-failure run | Constraint measurements unavailable | Constraint measurements unavailable |
| Render failure | Not injected as a dedicated fixture | Not injected as a dedicated fixture | `CV_FIXTURE_02` produced an `AssertionError` |
| Determinism | Functional measurements/bytes stable; PDF hashes unstable | Functional measurements/bytes stable; PDF hashes unstable | Repetition evidence not collected |
| Security | Network blocked by harness; full sandbox proof absent | Network blocked by harness; full sandbox proof absent | No external resources supplied; full sandbox proof absent |
| Main limitation | Fonts not frozen; constraint/failure classification incomplete | Insufficient RFC-002 overflow/constraint normalization | Common fixture failure and insufficient RFC-002 measurements |

## Hard-gate result

| Candidate | RFC-002 measurement sufficiency | V1 eligibility |
|---|---|---|
| Chromium | Partial: strong overflow/geometry evidence, missing isolated constraint and backend-failure exercises | Not ratified |
| Paged.js | No normalized overflow/constraint evidence | Architecturally insufficient for current V1 evidence |
| WeasyPrint | No slot/overflow evidence; one common-fixture failure | Architecturally insufficient for current V1 evidence |

No candidate is ratified by this spike. Follow-up evidence is required before
`V1_CV_BACKEND` can be selected.
