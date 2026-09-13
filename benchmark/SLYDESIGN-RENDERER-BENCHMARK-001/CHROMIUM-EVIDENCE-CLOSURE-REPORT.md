# Chromium Evidence Closure Report

> **SPIKE_ONLY / NON_PRODUCTION** — `SLYDESIGN-CHROMIUM-EVIDENCE-CLOSURE-001`

## Verdict

```text
EVIDENCE_CLOSURE_STATUS = PASS_WITH_LIMITATIONS
RFC_002_MEASUREMENTS = PASS_WITH_LIMITATIONS
DETERMINISM = PASS_WITH_LIMITATIONS
SECURITY_ISOLATION = PASS_WITH_LIMITATIONS
PERFORMANCE_MEMORY = PASS_WITH_LIMITATIONS
CHROMIUM_RATIFICATION_RECOMMENDATION = RATIFY_WITH_LIMITATIONS
PRODUCTION_CODE_MODIFIED = NO
```

Chromium satisfies the exercised functional contract through a spike adapter.
No RFC-001/RFC-002 or public DTO change was needed. Ratification remains
conditional on carrying the tested isolation and deterministic-environment
policies into the production execution boundary.

## Execution

```text
FIXTURES_EXECUTED = CV_FIXTURE_01..CV_FIXTURE_06
REPETITIONS = 5 per fixture
STACK = Google Chrome Headless 152.0.7977.83 + Playwright 1.59.1
NODE = v26.8.1
OS = darwin 23.6.0 x64
LOCALE = en-US
TIMEZONE = UTC
DEVICE_SCALE_FACTOR = 1
PAGE_CONFIGURATION = A4 / print / preferCSSPageSize
```

Raw evidence: `evidence/chromium-closure-results.json`.
Security probes: `evidence/chromium-closure-security.json`.
Process timing: `evidence/chromium-closure-time.txt`.

## RFC-002 measurements

The spike demonstrates the intended normalization boundary:

```text
Chromium raw DOM/PDF measurements
        ↓
SPIKE RendererAdapter normalization
        ↓
RFC-002-compatible diagnostics
```

The measured fields include `page_count`, `page_bounds`, `content_bounds`,
`slot_bounds`, `overflow_height`, `overflow_width`, `affected_regions` and
`constraint_measurements`.

| Required state | Evidence | Result |
|---|---|---|
| `FIT` | `CV_FIXTURE_01` | Produced with no diagnostics |
| Vertical `OVERFLOW` | `CV_FIXTURE_04` | Multiple affected slots and document scope |
| Horizontal `OVERFLOW` | Dedicated width expansion of `CV_FIXTURE_01` | Width ratio measured and document scope produced |
| `CONSTRAINT_VIOLATION` | Identity slot max-height `100px`, no page overflow | Typed constraint diagnostic produced |
| `RENDER_FAILED` | Closed Chromium target before PDF serialization | Sanitized typed failure diagnostic produced |

The overflow diagnostic carries multiple slot IDs, scope, height/width ratios,
severity, reduction weight and constraint IDs. The constraint diagnostic
contains constraint ID/type, target, measured value, boundary and severity.
The failure diagnostic contains failure code, renderer stage, retryability and
a sanitized message. No editorial mutation occurs.

## Determinism

All six fixtures produced identical functional measurement and diagnostic
signatures across five repetitions. PDF byte hashes varied while PDF byte
lengths and functional measurements remained stable; this is treated as
`BYTE_DETERMINISM = UNPROVEN` because PDF metadata is not normalized.

```text
FUNCTIONAL_RENDER_DETERMINISM = PASS
BYTE_DETERMINISM = PASS_WITH_LIMITATIONS
```

The environment records engine/execution versions, Node/OS, locale, timezone,
device scale factor, page configuration, network policy and sandbox setting.
The host font set is still not frozen with immutable font versions.

## Security and isolation

The persistent Chromium context uses an isolated profile and
`chromiumSandbox: true`. The harness also disables Chromium background
networking and aborts every non-`data:`/`about:` request.

Observed probes:

| Probe | Result | Boundary |
|---|---|---|
| External network navigation | Blocked | Playwright route + Chromium configuration |
| `file:///etc/passwd` navigation | Blocked | Playwright route |
| Credential API / persistent context | No credential API; non-persistent context | Browser context |
| Missing-selector timeout | Bounded at `100ms` | Playwright execution layer |

No credentials or application secrets were supplied. The spike does not prove
an OS-level production policy for filesystem allowlists, CPU/memory cgroups or
deployment timeouts. Those controls remain required at the production
execution boundary, not in `PresentationDocumentDTO` or SlyDesign Core.

## Performance and memory

Thirty fixture renders were recorded. No SLO was invented.

| Metric | Observed result |
|---|---:|
| Cold start | `1979.49ms` |
| Render duration min | `766.15ms` |
| Render duration median | `782.11ms` |
| Render duration p95 | `1021.56ms` |
| Render duration max | `1031.28ms` |
| Process CPU user | `709538µs` |
| Process CPU system | `85989µs` |
| Harness maximum RSS | `221196288 bytes` (~`211.0MiB`) |
| Chromium sampled peak RSS | `161226752 bytes` (~`153.7MiB`), partial sampling |

The RSS values are observations, not resource limits. No manifest performance
or memory blocker was observed for the CV fixtures, but deployment bounds must
be established separately.

## Closure decision

```text
RFC_002_MEASUREMENTS = PASS_WITH_LIMITATIONS
DETERMINISM = PASS_WITH_LIMITATIONS
SECURITY_ISOLATION = PASS_WITH_LIMITATIONS
PERFORMANCE_MEMORY = PASS_WITH_LIMITATIONS
CHROMIUM_RATIFICATION_RECOMMENDATION = RATIFY_WITH_LIMITATIONS
```

### Limitations

1. Immutable font files and versions are not yet frozen.
2. PDF metadata normalization or functional-equivalence policy remains open.
3. Security controls are demonstrated at the spike harness boundary; the
   production sandbox, filesystem policy, resource limits and timeout policy
   still need deployment evidence.
4. Chromium RSS sampling is partial; the recorded process-level measurement is
   the conservative operational observation.

### Blockers

```text
ARCHITECTURAL_CONTRACT_VIOLATION = NO
CHROMIUM_CANNOT_SATISFY_RFC_002 = NO
SECURITY_BLOCKER = NO_SPIKE_BLOCKER; PRODUCTION_POLICY_EVIDENCE_REQUIRED
```

## Mission output

```text
EVIDENCE_CLOSURE_STATUS = PASS_WITH_LIMITATIONS
RFC_002_MEASUREMENTS = PASS_WITH_LIMITATIONS
DETERMINISM = PASS_WITH_LIMITATIONS
SECURITY_ISOLATION = PASS_WITH_LIMITATIONS
PERFORMANCE_MEMORY = PASS_WITH_LIMITATIONS
CHROMIUM_RATIFICATION_RECOMMENDATION = RATIFY_WITH_LIMITATIONS
FIXTURES_EXECUTED = CV_FIXTURE_01..06
REPETITIONS = 5 per fixture
ENVIRONMENT_LOCK = evidence/chromium-closure-results.json
EVIDENCE_PATH = benchmark/SLYDESIGN-RENDERER-BENCHMARK-001/evidence/
LIMITATIONS = font freeze, PDF metadata, production isolation policy, partial RSS sampling
BLOCKERS = none architectural; deployment evidence remains required
PRODUCTION_CODE_MODIFIED = NO
NEXT_GATE = GATE-SLYDESIGN-CHROMIUM-RATIFICATION-001
```
