# SLYDESIGN-MODULE-STRUCTURE-001 — Architecture interne et modèle de nœuds

```yaml
artifact_id: SLYDESIGN-MODULE-STRUCTURE-001
artifact_type: ARCHITECTURE_PROPOSAL
project_id: SLYDESIGN
module_id: SLYDESIGN
mission_ref: SLYDESIGN-MODULE-STRUCTURE-001
status: PROPOSED
authority: Architecture / Coordinateur Central
code_modified: NO
code_authority: NOT_GRANTED
next_gate: GATE-SLYDESIGN-MODULE-STRUCTURE-ADJUDICATION-001
```

## 1. Résultat de la découverte

Le flux impose les responsabilités suivantes : validation contractuelle,
résolution de template, résolution des tokens et policies, composition du
`Presentation Tree`, délégation au renderer, collecte et normalisation des
mesures, production de `RenderArtifact` et production de `RenderFeedback`.

La frontière Chromium ratifiée impose cependant que le Core reste indépendant
du navigateur et que l'Adapter porte l'exécution concrète. Les responsabilités
identifiées ne deviennent donc pas automatiquement des nœuds.

```text
PresentationDocumentDTO
        ↓
SlyDesign Core
  ├── validation / contract handling
  ├── template resolution / slot validation
  ├── tokens / policies resolution
  ├── presentation composition
  ├── orchestration
  └── Presentation Tree
        ↓ Renderer Contract
RendererAdapter
  ├── versioned Chromium configuration
  ├── isolated lifecycle and resource controls
  ├── raw measurements collection and normalization
  └── error translation
        ↓ production boundary
Chromium Headless
        ↓
RenderArtifact + normalized measurements
        ↓
RenderFeedback
```

`RenderArtifact` et `RenderFeedback` sont des sorties contractuelles du
pipeline, pas des nœuds SlyDesign autonomes.

## 2. Règle d'admission appliquée

Un nœud est admis seulement s'il possède une responsabilité autonome, un
contrat identifiable, des invariants et des modes d'échec propres, une
testabilité et une frontière d'évolution utiles. Une fonction ou une classe
ne constitue pas à elle seule un nœud.

## 3. Responsabilités et admission

| Responsabilité | Placement | Admission | Justification |
|---|---|---|---|
| Validation du DTO et des slots | Core | `INTERNAL_RESPONSIBILITY` | Même invariant d'entrée et même frontière de contrat |
| Template Contract / resolution | Core | `INTERNAL_RESPONSIBILITY` | Aucun remplacement autonome justifié en CV-only |
| Tokens et Design Policies | Core | `INTERNAL_RESPONSIBILITY` | Résolution déterministe de composition |
| Composition du Presentation Tree | Core | `INTERNAL_RESPONSIBILITY` | Produit la sortie intermédiaire du même pipeline |
| Orchestration du pipeline | Core | `INTERNAL_RESPONSIBILITY` | Pas de workflow générique requis |
| Renderer Contract | Boundary contract | `CONTRACT` | Frontière normative, pas un nœud d'exécution |
| Chromium configuration/lifecycle | RendererAdapter | `ARCHITECTURAL_NODE` | Isolation, ressources et remplacement indépendant |
| Mesures brutes et normalisation | RendererAdapter | `INTERNAL_RESPONSIBILITY` | Couplées au backend et à la traduction de résultat |
| Traduction des erreurs | RendererAdapter | `INTERNAL_RESPONSIBILITY` | Même boundary de sécurité et d'assainissement |
| RenderFeedback / diagnostics | Core output fed by Adapter | `CONTRACT_OUTPUT` | RFC-002 impose une sortie, pas un service |
| RenderArtifact | Pipeline output | `CONTRACT_OUTPUT` | Stockage hors SlyDesign |

## 4. Modèles candidats

### Candidate A — Core + RendererAdapter

```text
ARCHITECTURAL_NODE: SlyDesign Core
        ↓ Renderer Contract
ARCHITECTURAL_NODE: RendererAdapter
        ↓ production boundary
CONCRETE_BACKEND: Chromium Headless
```

```text
NODE_COUNT = 2
```

- `ADVANTAGES`: minimalité, frontière ratifiée lisible, faible couplage,
  remplacement backend possible et testabilité claire.
