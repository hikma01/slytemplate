# SlyDesign Renderer V1 CV Benchmark Report

> **SPIKE_ONLY / NON_PRODUCTION** — `SLYDESIGN-RENDERER-BENCHMARK-001`

## Executive result

```text
BENCHMARK_STATUS = PASS_WITH_LIMITATIONS
V1_BACKEND_RECOMMENDATION = NONE
DECISION_CONFIDENCE = LOW
PRODUCTION_CODE_MODIFIED = NO
```

The benchmark executed three coherent stacks against six common CV fixtures.
Chromium produced the strongest RFC-002 geometry evidence, but the benchmark
did not establish all hard gates. Paged.js and WeasyPrint do not currently
provide sufficient normalized overflow/constraint evidence for V1 selection.
The numerical matrix therefore remains evidence, not an automatic decision.

## Scope and candidates

| Candidate stack | Executed |
|---|---|
| Chromium Headless + Playwright execution layer | Yes |
| Paged.js + Chromium Headless + Playwright | Yes |
| WeasyPrint | Yes |

Playwright was treated as an execution layer, not as a competing rendering
engine. No production SlyDesign integration, public-contract change, node
model, RFC modification or Phase 2 work was performed.

## Fixtures

All stacks received the same generated fixture definitions from
`fixtures/fixtures.json`:

| Fixture | Intended coverage |
|---|---|
| `CV_FIXTURE_01` | Short, one page |
| `CV_FIXTURE_02` | Standard, two pages |
| `CV_FIXTURE_03` | Dense content |
| `CV_FIXTURE_04` | Extreme content and overflow pressure |
| `CV_FIXTURE_05` | Accents, special characters and Unicode |
| `CV_FIXTURE_06` | Measurable constraint pressure |

The shared generators are in `spike/`. No backend-specific content
optimization was applied.

## Observed results

### Chromium Headless + Playwright

- All six fixtures executed three times.
- Functional measurements and PDF bytes were stable across repetitions.
- Exact PDF hashes were not stable, consistent with variable PDF metadata such
  as creation timestamps; this is an unresolved artifact-equivalence issue.
- The adapter produced page bounds, content bounds, slot bounds, overflow
  height/width, affected regions and constraint measurements.
- Observed page counts were `1, 2, 4, 10, 1, 3` for fixtures 01–06.
- The run took approximately `29.26 s` wall time with approximately `206.8 MiB`
  maximum resident memory in the recorded process measurement.

### Paged.js + Chromium Headless + Playwright

- All six fixtures executed three times with functionally stable measurements.
- Exact PDF hashes were not stable for the same metadata reason.
- Observed page counts were `1, 2, 4, 4, 1, 3`.
- The adapter did not provide normalized overflow height/width or constraint
  measurements required by RFC-002.
- The run took approximately `33.32 s` wall time with approximately `231.5 MiB`
  maximum resident memory in the recorded process measurement.

### WeasyPrint

- Six fixtures were attempted; five completed and `CV_FIXTURE_02` failed with
  an `AssertionError` in the common fixture configuration.
- Slot bounds, overflow measurements and constraint measurements were not
  available from the exercised adapter.
- Repeated determinism runs were not collected.
- Recorded maximum resident memory was approximately `99.1 MiB`.

Detailed raw evidence is in `evidence/` and the score table is in
`BENCHMARK-MATRIX.md`.

## RFC-002 measurement assessment

```text
RFC_002_MEASUREMENTS_STATUS = PARTIAL
```

The Chromium stack demonstrates the core geometry needed for overflow
diagnostics. The spike does not yet demonstrate a dedicated
`CONSTRAINT_VIOLATION` fixture or a deliberately injected `RENDER_FAILED`
classification for every stack. Paged.js and WeasyPrint do not yet expose the
normalized measurements needed to build the RFC-002 protocol without an
additional adapter/evidence layer.

## Determinism assessment

```text
DETERMINISM_STATUS = FUNCTIONALLY_STABLE_WITH_BINARY_METADATA_DEBT
```

Chromium and Paged.js were functionally stable across three repetitions, but
their exact PDF hashes varied. Fonts were not frozen to a versioned benchmark
font set. WeasyPrint was not repeated. These limitations prevent a high
confidence determinism claim.

## Performance assessment

```text
PERFORMANCE_STATUS = OBSERVED_NOT_RATIFIED
```

Cold/warm separation and per-render CPU sampling were not sufficiently
standardized for a ratified threshold. The recorded wall-time and process
memory observations are comparative evidence only; no success threshold was
invented.

## Security and exploitation assessment

```text
SECURITY_STATUS = PARTIAL
```

The browser stacks blocked network requests in the harness, and all fixtures
used local resources. The evidence does not yet prove a complete production
sandbox, filesystem policy, CPU/memory limit, timeout policy or secret
isolation for each candidate. No credentials or unrestricted network access
were provided to the spike.

## Matrix and recommendation

```text
MATRIX_RESULT =
  Chromium Headless + Playwright: 74.20 / 100
  Paged.js + Chromium Headless + Playwright: 68.00 / 100
  WeasyPrint: 54.00 / 100
  HARD_GATE_RESULT: NO CANDIDATE RATIFIED
```

The scores reproduce the ADR-001 weights and are not sufficient to override
the RFC-002 hard requirements. `V1_BACKEND_RECOMMENDATION = NONE` is therefore
the correct outcome for this gate, rather than an arbitrary Chromium,
Paged.js or WeasyPrint selection.

## Unresolved points

1. Freeze and record the benchmark font set and font versions.
2. Define whether PDF metadata is normalized or excluded from functional
   artifact equivalence.
3. Add isolated `CONSTRAINT_VIOLATION` and `RENDER_FAILED` evidence.
4. Normalize Paged.js overflow and constraint measurements.
5. Resolve the common-fixture WeasyPrint failure and obtain slot/overflow
   measurements if it remains a candidate.
6. Complete process sandbox, filesystem, timeout and resource-limit evidence.
7. Repeat WeasyPrint determinism and collect standardized CPU/cold/warm data.

## Mission output

```text
BENCHMARK_STATUS = PASS_WITH_LIMITATIONS
V1_BACKEND_RECOMMENDATION = NONE
DECISION_CONFIDENCE = LOW
CANDIDATES_TESTED = Chromium Headless + Playwright; Paged.js + Chromium Headless + Playwright; WeasyPrint
FIXTURES_EXECUTED = CV_FIXTURE_01..06 on all stacks; WeasyPrint 5 success / 1 failure
RFC_002_MEASUREMENTS_STATUS = PARTIAL
DETERMINISM_STATUS = FUNCTIONALLY_STABLE_WITH_BINARY_METADATA_DEBT
PERFORMANCE_STATUS = OBSERVED_NOT_RATIFIED
SECURITY_STATUS = PARTIAL
MATRIX_RESULT = 74.20 / 68.00 / 54.00; no hard-gate ratification
EVIDENCE_PATH = benchmark/SLYDESIGN-RENDERER-BENCHMARK-001/evidence/
SPIKE_CODE_PATH = benchmark/SLYDESIGN-RENDERER-BENCHMARK-001/spike/
PRODUCTION_CODE_MODIFIED = NO
UNRESOLVED_POINTS = listed above
NEXT_GATE = GATE-SLYDESIGN-RENDERER-BACKEND-ADJUDICATION-001
```
