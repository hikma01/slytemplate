# SLYDESIGN-IMPLEMENTATION-READINESS-001 — Plan de préparation

```yaml
artifact_id: SLYDESIGN-IMPLEMENTATION-READINESS-001
artifact_type: IMPLEMENTATION_READINESS_PLAN
project_id: SLYDESIGN
module_id: SLYDESIGN
mission_ref: SLYDESIGN-IMPLEMENTATION-READINESS-001
status: ACCEPTED
scope: CV_ONLY
code_authority: NOT_GRANTED
code_modified: NO
next_gate: GATE-SLYDESIGN-LOT1-AUTHORIZATION-001
```

## 1. Décisions consommées

```text
NODE_01 = SLYDESIGN_CORE
NODE_02 = RENDERER_ADAPTER
BACKEND_V1 = CHROMIUM_HEADLESS
PHASE_2_STATUS = ARCHITECTURE_ACCEPTED
```

Ce document transforme les décisions ratifiées en unités exécutables. Il ne
réouvre ni l'architecture, ni le modèle de nœuds, ni le choix Chromium, et ne
contient aucun fichier source définitif.

## 2. Dependency order

```text
LOT 1 Contracts & Types
        ↓
LOT 2 SlyDesign Core
        ↓
LOT 3 Template CV Foundation
        ↓
LOT 4 RendererAdapter
        ↓
LOT 5 Chromium Backend Integration
        ↓
LOT 6 RFC-002 Feedback
        ↓
LOT 7 E2E CV
```

Les lots 2 et 3 restent dans le nœud `SlyDesign Core`. Les lots 4 et 5 restent
dans le nœud `RendererAdapter` et sa frontière concrète. Le découpage en lots
ne crée pas de nouveaux nœuds.

## 3. Implementation map

### LOT-01 — Contracts & Types

- `OBJECTIVE`: rendre les contrats ratifiés exprimables et versionnables.
- `SCOPE`: DTO, slots, `RenderRequest`, `TemplateContract`, `PresentationTree`,
  `RendererContract`, `RenderArtifact`, `RenderFeedback`, diagnostics et
  contexte de trace.
- `INPUT_CONTRACTS`: RFC-001, RFC-002, ADR-001.
- `OUTPUT_CONTRACTS`: schémas contractuels validables, sans DOM/CSS/Chromium.
- `DEPENDENCIES`: aucune ; RFC-001/RFC-002/ADR-001 ratifiés.
- `FILES_EXPECTED`: `src/contracts/`, `src/contracts/schemas/` et
  `tests/contracts/` ; aucune implémentation créée par ce plan.
- `TESTS_REQUIRED`: présence/nullabilité, versioning, slots inconnus et types,
  statuts RFC-002, sérialisation sans fuite backend.
- `ACCEPTANCE_CRITERIA`: chaque champ normatif est couvert ; aucune unité
  physique, CSS, DOM ou API Chromium dans le DTO public.
- `OUT_OF_SCOPE`: implémentation Core, template concret, navigateur,
  persistance.
- `FAILURE_CONDITIONS`: contrat ambigu, type non versionné, fuite backend ou
  diagnostic non typé.
- `ROLLBACK_OR_REWORK_RULE`: isoler le contrat fautif et revenir à la dernière
  version validée ; aucune adaptation silencieuse du DTO.
- `NEXT_GATE`: revue de contrat du lot 2.

### LOT-02 — SlyDesign Core

- `OBJECTIVE`: produire un `PresentationTree` déterministe à partir d'un
  `RenderRequest` valide.
- `SCOPE`: validation contractuelle, accès slots, template resolution,
  tokens/policies, composition, orchestration interne et préparation du rendu.
- `INPUT_CONTRACTS`: `PresentationDocumentDTO`, `RenderRequest`, références
  immuables, `traceId`, `contextId`, `lineage`.
- `OUTPUT_CONTRACTS`: `PresentationTree` et demande conforme au
  `RendererContract`.