- `RISKS`: Core large ; ses responsabilités internes doivent être documentées
  sans être artificiellement séparées.
- `OVER_ENGINEERING_RISK`: faible.
- `BOUNDARY_QUALITY`: forte, conforme à la boundary Chromium.
- `TESTABILITY`: forte par tests contractuels du Core et tests d'intégration de
  l'Adapter.

### Candidate B — Core + Design Composition + RendererAdapter

```text
ARCHITECTURAL_NODE: SlyDesign Core
        ↓ Design Composition Contract
ARCHITECTURAL_NODE: Design Composition
        ↓ Renderer Contract
ARCHITECTURAL_NODE: RendererAdapter
        ↓ production boundary
CONCRETE_BACKEND: Chromium Headless
```

```text
NODE_COUNT = 3
```

`Design Composition` porterait template resolution, tokens/policies et
composition du tree.

- `ADVANTAGES`: séparation future possible si plusieurs familles de templates
  ou modes de composition apparaissent.
- `RISKS`: aucune frontière de remplacement ou failure mode suffisamment
  démontré en `CV_ONLY`; contrat supplémentaire spéculatif.
- `OVER_ENGINEERING_RISK`: moyen à élevé.
- `BOUNDARY_QUALITY`: correcte, mais prématurée.
- `TESTABILITY`: bonne, au prix d'une surface contractuelle inutile aujourd'hui.

### Candidate C — Core + Feedback Normalizer + RendererAdapter

```text
ARCHITECTURAL_NODE: SlyDesign Core
        ↓ Renderer Contract
ARCHITECTURAL_NODE: RendererAdapter
        ↓ Raw Measurement Contract
ARCHITECTURAL_NODE: Feedback Normalizer
        ↓ production boundary
CONCRETE_BACKEND: Chromium Headless
```

```text
NODE_COUNT = 3
```

`Feedback Normalizer` porterait la traduction des mesures et erreurs en
`RenderFeedback` RFC-002.

- `ADVANTAGES`: visibilité dédiée de la normalisation.
- `RISKS`: normalisation actuellement indissociable de l'Adapter ; risque de
  fuite de détails backend dans une interface supplémentaire.
- `OVER_ENGINEERING_RISK`: élevé.
- `BOUNDARY_QUALITY`: moins nette que la boundary ratifiée.
- `TESTABILITY`: bonne localement, mais surface contractuelle superflue.

## 5. Recommandation

```text
RECOMMENDED_NODE_MODEL = CANDIDATE_A
RECOMMENDED_NODE_COUNT = 2
RECOMMENDED_NODE_LIST = SlyDesign Core; RendererAdapter
MODULE_STRUCTURE_STATUS = PROPOSED
```

Deux nœuds suffisent. Le Core est une boundary autonome car il porte le
contrat de présentation, les invariants de composition et la préservation de
la sémantique. Le `RendererAdapter` est une boundary autonome car il porte
l'exécution isolée, le lifecycle, les ressources, le couplage Chromium et la
remplaçabilité du backend.

`Template Resolution`, `Design Tokens`, `Design Policies`, `Presentation Tree`,
les diagnostics et l'orchestration restent des responsabilités internes ou
des sorties contractuelles tant qu'une nouvelle frontière n'est pas démontrée.

## 6. Contrats inter-nœuds conceptuels

### Contract A — Presentation Input Contract

```text
Upstream SlyCV
        ↓ PresentationDocumentDTO + versioned request context
SlyDesign Core
```

- responsabilité : remettre une présentation structurée, sans géométrie ni
  logique de renderer ;
- input : DTO, références immuables template/policy/token et lineage ;
- output : `PresentationTree` valide ou diagnostic contractuel d'entrée ;
- erreurs : slot requis manquant, slot inconnu, type incompatible, référence
  de configuration invalide ;
- versioning : versions immuables de RFC-001, template, policy et token set ;
- lineage : entrée et contexte de corrélation propagés sans mutation métier.

### Contract B — Renderer Contract

```text
SlyDesign Core
        ↓ Renderer Contract: PresentationTree + immutable renderer configuration
RendererAdapter
```

