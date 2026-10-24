# ADR — SlyTemplate Downstream V1 Boundaries and Ownership

```yaml
artifact_id: ADR-SLYTEMPLATE-DOWNSTREAM-001
status: PREPARATION_FROZEN
decision_state: CC_AUTHORIZATION_REQUIRED
```

## Ownership

- Semantic Authority owns canonical semantic identity and resolution.
- Template Factory/Package owns package construction and validation.
- Template Registry owns immutable package identity, version and availability.
- Manual selection owns only the explicit package reference and lineage.
- SlyTemplate Core owns deterministic presentation composition.
- RendererAdapter owns backend isolation, rendering and normalized measurements.

No owner may silently assume another owner's authority.

## Boundary decisions frozen for preparation

The two-node SlyTemplate topology remains unchanged. `CanonicalSlots` are
consumed as-is. The Registry does not interpret semantic values. Manual
selection is represented as data and is replaceable by a future selection
strategy without changing Package or Core contracts.

Automatic selection, multiple templates and downstream storage remain outside
V1.
