# ADR-SLYDESIGN-001 — VISUAL RENDERING EXECUTION BACKEND

```yaml
artifact_id: ADR-SLYDESIGN-001
artifact_type: ADR
capability_id: SLYDESIGN
program_id: SLYCV
arc_id: N/A
mission_id: SLYDESIGN-ADR-001-REWORK-001
status: RATIFIED_WITH_LIMITATIONS
authority: Architecture / Coordinateur Central
supersedes: N/A
references:
  - RFC-SLYDESIGN-001_PRESENTATION_DOCUMENT_CONTRACT_AND_SLOT_ARCHITECTURE.md
  - RFC-SLYDESIGN-002_OVERFLOW_AND_FEEDBACK_PROTOCOL.md
  - ../BOUSSOLE.md
evidence_sources:
  - https://playwright.dev/docs/api/class-browsercontext
  - https://pptr.dev/api/puppeteer.page.pdf
  - https://pagedjs.org/en/about/
  - https://doc.courtbouillon.org/weasyprint/stable/index.html
```

## 1. Décision en synthèse

```text
RENDERER_ARCHITECTURE = BACKEND_AGNOSTIC
ABSTRACT_RENDERER_CONTRACT = ACCEPTED
CURRENT_SCOPE = CV_ONLY
V1_CV_BACKEND = CHROMIUM_HEADLESS
DECISION_CONFIDENCE = MEDIUM_WITH_LIMITATIONS
```

L'abstraction Renderer est acceptée comme frontière architecturale. Chromium
Headless derrière un `RendererAdapter` est ratifié comme cible V1 CV, avec les
limitations et conditions du gate `GATE-SLYDESIGN-CHROMIUM-RATIFICATION-001`.

La recommandation de benchmark prioritaire est :

1. Chromium Headless derrière un `RendererAdapter`, avec une couche de
   pilotage isolée ;
2. WeasyPrint comme alternative PDF paginée indépendante ;
3. Paged.js uniquement comme couche de pagination à évaluer au-dessus d'un
   navigateur, et non comme moteur concurrent autonome.

Cette shortlist n'est pas une sélection technologique.

## 2. Frontière architecture / backend

```text
PresentationDocumentDTO<TSlotMap>
        ↓
SlyDesign Core
        ↓
Presentation Tree
        ↓
Renderer Contract
        ↓
Renderer Adapter
        ↓
Concrete Backend
```

Remplacer le Concrete Backend MUST NOT nécessiter de modifier
`PresentationDocumentDTO`, le contrat de slots, la stratégie métier amont ou
les contrats de feedback.

L'interface publique SlyDesign MUST NOT exposer :

```text
DOM
CSS
Chromium
Playwright
Puppeteer
Paged.js
browser-specific objects
```

Ces éléments peuvent exister derrière le `Renderer Adapter`. Le Core ne
connaît qu'un contrat de présentation abstrait et les diagnostics normalisés.

## 3. Renderer Contract abstrait

```text
Renderer
├── render(
│     presentation_tree: PresentationTree,
│     resolved_design_tokens: ResolvedDesignTokens,
│     design_policy: DesignPolicy,
│     renderer_configuration: RendererConfiguration
│   )
└── returns RendererResult
```

```text
RendererResult
├── artifact: RenderArtifact | null
├── measurements: RenderMeasurements
└── diagnostics: RawOrNormalizedRenderDiagnostics[]
```

### 3.1 Entrées

| Entrée | Règle |
|---|---|
| `PresentationTree` | Arbre produit par SlyDesign Core ; aucune structure DOM requise |
| `ResolvedDesignTokens` | Tokens déjà résolus et versionnés ; aucun token métier |
| `DesignPolicy` | Policy versionnée qui définit contraintes et seuils |
| `RendererConfiguration` | Configuration immuable et déterminante du rendu |

### 3.2 Sorties

| Sortie | Règle |
|---|---|
| `RenderArtifact` | Artefact compilé ou `null` si le rendu échoue ; stockage hors Renderer |
| `RenderMeasurements` | Mesures normalisées, indépendantes du backend |
| `diagnostics` | Erreurs ou mesures brutes remises à l'adapter pour normalisation |

Le Renderer ne sélectionne pas le contenu, ne modifie pas le payload et ne
résout pas une violation sémantique. Il mesure, compile et signale.

## 4. Measurements Contract

L'adapter doit fournir au protocole SlyDesign, lorsque la plateforme de rendu
le permet :

