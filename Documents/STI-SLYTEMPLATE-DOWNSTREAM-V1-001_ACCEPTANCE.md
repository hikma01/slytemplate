# STI — SlyTemplate Downstream V1 Acceptance

```yaml
artifact_id: STI-SLYTEMPLATE-DOWNSTREAM-V1-001
status: PREPARATION_FROZEN
execution_authority: NOT_GRANTED
```

## Required proof

1. Register one immutable CV `TemplatePackage@1.0.0`.
2. Resolve and validate a manual `SelectedTemplate@1.0.0`.
3. Bind a real `CanonicalSlots@1.0.0` projection to the selected package.
4. Execute the existing Core and RendererAdapter unchanged.
5. Produce a final CV artifact and trace package/version/lineage.
6. Replay all existing LOT 1–7 fixtures and compare output contracts.
7. Verify no semantic reinterpretation, automatic selection or extra template.
8. Run independent QA and pre-human evidence exhaustion.

## Failure conditions

Any missing package provenance, mutable version, implicit selection, semantic
reinterpretation, Registry authority leakage, regression in existing fixtures
or undocumented output divergence blocks closure.
