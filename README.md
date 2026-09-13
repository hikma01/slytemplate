# SlyTemplate

SlyTemplate est le futur module transverse de présentation visuelle de la
plateforme Sly. Il transforme un `PresentationDocumentDTO` produit en amont
en arbre de présentation, puis délègue le rendu à un backend à sélectionner.

## Statut

- `MODULE_STATUS`: `DOCUMENTARY_FOUNDATION_ONLY`
- `IMPLEMENTED_DOMAIN`: `CV_ONLY`
- `CODE_AUTHORITY`: `NOT_GRANTED`
- `RUNTIME_STATUS`: `NOT_IMPLEMENTED`

Cette arborescence contient uniquement la formalisation documentaire de la
fondation. Aucun moteur SlyTemplate, template exécutable ou renderer n'est
autorisé par cette mission.

## Chaîne de responsabilité

```text
SlyKnowledge
    ↓
SlyCV — stratégie, projection, composition éditoriale
    ↓
PresentationDocumentDTO
    ↓
SlyTemplate Core — présentation visuelle
    ↓
Presentation Tree → Renderer → document compilé
    ↓
SlyOrganize — nommage, stockage, indexation
```

SlyCV décide quoi présenter. SlyTemplate décide comment le présenter
visuellement. SlyOrganize prend en charge l'artefact physique après
génération.

## Dépendances et frontières

SlyTemplate dépend contractuellement du payload produit par SlyCV et du
contexte de connaissance/projection fourni en amont. Il remet l'artefact
compilé à SlyOrganize, sans accéder à son stockage interne. Le backend V1 CV
ratifié est Chromium Headless derrière un `RendererAdapter`, sans couplage du
Core à cette implémentation.

Interdictions gelées : aucune sélection métier, reformulation, suppression
d'information, stratégie de candidature, stockage, nommage ou archivage dans
SlyTemplate. Aucun développement du moteur n'est autorisé par la fondation.

## Documents canoniques

- [Boussole structurelle](BOUSSOLE.md)
- [Roadmap](ROADMAP.md)
- [Project Authority Map](PROJECT-AUTHORITY-MAP.md)
- [Project Cockpit](PROJECT-COCKPIT.md)
- [Journal](JOURNAL.md)

- [RFC-SLYDESIGN-001 — Presentation Document Contract and Slot Architecture](Documents/RFC-SLYDESIGN-001_PRESENTATION_DOCUMENT_CONTRACT_AND_SLOT_ARCHITECTURE.md)
- [RFC-SLYDESIGN-002 — Overflow and Feedback Protocol](Documents/RFC-SLYDESIGN-002_OVERFLOW_AND_FEEDBACK_PROTOCOL.md)
- [ADR-SLYDESIGN-001 — Visual Rendering Execution Backend](Documents/ADR-SLYDESIGN-001_VISUAL_RENDERING_EXECUTION_BACKEND.md)
- [Gate Chromium ratification](Documents/GATE-SLYDESIGN-CHROMIUM-RATIFICATION-001.md)
- [Gate Chromium production boundary](Documents/GATE-SLYDESIGN-CHROMIUM-PRODUCTION-BOUNDARY-001.md)
- [SlyTemplate module structure](Documents/SLYDESIGN-MODULE-STRUCTURE-001_ARCHITECTURE.md)
- [Module structure adjudication](Documents/GATE-SLYDESIGN-MODULE-STRUCTURE-ADJUDICATION-001.md)
- [Implementation readiness](Documents/SLYDESIGN-IMPLEMENTATION-READINESS-001.md)
- [Ready-to-code adjudication](Documents/GATE-SLYDESIGN-READY-TO-CODE-001.md)
- [LOT 2 implementation evidence](evidence/SLYDESIGN-LOT2-IMPLEMENTATION-REPORT.md)
- [LOT 3 implementation evidence](evidence/SLYDESIGN-LOT3-IMPLEMENTATION-REPORT.md)
- [LOT 4 implementation evidence](evidence/SLYDESIGN-LOT4-IMPLEMENTATION-REPORT.md)
- [LOT 5 implementation evidence](evidence/SLYDESIGN-LOT5-IMPLEMENTATION-REPORT.md)
- [LOT 6 implementation evidence](evidence/SLYDESIGN-LOT6-IMPLEMENTATION-REPORT.md)

## Extensions futures

Les templates BusinessCard et Banner illustrent uniquement l'extensibilité
du contrat. Ils sont `DEFERRED` et ne constituent pas un périmètre V1.

## Roadmap documentaire

1. `RFC-SLYDESIGN-001` — stabiliser le contrat de présentation et les slots.
2. `RFC-SLYDESIGN-002` — confirmer le protocole d'overflow et la borne de
   réconciliation `2`.
3. `ADR-SLYDESIGN-001` — backend V1 CV ratifié avec limitations via un gate
   explicite.
4. `GATE-SLYDESIGN-CHROMIUM-PRODUCTION-BOUNDARY-001` — verrouiller la
   frontière d'exécution avant le découpage des nœuds.
5. `GATE-SLYDESIGN-MODULE-STRUCTURE-001` — déterminer les responsabilités,
   nœuds, contrats et graphe SlyTemplate.
