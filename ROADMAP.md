# Roadmap — Module Template / SlyTemplate

```yaml
artifact_id: ROADMAP-SLYDESIGN-001
artifact_type: ROADMAP
project_id: MODULE_DESIGN
module_id: SLYTEMPLATE
mission_ref: SLYDESIGN-GOV-FOUNDATION-002
status: PHASE_4_CLOSED_V1_ACCEPTED_WITH_OPERATIONAL_DEBT
authority: Architecture / Coordinateur Central
code_authority: CLOSED
```

La roadmap est structurée par gates documentaires. Elle n'ouvre aucune
autorisation de développement.

## Phase 0 — Project Foundation

```text
├── Boussole
├── Authority / Governance
├── Structural Topology
├── Module Boundary
└── Documentation Index
```

État : `DOCUMENTARY_FOUNDATION`.

## Phase 1 — Architecture Contracts

```text
├── RFC-SLYDESIGN-001
├── RFC-SLYDESIGN-002
└── ADR-SLYDESIGN-001
```

État : contrats stabilisés ; backend V1 CV ratifié avec limitations.

## Phase 2 — Module Structure

```text
Chromium Production Boundary   DONE — architecture accepted with limitations
            ↓
Internal Responsibilities       TODO
            ↓
Boundaries                      TODO
            ↓
Node Model                      TODO
            ↓
Inter-node Contracts            TODO
            ↓
SlyTemplate Graph               TODO
            ↓
Architecture Gate               TODO
            ↓
READY_TO_CODE                   LOCKED
```

État : `DONE`; structure interne adjudicée à deux nœuds, sans implémentation.

## Phase 3 — Implementation Readiness

```text
├── implementation plan
├── implementation contracts
├── test strategy
├── fixtures / oracles
└── acceptance criteria
```

État : `DONE`; readiness acceptée, `READY_TO_CODE = YES`, sans autorité de
code.

Plan, stratégie de tests, fixtures/oracles, sécurité et critères V1 sont
documentés et adjudiqués.

## Phase 4 — Implementation

```text
├── SlyTemplate Core
├── RendererAdapter
├── Template CV #1
├── Template CV #2
└── Overflow diagnostics
```

État : `PHASE_4_CLOSED_V1_ACCEPTED_WITH_OPERATIONAL_DEBT`; dettes
opérationnelles Chromium D01/D02 conservées.

## Gates

1. `GATE-SLYDESIGN-FOUNDATION-001` : Boussole, topologie, limites et index
   approuvés.
2. `GATE-SLYDESIGN-CONTRACTS-001` : RFC-001/RFC-002 stabilisées et ADR
   backend arbitrée.
3. `GATE-SLYDESIGN-STRUCTURE-001` : graphe interne et nœuds justifiés.
4. `GATE-SLYDESIGN-CHROMIUM-RATIFICATION-001` : Chromium Headless ratifié
   comme cible V1 CV avec limitations documentées.
5. `GATE-SLYDESIGN-CHROMIUM-PRODUCTION-BOUNDARY-001` : frontière
   Core/Contract/Adapter/backend et invariants d'exécution verrouillés.
6. `GATE-SLYDESIGN-MODULE-STRUCTURE-001` : responsabilités, frontières,
   modèle de nœuds, contrats inter-nœuds et graphe SlyTemplate.
7. `GATE-SLYDESIGN-MODULE-STRUCTURE-ADJUDICATION-001` : décision sur le modèle
   de nœuds et le graphe proposés — `PASS`.
8. `GATE-SLYDESIGN-IMPLEMENTATION-READINESS-001` : plan, contrats de mise en
   œuvre, stratégie de tests, fixtures et critères d'acceptation —
   `READY_FOR_GATE`.
9. `GATE-SLYDESIGN-READY-TO-CODE-001` : vérification finale avant autorité de
   code — `PASS`.
10. `GATE-SLYDESIGN-LOT1-AUTHORIZATION-001` : autorité limitée au lot 1, puis
   validation Dev/QA avant le lot suivant.
11. `GATE-SLYDESIGN-LOT1-ADJUDICATION-001` : validation du résultat LOT 1
   avant l'ouverture de LOT 2.
12. `GATE-SLYDESIGN-CV-IMPLEMENTATION-001` : autorisation globale distincte,
   non accordée par le ready-to-code.
13. `GATE-SLYDESIGN-LOT2-ADJUDICATION-001` : validation du Core avant
   l'ouverture de LOT 3.
14. `GATE-SLYDESIGN-LOT3-ADJUDICATION-001` : validation du template CV
   foundation avant l'ouverture de LOT 4.
15. `GATE-SLYDESIGN-LOT4-ADJUDICATION-001` : validation du RendererAdapter
   abstrait avant l'ouverture de LOT 5.
16. `GATE-SLYDESIGN-LOT5-ADJUDICATION-001` : validation de l'intégration
   Chromium avant l'ouverture de LOT 6.
17. `GATE-SLYDESIGN-LOT6-ADJUDICATION-001` : validation du feedback RFC-002
   avant l'ouverture de LOT 7.
18. `GATE-SLYDESIGN-V1-FINAL-ADJUDICATION-001` : validation finale de la
   chaîne E2E CV et de la visibilité ArchiOps.
