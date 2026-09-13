# GATE-SLYDESIGN-IMPLEMENTATION-HOST-001

```yaml
artifact_id: GATE-SLYDESIGN-IMPLEMENTATION-HOST-001
artifact_type: PHYSICAL_IMPLEMENTATION_DECISION
module_id: SLYDESIGN
status: PASS
implementation_host: SLYDESIGN_ROOT
implementation_model: INDEPENDENT_PACKAGE
language: TYPESCRIPT
runtime: NODEJS
current_scope: CV_ONLY
architecture_change: NO
physical_implementation_decision: YES
code_authority: GRANTED_FOR_LOT_1_AND_MINIMAL_PACKAGE_BOOTSTRAP
decision_date: 2026-09-09
```

## Décision

Le code SlyDesign sera hébergé dans son propre package sous
`Nextcloud/SlyProjet/SlyDesign/`. SlyCV sera ultérieurement consommateur du
contrat publié et ne possédera pas l'implémentation SlyDesign.

```text
IMPLEMENTATION_HOST = SLYDESIGN_ROOT
IMPLEMENTATION_MODEL = INDEPENDENT_PACKAGE
LANGUAGE = TYPESCRIPT
RUNTIME = NODEJS
SLYCV_OWNERSHIP = FORBIDDEN
SLYPLATFORM_MONOREPO_MIGRATION = DEFERRED
```

Un package physique, `src/contracts/` et `tests/contracts/` sont des structures
de code. Ils ne constituent pas de nouveaux nœuds SlyDesign et ne changent pas
le modèle ratifié : `SlyDesign Core` et `RendererAdapter`.

## Autorité accordée

```text
AUTHORIZED_BOOTSTRAP = package.json; tsconfig.json; minimal test configuration
AUTHORIZED_LOT_1 = src/contracts/; tests/contracts/; public package entrypoint
```

Sont explicitement exclus : Core runtime, template runtime, RendererAdapter,
Chromium, PDF, réconciliation, E2E et les lots 2 à 7.

## Sortie

```text
ARCHITECTURE_CHANGE = NO
CODE_AUTHORITY = GRANTED_FOR_LOT_1_AND_MINIMAL_PACKAGE_BOOTSTRAP
LOT_1 = RESUMED
LOT_2_CODE_AUTHORITY = NOT_GRANTED
```
