# Semantic Transverse — Template E2E

The Template Factory now emits an explicit `CandidateSlots@1.0.0` artifact through
`src/integration/semantic/index.ts`. Semantic labels are supplied by the governed
template mapping; the adapter performs no semantic inference.

Runtime path:

```text
TemplateContract
  → CandidateSlots@1.0.0
  → POST /internal/v1/observability/semantic-resolve
  → Semantic Authority / Vocabulary Registry
  → Canonical Slots + deterministic bindings
```

The authenticated runtime boundary is served by SlyCV and uses the shared
PostgreSQL authority `slyplatform.semantic_transverse`. A production smoke run
returned registry `1.0.14`, `EXACT_MATCH` for the Template slot `Role`, canonical
ID `professional.experience.role`, and a `BOUND` binding to the matching
Candidate Metadata item.

The boundary preserves `UNKNOWN` and `CONFLICT` responses and never invents a
canonical ID. The Template branch is therefore runtime-connected for Candidate
Slots; downstream TemplatePackage rendering remains outside this adapter's scope.