```text
RenderMeasurements
├── page_count: Integer
├── page_bounds: PageBounds[]
├── content_bounds: Bounds | null
├── slot_bounds: SlotBounds[]
├── overflow_height: Number | null
├── overflow_width: Number | null
├── affected_regions: RegionId[]
└── constraint_measurements: ConstraintMeasurement[]
```

Les mesures internes peuvent avoir un format propre au backend. Le
`Renderer Adapter` les convertit vers les mesures normalisées ; SlyDesign
produit ensuite le `RenderFeedback` RFC-002 :

```text
Concrete Backend
    → raw measurements / backend failures
Renderer Adapter
    → normalized measurements / normalized failures
SlyDesign protocol
    → FIT | FIT_WITH_DENSITY_ADJUSTMENT | OVERFLOW
      | CONSTRAINT_VIOLATION | RENDER_FAILED
      | FIT_FAILED_UNRESOLVABLE
```

Un backend qui ne permet pas d'identifier les régions affectées ou les
contraintes pertinentes ne peut pas être accepté sans stratégie de mesure
complémentaire démontrée.

## 5. Catégories de candidats

Les candidats ne sont pas des équivalents techniques :

| Catégorie | Candidats | Rôle |
|---|---|---|
| Rendering engine | Chromium Headless | Moteur HTML/CSS et impression PDF |
| Browser automation / execution layer | Playwright, Puppeteer | Pilotage, isolation de contexte, lifecycle et observation du navigateur |
| Pagination layer | Paged.js | Polyfill paged-media et fragmentation exécuté dans un navigateur |
| Alternative document renderer | WeasyPrint | Moteur HTML/CSS orienté génération PDF paginée |
| Native vector renderer | Moteur vectoriel natif | Alternative spécialisée, coût de construction plus élevé |

Playwright et Puppeteer ne sont donc pas comparés à Chromium comme deux
moteurs de rendu indépendants. Ils peuvent fournir la couche de pilotage d'un
stack Chromium.

Les documentations officielles indiquent notamment que Puppeteer expose une
opération PDF utilisant le média `print`, que Paged.js agit comme polyfill
Paged Media dans le navigateur, et que WeasyPrint transforme HTML/CSS en PDF
avec un moteur conçu pour la pagination :