- `DEPENDENCIES`: LOT-01.
- `FILES_EXPECTED`: `src/core/`, `src/core/validation/`, `src/core/composition/`
  et `tests/core/` ; aucune implémentation créée par ce plan.
- `TESTS_REQUIRED`: validation, slot access policy, résolution tokens/policies,
  composition, génération tree, absence de mutation sémantique.
- `ACCEPTANCE_CRITERIA`: aucun accès DOM/CSS/Chromium ; slots non déclarés
  rejetés ; tree déterministe et lineage conservée.
- `OUT_OF_SCOPE`: lifecycle navigateur, mesures brutes, sandbox, stockage,
  logique métier SlyCV.
- `FAILURE_CONDITIONS`: mutation, fallback silencieux, dépendance renderer ou
  tree non corrélable.
- `ROLLBACK_OR_REWORK_RULE`: replier la responsabilité dans Core sans créer de
  nœud ; corriger par contrat si l'invariant est normatif.
- `NEXT_GATE`: revue template CV du lot 3.

### LOT-03 — Template CV Foundation

- `OBJECTIVE`: fournir le premier contrat/template CV minimal compatible avec le
  Core.
- `SCOPE`: slots CV déclarés, mapping, tree schema, tokens/policies autorisés,
  règles de surface et fixtures CV communes.
- `INPUT_CONTRACTS`: `PresentationDocumentDTO<CVSlotMap>`, `TemplateContract`.
- `OUTPUT_CONTRACTS`: `PresentationTree` CV valide et configuration immuable.
- `DEPENDENCIES`: LOT-01, LOT-02.
- `FILES_EXPECTED`: `templates/cv/`, `templates/cv/tokens/`,
  `templates/cv/policies/` et `tests/templates/cv/` ; aucune implémentation
  créée par ce plan.
- `TESTS_REQUIRED`: slots requis/optionnels, unknown slot rejection, types,
  unicode, contenu vide et invariants de séparation contenu/géométrie.
- `ACCEPTANCE_CRITERIA`: template sans logique métier ni CSS public ; CV_ONLY
  respecté ; mêmes inputs et versions donnent le même tree fonctionnel.
- `OUT_OF_SCOPE`: Template #2, BusinessCard, Banner, Flyer, registre générique.
- `FAILURE_CONDITIONS`: slot wildcard, suppression sémantique, token implicite
  ou policy non versionnée.
- `ROLLBACK_OR_REWORK_RULE`: retirer le template en conservant les contrats ;
  ne pas modifier le DTO pour accommoder un template.
- `NEXT_GATE`: revue RendererAdapter du lot 4.

### LOT-04 — RendererAdapter

- `OBJECTIVE`: implémenter la frontière d'exécution indépendante du backend.
- `SCOPE`: Renderer Contract implementation, configuration versionnée,
  isolation, lifecycle, timeouts, ressources, collecte/normalisation mesures,
  traduction erreurs et observabilité.
- `INPUT_CONTRACTS`: `PresentationTree`, configuration immutable, trace context.
- `OUTPUT_CONTRACTS`: outcome normalisé, artefact éventuel, mesures, erreur
  typée, `RenderFeedback` compatible RFC-002.
- `DEPENDENCIES`: LOT-01, LOT-02, Chromium Production Boundary.
- `FILES_EXPECTED`: `src/renderer-adapter/`, `src/renderer-adapter/config/` et
  `tests/renderer-adapter/` ; aucune implémentation créée par ce plan.
- `TESTS_REQUIRED`: measurements, failures, RFC-002 mapping, timeout, cleanup,
  absence de fuite Chromium/DOM/CSS vers le Core.
- `ACCEPTANCE_CRITERIA`: `traceId`, `contextId`, `lineage`, `attempt` et toutes
  les versions propagés ; aucun secret ; boundary respectée.
- `OUT_OF_SCOPE`: moteur métier, orchestration générique, stockage, nouveau
  backend.
