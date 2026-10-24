# RFC — SlyTemplate Downstream V1 Contracts

```yaml
artifact_id: RFC-SLYTEMPLATE-DOWNSTREAM-V1-001
status: PREPARATION_FROZEN
implementation_authority: NOT_GRANTED
template_count_v1: 1
selection_mode_v1: MANUAL_EXPLICIT
```

This RFC freezes the minimum preparation contracts. It does not authorize
runtime implementation or Registry mutation.

## TemplatePackage@1.0.0

An immutable, validated package containing:

- `package_id` and `package_version`;
- `artifact_type = CV`;
- `template_contract_ref`;
- slot declarations and mapping reference;
- compatible contract versions;
- availability state;
- executable template/payload reference;
- provenance and lineage.

It contains no semantic interpretation, business selection logic or content
rewriting.

## TemplateRegistry@1.0.0

The Registry stores exactly one governed V1 CV package and supports:

- immutable registration by `package_id@version`;
- lookup by id and version;
- integrity validation;
- availability state;
- audit and provenance.

The Registry is not Semantic Authority and does not resolve CanonicalSlots.

## SelectedTemplate@1.0.0

An explicit selection value containing:

- `package_id`;
- `package_version`;
- `selection_mode = MANUAL`;
- actor/source reference;
- lineage and timestamp.

No score, ranking, recommendation or automatic fallback is part of V1.

## Binding

The governed path is:

`CanonicalSlots → SelectedTemplate → TemplatePackage → SlyTemplate Core → RendererAdapter`.

CanonicalSlots remain authoritative semantic output; the package only binds
declared slots to presentation behavior.