- responsabilité : déléguer une présentation backend-agnostique ;
- input : `PresentationTree`, configuration immuable et lineage ;
- output : résultat de rendu interne avec artefact, mesures et état ;
- erreurs : échec typé et assaini, sans détail DOM/Chromium ;
- versioning : contrat de renderer et configuration versionnés séparément ;
- propagation : `traceId` et `contextId` obligatoires et stables sur toute la
  requête ; `lineage` propagée et enrichie uniquement par les relations de
  tentative ; versions immuables du contrat, template, policy, token set,
  renderer et backend explicitement attachées.

### Contract C — Render Outcome Contract

```text
RendererAdapter
        ↓ normalized outcome: artifact + measurements + typed failure
SlyDesign Core
        ↓ RenderFeedback / RenderArtifact
SlyDesign caller and Output Service boundary
```

- responsabilité : exposer le résultat sans fuite backend et préserver RFC-002 ;
- input : artefact éventuel, mesures normalisées, erreur éventuelle et lineage ;
- output : `RenderArtifact` et `RenderFeedback` ;
- erreurs : `FIT`, `OVERFLOW`, `CONSTRAINT_VIOLATION`, `RENDER_FAILED` et
  `FIT_FAILED_UNRESOLVABLE` restent distincts ;
- versioning : RFC-002 et schéma de diagnostic versionnés ;
- propagation : `traceId`, `contextId`, `lineage`, `attempt` et toutes les
  versions ratifiées restent corrélés à la requête d'origine ;
- invariant : aucune mutation éditoriale ou réconciliation implicite.

## 7. Graphe final proposé

```text
BOUNDARY_IN: PresentationDocumentDTO / RenderRequest
        ↓
┌─────────────────────────────────────────────────────────────┐
│ ARCHITECTURAL_NODE — SlyDesign Core                        │
│ INTERNAL_RESPONSIBILITIES: validation · template resolution │
│ slots · tokens/policies · composition · Presentation Tree   │
│ orchestration · RFC-002 outcome interpretation              │
└─────────────────────────────────────────────────────────────┘
        ↓ CONTRACT — Renderer Contract
┌─────────────────────────────────────────────────────────────┐
│ ARCHITECTURAL_NODE — RendererAdapter                        │
│ INTERNAL_RESPONSIBILITIES: config · lifecycle · isolation    │
│ resources · Chromium invocation · measurements              │
│ normalization · errors · observability/lineage              │
└─────────────────────────────────────────────────────────────┘
        ═══════════════ PRODUCTION BOUNDARY ═══════════════════
        ↓
CONCRETE_BACKEND: Chromium Headless
        ↓
RenderArtifact + normalized measurements / typed failure
        ↓
RenderFeedback (RFC-002) + artifact handoff to Output Service
```

## 8. YAGNI check

```text
GENERIC_PLUGIN_ENGINE          = ABSENT
FLOW_FIXED_CANVAS_ABSTRACTION  = ABSENT
VISUAL_EDITOR                  = ABSENT
BUSINESSCARD_BANNER_RUNTIME    = ABSENT
COMPLEX_TEMPLATE_REGISTRY      = ABSENT
CUSTOM_CONSTRAINT_ENGINE       = ABSENT
STORAGE                        = ABSENT
SLYCV_BUSINESS_LOGIC           = ABSENT
SEMANTIC_MUTATION              = ABSENT
```

## 9. Sortie de mission

```text
MODULE_STRUCTURE_STATUS = PROPOSED
RESPONSIBILITIES_IDENTIFIED = YES
RECOMMENDED_NODE_COUNT = 2
RECOMMENDED_NODE_LIST = SlyDesign Core; RendererAdapter
INTERNAL_RESPONSIBILITIES = validation; template resolution; tokens/policies; composition; orchestration; measurement normalization; error translation
INTER_NODE_CONTRACTS = Presentation Input Contract; Renderer Contract; Render Outcome Contract
FINAL_GRAPH = DOCUMENTED_ABOVE
YAGNI_CHECK = PASS
CONFLICTS = NONE_IDENTIFIED
CODE_MODIFIED = NO
NEXT_GATE = GATE-SLYDESIGN-MODULE-STRUCTURE-ADJUDICATION-001
```