- `FAILURE_CONDITIONS`: contexte partagé, timeout non borné, fuite de message
  brut, résultat non corrélé ou contrôle non observable.
- `ROLLBACK_OR_REWORK_RULE`: désactiver l'intégration au backend et conserver
  les contrats ; aucun contournement du Renderer Contract.
- `NEXT_GATE`: intégration Chromium du lot 5.

### LOT-05 — Chromium Backend Integration

- `OBJECTIVE`: connecter Chromium Headless à l'Adapter dans la boundary ratifiée.
- `SCOPE`: lancement headless, sandbox, réseau, filesystem, fonts, locale,
  timezone, impression PDF, lifecycle et resource limits.
- `INPUT_CONTRACTS`: Renderer Contract et configuration immuable de LOT-04.
- `OUTPUT_CONTRACTS`: PDF/artefact et raw measurements remis à LOT-04.
- `DEPENDENCIES`: LOT-04, evidence closure Chromium, policy de déploiement.
- `FILES_EXPECTED`: `src/renderer-adapter/chromium/`, `deployment/chromium/`,
  `deployment/fonts/` et `tests/chromium/` ; aucune implémentation créée par
  ce plan.
- `TESTS_REQUIRED`: réseau bloqué par défaut, filesystem restreint, absence de
  credentials, sandbox, timeout, cleanup, fonts/environnement versionnés.
- `ACCEPTANCE_CRITERIA`: Chromium reste `CONCRETE_BACKEND` ; aucune API
  Chromium dans le Core ou le contrat public ; limites de ressources explicites.
- `OUT_OF_SCOPE`: support Paged.js/WeasyPrint, multi-backend, production
  rollout sans preuve de déploiement.
- `FAILURE_CONDITIONS`: accès externe implicite, font non déterministe,
  processus orphelin, limite absente ou PDF non produit.
- `ROLLBACK_OR_REWORK_RULE`: couper le backend derrière l'Adapter et préserver
  le contrat ; revenir à l'évidence connue sans modifier le Core.
- `NEXT_GATE`: feedback RFC-002 du lot 6.

### LOT-06 — RFC-002 Feedback

- `OBJECTIVE`: produire un feedback complet, typé et corrélé.
- `SCOPE`: `FIT`, `OVERFLOW`, `CONSTRAINT_VIOLATION`, `RENDER_FAILED`,
  `FIT_FAILED_UNRESOLVABLE`, diagnostics, tentative et lineage.
- `INPUT_CONTRACTS`: outcome normalisé de LOT-04/05, `RenderRequest`.
- `OUTPUT_CONTRACTS`: `RenderFeedback` RFC-002 et `RenderArtifact` éventuel.
- `DEPENDENCIES`: LOT-01, LOT-02, LOT-04, LOT-05.
- `FILES_EXPECTED`: `src/feedback/`, `src/feedback/diagnostics/` et
  `tests/feedback/` ; aucune implémentation créée par ce plan.
- `TESTS_REQUIRED`: chaque statut, diagnostics obligatoires, distinction des
  échecs, réconciliation bornée, corrélation et absence de mutation.
- `ACCEPTANCE_CRITERIA`: aucune conversion silencieuse entre statuts ; les
  mesures sont normalisées avant exposition ; artifact et feedback corrélés.
- `OUT_OF_SCOPE`: correction éditoriale automatique, moteur de contraintes
  maison, UI de feedback.
- `FAILURE_CONDITIONS`: diagnostic manquant, statut confondu, lineage perdue ou
  mutation du contenu.
- `ROLLBACK_OR_REWORK_RULE`: rejeter l'outcome fautif et conserver la requête
  originale ; corriger le mapping, jamais le contenu métier.
- `NEXT_GATE`: E2E du lot 7.

### LOT-07 — E2E CV

