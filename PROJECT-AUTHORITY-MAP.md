# Project Authority Map — Module Template / SlyTemplate

```yaml
artifact_id: PROJECT-AUTHORITY-MAP-SLYDESIGN-001
artifact_type: GOVERNANCE_MAP
project_id: MODULE_DESIGN
module_id: SLYTEMPLATE
mission_ref: SLYDESIGN-GOV-FOUNDATION-002
status: NAVIGATION_ONLY
authority: Architecture / Coordinateur Central
```

Cette carte navigue vers les autorités ; elle ne duplique pas les RFC, ADR,
STI, preuves ou décisions.

| Question | Autorité | Emplacement canonique |
|---|---|---|
| Vision, topologie, principes SlyTemplate | Module Template | [BOUSSOLE.md](BOUSSOLE.md) |
| Phases et gates | Module Design | [ROADMAP.md](ROADMAP.md) |
| Contrat de présentation et slots | Architecture SlyTemplate | [RFC-SLYDESIGN-001](Documents/RFC-SLYDESIGN-001_PRESENTATION_DOCUMENT_CONTRACT_AND_SLOT_ARCHITECTURE.md) |
| Overflow et feedback | Architecture SlyTemplate | [RFC-SLYDESIGN-002](Documents/RFC-SLYDESIGN-002_OVERFLOW_AND_FEEDBACK_PROTOCOL.md) |
| Backend de rendu | Architecture SlyTemplate | [ADR-SLYDESIGN-001](Documents/ADR-SLYDESIGN-001_VISUAL_RENDERING_EXECUTION_BACKEND.md) |
| Ratification Chromium et limites | Architecture SlyDesign | [GATE-SLYDESIGN-CHROMIUM-RATIFICATION-001](Documents/GATE-SLYDESIGN-CHROMIUM-RATIFICATION-001.md) |
| Frontière de production Chromium | Architecture SlyDesign | [GATE-SLYDESIGN-CHROMIUM-PRODUCTION-BOUNDARY-001](Documents/GATE-SLYDESIGN-CHROMIUM-PRODUCTION-BOUNDARY-001.md) |
| Structure interne et modèle de nœuds | Architecture SlyTemplate | [SLYDESIGN-MODULE-STRUCTURE-001](Documents/SLYDESIGN-MODULE-STRUCTURE-001_ARCHITECTURE.md) |
| Adjudication de structure | Architecture SlyTemplate | [GATE-SLYDESIGN-MODULE-STRUCTURE-ADJUDICATION-001](Documents/GATE-SLYDESIGN-MODULE-STRUCTURE-ADJUDICATION-001.md) |
| Implementation readiness | Architecture SlyTemplate | [SLYDESIGN-IMPLEMENTATION-READINESS-001](Documents/SLYDESIGN-IMPLEMENTATION-READINESS-001.md) |
| Ready-to-code adjudication | Architecture SlyTemplate | [GATE-SLYDESIGN-READY-TO-CODE-001](Documents/GATE-SLYDESIGN-READY-TO-CODE-001.md) |
| LOT 1 implementation evidence | Development / QA | [SLYDESIGN-LOT1-IMPLEMENTATION-REPORT](evidence/SLYDESIGN-LOT1-IMPLEMENTATION-REPORT.md) |
| LOT 2 implementation evidence | Development / QA | [SLYDESIGN-LOT2-IMPLEMENTATION-REPORT](evidence/SLYDESIGN-LOT2-IMPLEMENTATION-REPORT.md) |
| LOT 3 implementation evidence | Development / QA | [SLYDESIGN-LOT3-IMPLEMENTATION-REPORT](evidence/SLYDESIGN-LOT3-IMPLEMENTATION-REPORT.md) |
| LOT 4 implementation evidence | Development / QA | [SLYDESIGN-LOT4-IMPLEMENTATION-REPORT](evidence/SLYDESIGN-LOT4-IMPLEMENTATION-REPORT.md) |
| LOT 5 implementation evidence | Development / QA | [SLYDESIGN-LOT5-IMPLEMENTATION-REPORT](evidence/SLYDESIGN-LOT5-IMPLEMENTATION-REPORT.md) |
| LOT 6 implementation evidence | Development / QA | [SLYDESIGN-LOT6-IMPLEMENTATION-REPORT](evidence/SLYDESIGN-LOT6-IMPLEMENTATION-REPORT.md) |
| Topologie transverse existante | SlyPlatform | [Project Authority Map](../SlyPlatform/00-GOVERNANCE/PROJECT-AUTHORITY-MAP.md) |
| Méthode, rôles et gates | SlyMethod | Références SlyMethod, selon le protocole CC/CT |

## Règles

- Un document de navigation ne ratifie pas une décision.
- La topologie SlyTemplate est structurelle ; un flux runtime différent ne la
  remplace pas.
- Les documents de `Documents/` restent les RFC/ADR canoniques déjà créées ;
  `RFC/` et `ADR/` sont des surfaces d'index, pas des copies.
- Aucun document de cette carte n'accorde `CODE_AUTHORITY`.