- [Playwright BrowserContext](https://playwright.dev/docs/api/class-browsercontext)
- [Puppeteer `Page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf)
- [Paged.js — About](https://pagedjs.org/en/about/)
- [WeasyPrint — documentation](https://doc.courtbouillon.org/weasyprint/stable/index.html)

## 6. Matrice de décision pondérée

Les scores ci-dessous sont des scores de cadrage `1..5`, non des preuves de
production. `5` est favorable. Les scores de performance, mémoire,
déterminisme, sécurité et mesure restent `TO_BE_BENCHMARKED` avant toute
ratification.

Notation compacte par candidat : `Native / Integration / Operational / Risk`.
Pour les coûts, risques et complexités, la valeur `5` signifie la situation
la plus favorable après maîtrise opérationnelle.

| Criterion | Weight | Chromium Headless + Adapter | Chromium + Paged.js + Adapter | WeasyPrint Adapter | Native Vector Adapter | Evidence Required |
|---|---:|---:|---:|---:|---:|---|
| PDF generation | 10 | 5 / 4 / 4 / 4 | 5 / 3 / 3 / 3 | 5 / 4 / 4 / 4 | 4 / 2 / 2 / 2 | PDF fixtures, metadata, fonts |
| CV pagination | 12 | 4 / 4 / 4 / 3 | 5 / 3 / 3 / 3 | 4 / 4 / 4 / 4 | 2 / 2 / 2 / 2 | Multi-page CV corpus |
| HTML/CSS capability | 10 | 5 / 4 / 4 / 3 | 5 / 3 / 3 / 2 | 3 / 4 / 4 / 3 | 1 / 2 / 2 / 2 | CSS feature fixture |
| Headless execution | 6 | 5 / 4 / 4 / 3 | 5 / 3 / 3 / 2 | 4 / 4 / 4 / 4 | 5 / 2 / 2 / 3 | Isolated process runs |
| Overflow measurement | 10 | 4 / 3 / 3 / 3 | 4 / 3 / 2 / 2 | 3 / 3 / 3 / 3 | 5 / 2 / 2 / 3 | Slot and region bounds |
| Constraint measurement | 8 | 3 / 3 / 3 / 3 | 4 / 2 / 2 / 2 | 3 / 3 / 3 / 3 | 5 / 2 / 2 / 3 | Policy violation fixtures |
| Typography / fonts | 8 | 5 / 4 / 3 / 3 | 5 / 3 / 2 / 2 | 4 / 4 / 4 / 3 | 3 / 2 / 2 / 2 | Font-set snapshots |
| Deterministic rendering | 10 | 3 / 3 / 2 / 2 | 3 / 2 / 2 / 2 | 4 / 4 / 4 / 3 | 5 / 2 / 2 / 3 | Repeated binary/PDF comparison |
| Security / isolation | 8 | 3 / 3 / 2 / 2 | 2 / 2 / 2 / 1 | 4 / 4 / 4 / 3 | 5 / 2 / 2 / 3 | Threat model and sandbox proof |
| Automated testability | 6 | 5 / 4 / 4 / 3 | 5 / 3 / 3 / 2 | 4 / 4 / 4 / 3 | 3 / 2 / 2 / 2 | Golden and property fixtures |
| Performance | 4 | 3 / 3 / 2 / 2 | 2 / 2 / 2 / 1 | 4 / 4 / 4 / 3 | 2 / 2 / 2 / 2 | Cold/warm benchmark |
| Memory footprint | 3 | 2 / 3 / 2 / 2 | 2 / 2 / 2 / 1 | 4 / 4 / 4 / 3 | 2 / 2 / 2 / 2 | Peak RSS benchmark |
| Operational simplicity | 2 | 3 / 3 / 3 / 3 | 2 / 2 / 2 / 2 | 4 / 4 / 4 / 3 | 1 / 2 / 2 / 2 | Deployment runbook |
| Backend isolation | 1 | 4 / 4 / 3 / 3 | 3 / 3 / 2 / 2 | 4 / 4 / 4 / 3 | 4 / 2 / 2 / 3 | Adapter boundary review |
| Backend replaceability | 1 | 4 / 4 / 3 / 3 | 3 / 3 / 2 / 2 | 4 / 4 / 4 / 3 | 3 / 2 / 2 / 2 | Contract compatibility gate |
| Future multi-format potential | 1 | 4 / 4 / 3 / 3 | 4 / 3 / 2 / 2 | 3 / 3 / 3 / 3 | 4 / 2 / 2 / 2 | Non-V1 capability note |

La pondération privilégie `CV_ONLY` : PDF, pagination, HTML/CSS, overflow,
contraintes, typographie et déterminisme représentent l'essentiel du score.
Le potentiel multi-format ne pèse qu'un point et ne peut pas justifier à lui
seul un choix V1.

Les scores agrégés sont indicatifs tant que les preuves requises n'existent
pas. Ils ne constituent donc pas une décision de backend.

## 7. RFC-002 — mesures et diagnostics

Le backend et son adapter doivent permettre la distinction suivante :

| Situation | Production du stack Renderer | Feedback RFC-002 |
|---|---|---|
| Artefact produit, toutes contraintes satisfaites | Artefact + mesures | `FIT` |
| Artefact produit après policy visuelle autorisée | Artefact + mesures + adjustment | `FIT_WITH_DENSITY_ADJUSTMENT` |
| Artefact produit hors contrainte de surface | Mesures avec page/slot/région affectés | `OVERFLOW` |
| Règle de design ou composition violée | Mesure de contrainte et cible | `CONSTRAINT_VIOLATION` |
| Backend incapable de produire | Échec normalisé et sanitized | `RENDER_FAILED` |
| Fitting non résolu après bornes RFC-002 | Diagnostics cumulés | `FIT_FAILED_UNRESOLVABLE` |

Le backend ne décide jamais de modifier le contenu. Le `Renderer Adapter`
normalise les mesures et les erreurs ; le protocole SlyDesign décide du statut
RFC-002 et de la possibilité de réconciliation.

## 8. Déterminisme

Les éléments suivants sont des entrées déterminantes et doivent être
versionnés ou référencés immuablement :

```text
renderer_engine
renderer_engine_version
browser_version
font_set
font_versions
locale
timezone
page_configuration
render_configuration
token_set
design_policy
```

La configuration V1 doit également fixer :

- animations désactivées ou terminées avant mesure ;
- temps et horloges non utilisés pour modifier le rendu ;
- chargement asynchrone interdit après le point de mesure ;
- ressources externes interdites par défaut ;
- fonts distantes interdites ;
- réseau désactivé par défaut et explicitement contrôlable par policy ;
- contenu dynamique et scripts non autorisés sans policy dédiée et preuve.

Invariant :

```text
Même entrée + mêmes versions + même configuration déterminante
MUST produire un résultat fonctionnellement équivalent.
```

Les ressources réseau implicites MUST être interdites. Les différences
techniques non déterminées par la configuration doivent produire un échec ou
être éliminées par l'environnement d'exécution versionné.

## 9. Sécurité et isolation

Tout backend candidat doit fournir ou être enveloppé par :

```text
sandbox / process isolation
network policy
filesystem policy
CPU limit
memory limit
execution timeout
external-resource policy
untrusted-content handling
```

Le Renderer ne dispose pas implicitement :

- d'un accès réseau libre ;
- d'un accès filesystem arbitraire ;
- de secrets applicatifs ;
- de credentials utilisateur.

HTML, CSS, images, SVG, fonts et autres assets sont traités comme contenus
non fiables jusqu'à preuve contraire. Le stack doit appliquer une liste de
protocoles et de chemins autorisés, isoler le processus de rendu et produire
un échec normalisé en cas de violation.

Les preuves attendues sont un threat model, une configuration sandbox
reproductible, des tests de ressources externes et des tests de dépassement
de timeout/mémoire.

## 10. Performance et exploitation

Aucune performance théorique n'est ratifiée. Le benchmark ultérieur doit
mesurer par backend et par profil CV :

```text
cold_start
warm_render
memory_peak
CPU
render_duration
concurrent_renders
failure_rate
```

Toute valeur de seuil non mesurée est `TO_BE_BENCHMARKED`. Les résultats
devront être associés à une version de backend, un corpus, une configuration,
un environnement et une méthode de mesure.

## 11. Migration et backend replacement

Un Compatibility Gate est requis avant d'introduire un nouveau backend. Le
backend candidat doit :

- consommer le même Renderer Contract ;
- préserver les invariants RFC-001 ;
- produire les mesures et diagnostics nécessaires à RFC-002 ;
- respecter les mêmes politiques de déterminisme et de sécurité ;
- passer les fixtures de référence ;
- passer les tests de contenu extrême ;
- ne nécessiter aucun changement du DTO public.

Un `RendererCapabilityManifest` peut être utilisé comme document de
compatibilité minimal, non comme système de plugins :

```text
RendererCapabilityManifest
├── renderer_id
├── renderer_version
├── supported_artifact_kinds
├── supported_measurements
├── supported_diagnostics
├── determinism_profile
└── security_profile
```

Ce manifest reste une déclaration vérifiable. Il ne devient ni un registre de
domaines, ni une marketplace, ni une nouvelle architecture de nœuds.

## 12. Décision V1 après evidence closure

```text
ABSTRACT_RENDERER_CONTRACT = ACCEPTED
V1_CV_BACKEND = CHROMIUM_HEADLESS
DECISION_CONFIDENCE = MEDIUM_WITH_LIMITATIONS
```

La décision est limitée par le gel des polices, les métadonnées PDF, la preuve
de déploiement de l'isolation et l'échantillonnage RSS partiel. Le prochain
travail autorisé est la preuve de la frontière d'exécution, pas encore une
implémentation de SlyDesign.

## 13. ADR-001 Architectural Acceptance Gate

```text
[ ] Renderer Contract backend-agnostic
[ ] PresentationDocumentDTO indépendant du backend
[ ] Architecture abstraite séparée du choix V1
[ ] Candidats correctement catégorisés
[ ] Matrice pondérée présente
[x] PDF et pagination CV évalués
[x] Measurements RFC-002 couverts
[x] OVERFLOW / CONSTRAINT / RENDER_FAILED distinguables
[x] Déterminisme spécifié
[ ] Fonts / locale / timezone / versions maîtrisés — limitation documentée
[x] Ressources réseau implicites interdites
[x] Isolation et sécurité spécifiées
[x] Performance et mémoire évaluables — observation, pas limite ratifiée
[ ] Migration backend définie
[x] Aucun besoin futur différé ne surpondère la décision V1
[x] Aucun code introduit
```

Cette décision n'ouvre pas la Phase 2, ne crée pas de nœuds et n'accorde pas
la `CODE_AUTHORITY`. La preuve de déploiement reste obligatoire au prochain
gate avant toute implémentation runtime.