- `OBJECTIVE`: prouver le flux complet CV sur les fixtures et oracles ratifiés.
- `SCOPE`: DTO → Core → Tree → Adapter → Chromium → Artifact + Feedback.
- `INPUT_CONTRACTS`: tous les contrats des lots 1 à 6.
- `OUTPUT_CONTRACTS`: artefact PDF, feedback RFC-002, traces et rapport de test.
- `DEPENDENCIES`: LOT-01 à LOT-06, fixtures/oracles ci-dessous.
- `FILES_EXPECTED`: `tests/e2e/cv/`, `tests/fixtures/cv/` et
  `evidence/acceptance/` ; aucune implémentation créée par ce plan.
- `TESTS_REQUIRED`: six fixtures, répétitions déterministes, security probes,
  failure paths et vérification de lineage.
- `ACCEPTANCE_CRITERIA`: tous les critères V1 passent, sans snapshot visuel
  comme oracle unique.
- `OUT_OF_SCOPE`: déploiement général, autres artefacts, performance SLO non
  ratifié.
- `FAILURE_CONDITIONS`: divergence fonctionnelle, fuite, statut incorrect,
  trace perdue ou test non reproductible.
- `ROLLBACK_OR_REWORK_RULE`: isoler le lot fautif et rejouer les lots dépendants
  ; ne pas déclarer READY_TO_CODE sur une preuve partielle.
- `NEXT_GATE`: `GATE-SLYDESIGN-READY-TO-CODE-001`.

## 4. Test strategy

```text
TEST_STRATEGY_STATUS = DEFINED
```

- Contract tests : DTO, `Slot<T>`, `RenderRequest`, `TemplateContract`,
  `RenderFeedback`, versioning et propagation de contexte.
- Core tests : validation, résolution template, slot access policy,
  tokens/policies, composition, `PresentationTree`, non-mutation sémantique.
- Adapter tests : normalisation mesures/erreurs, mapping RFC-002, isolation,
  timeout, cleanup et absence de fuite DOM/CSS/Chromium vers le Core.
- Determinism tests : même entrée, fixtures, fonts, locale, timezone, versions
  et configuration → signatures fonctionnelles équivalentes ; les hashes PDF
  ne sont exigés que si la politique de métadonnées les rend déterministes.
- E2E : flux complet sur les six fixtures, diagnostics et lineage.
- Visual snapshots : complémentaires uniquement, jamais oracle principal.

## 5. Fixtures et oracles

```text
FIXTURES_STATUS = AVAILABLE_FROM_BENCHMARK
ORACLES_STATUS = DEFINED
```

| Fixture | Expected status | Page count oracle | Diagnostic | Slot behavior | Semantic integrity |
|---|---|---:|---|---|---|
| `CV_FIXTURE_01` / `CV_SHORT` | `FIT` | `1` | none | all declared slots accepted | unchanged |
| `CV_FIXTURE_02` / `CV_STANDARD` | `FIT` | `2` | none | page break remains structural | unchanged |
| `CV_FIXTURE_03` / `CV_DENSE` | `FIT` | `4` | none | all repeated experience slots preserved | unchanged |
| `CV_FIXTURE_04` / `CV_OVERFLOW` | `OVERFLOW` | `>= 1` | `OVERFLOW` | affected slots and document scope reported | unchanged |
| `CV_FIXTURE_05` / `CV_UNICODE` | `FIT` | `1` | none | Unicode and accents preserved | unchanged |
| `CV_FIXTURE_06` / `CV_CONSTRAINT_VIOLATION` | `CONSTRAINT_VIOLATION` | `3` | `CONSTRAINT_VIOLATION` | target constraint identified | unchanged |

`RENDER_FAILED` est couvert par l'oracle dédié de fermeture de cible Chromium,
avec `BROWSER_TARGET_CLOSED` en étape `PDF_SERIALIZATION`. Un cas
`FIT_FAILED_UNRESOLVABLE` doit être produit par épuisement de la borne de
réconciliation, jamais par conversion d'un échec technique.

## 6. Acceptance criteria V1

```text
[ ] DTO public respecté
[ ] aucune donnée physique/CSS dans PresentationDocumentDTO
[ ] templates sans logique métier
[ ] slot contract appliqué
[ ] Renderer abstraction préservée
[ ] Chromium uniquement derrière RendererAdapter
[ ] PDF généré
[ ] FIT détecté
[ ] OVERFLOW détecté
[ ] CONSTRAINT_VIOLATION détecté
[ ] RENDER_FAILED détecté
[ ] feedback corrélé au RenderRequest
[ ] traceId/contextId/lineage propagés
[ ] déterminisme fonctionnel démontré
[ ] aucune mutation éditoriale
[ ] aucune persistance dans SlyDesign
[ ] tests E2E PASS
```

Ces cases restent non cochées jusqu'à l'implémentation et aux preuves
correspondantes. Elles constituent le minimum d'acceptation, pas une
autorisation anticipée.

## 7. Observability readiness

```text
OBSERVABILITY_READINESS_STATUS = DEFINED
```

Chaque rendu expose au minimum, hors contrat métier public :

`request_id`, `traceId`, `contextId`, `lineage`, `template_id/version`,
`contractVersion`, `designPolicyVersion`, `tokenSetVersion`, `rendererVersion`,
`render_duration`, `status`, `diagnostics_count`.

Les logs doivent être corrélables, assainis et séparés des détails DOM/CSS et
des secrets. Aucun chantier d'observabilité général n'est ouvert.

## 8. Security readiness

```text
SECURITY_READINESS_STATUS = DEFINED_WITH_DEPLOYMENT_PROOF_REQUIRED
```

- réseau désactivé par défaut ; ressources externes refusées sauf allowlist
  gouvernée ;
- accès filesystem restreint aux ressources autorisées ;
- timeout global et timeouts d'étapes obligatoires ;
- lifecycle Chromium nettoyé en succès, échec et timeout ;
- CPU, mémoire, processus et concurrence bornables par le déploiement ;
- aucune credential transmise au Renderer ;
- fonts, locale, timezone, Chromium et configuration versionnés ;
- sandbox OS active et vérifiable.

Les preuves harness existantes ne remplacent pas la preuve de déploiement.

## 9. READY_TO_CODE gate

```text
GATE-SLYDESIGN-READY-TO-CODE-001
```

Checklist normative :

```text
[x] architecture ratifiée
[x] modèle 2 nœuds ratifié
[x] backend V1 ratifié
[x] lots ordonnés
[x] contrats d'entrée/sortie connus
[x] dépendances connues
[x] fixtures disponibles
[x] oracles définis
[x] critères d'acceptation définis
[x] stratégie de test définie
[x] stratégie sécurité définie
[x] observabilité minimale définie
[x] aucune question architecturale bloquante
[x] aucune technologie non ratifiée requise
```

```text
READY_TO_CODE = YES
CODE_AUTHORITY = NOT_GRANTED
```

La documentation est acceptée par `GATE-SLYDESIGN-READY-TO-CODE-001`. Elle
n'accorde aucune écriture de code ; l'autorité devra être accordée
progressivement par lot.

## 10. Sortie de mission

```text
IMPLEMENTATION_READINESS_STATUS = ACCEPTED
IMPLEMENTATION_LOTS = LOT-01..LOT-07
DEPENDENCY_ORDER = LOT-01 → LOT-02 → LOT-03 → LOT-04 → LOT-05 → LOT-06 → LOT-07
TEST_STRATEGY_STATUS = DEFINED
FIXTURES_STATUS = AVAILABLE_FROM_BENCHMARK
ORACLES_STATUS = DEFINED
SECURITY_READINESS_STATUS = DEFINED_WITH_DEPLOYMENT_PROOF_REQUIRED
OBSERVABILITY_READINESS_STATUS = DEFINED
ACCEPTANCE_CRITERIA_STATUS = DEFINED
BLOCKERS = NONE_ARCHITECTURAL
CODE_MODIFIED = NO
NEXT_GATE = GATE-SLYDESIGN-LOT1-AUTHORIZATION-001
```
