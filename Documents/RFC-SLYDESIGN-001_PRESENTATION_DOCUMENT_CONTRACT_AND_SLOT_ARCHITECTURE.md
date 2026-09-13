# RFC-SLYDESIGN-001 — PRESENTATION DOCUMENT CONTRACT AND SLOT ARCHITECTURE

```yaml
artifact_id: RFC-SLYDESIGN-001
artifact_type: RFC
capability_id: SLYDESIGN
program_id: SLYCV
arc_id: N/A
mission_id: SLYDESIGN-DOC-FOUNDATION-001
status: REWORKED_PENDING_READJUDICATION
authority: Architecture / Coordinateur Central
supersedes: N/A
references:
  - ../README.md
  - ../BOUSSOLE.md
  - RFC-SLYDESIGN-002_OVERFLOW_AND_FEEDBACK_PROTOCOL.md
  - ../../SlyPlatform/Documents/RFC-SLYPLATFORM-ARCH-CV-001_MODULAR_PIPELINE_CONTRACTS.md
  - ../../SlyPlatform/Documents/ADR-SLYPLATFORM-ARCH-CV-001_PIPELINE_RESPONSIBILITY_BOUNDARIES.md
```

## 1. Objet et portée

Cette RFC fixe le contrat d'entrée et les frontières de composition de
SlyDesign. Elle ne constitue pas une autorisation d'implémentation.

La V1 est limitée à `CV_ONLY`. BusinessCard, Banner et tout autre artefact
sont des preuves d'extensibilité du contrat, pas des domaines implémentés.

## 2. Runtime execution example

La chaîne suivante est un exemple de flux d'exécution applicatif. Elle ne
redéfinit pas la topologie structurelle canonique de la plateforme :

```text
RUNTIME_EXECUTION_EXAMPLE
Producer Application (SlyCV dans cet exemple)
      ↓
Producer Adapter
      ↓
PresentationDocumentDTO<TSlotMap>
      ↓
SlyDesign Core
      ↓
Presentation Tree → Renderer → document compilé
      ↓
SlyOrganize — naming / storage / indexation
```

Le producteur peut être SlyCV, mais SlyCV n'est qu'un exemple de producer.
Le `Producer Adapter` convertit le contrat propre au producteur vers le DTO
public de SlyDesign.

```text
STRUCTURAL_TOPOLOGY
SlyDoc → SlyKnowledge → SlyOrganize → SlyDesign → Output Service
```

La topologie structurelle est définie par
[`BOUSSOLE.md`](../BOUSSOLE.md). Un workflow applicatif peut différer selon
le cas d'usage gouverné ; aucun flux runtime ne modifie cette topologie.

SlyDesign Core MUST NOT depend on :

- SlyCV ;
- `CvPresentationModel` ;
- Candidate Strategy ;
- des objets de domaine propres à une application productrice.

## 3. Contrat `PresentationDocumentDTO<TSlotMap>`

```text
SlyKnowledge
      ↓
SlyCV: Candidate Strategy → Projection → Composition éditoriale
      ↓
PresentationDocumentDTO<TSlotMap>
      ↓
SlyDesign Core: slots → template → tokens/policies → Presentation Tree
      ↓
Renderer → document compilé
      ↓
SlyOrganize: naming / storage / indexation
```

SlyCV décide quoi présenter. SlyDesign décide comment le présenter
visuellement. SlyOrganize prend en charge l'artefact physique après
génération.

Le contrat est générique et ne dépend d'aucun modèle de producteur. Il est
porté par un `Producer Adapter` et consommé par le Core.

```text
PresentationDocumentDTO<TSlotMap>
├── document_id: String                 # REQUIRED, non-empty, non-null
├── contract_version: SemVer            # REQUIRED, non-null
├── artifact_kind: ArtifactKind         # REQUIRED, non-null; V1 = CV
├── locale: BCP47Tag                    # REQUIRED, non-null
├── slots: TSlotMap                     # REQUIRED, non-null, typed object
├── semantic_metadata: MetadataObject   # OPTIONAL, default {}
└── content_lineage: LineageEntry[]     # REQUIRED, non-null, may be empty
```

Chaque champ est présent une seule fois. Aucun champ obligatoire n'accepte
`null`. `TSlotMap` est un type déclaré par le producteur et versionné avec le
contrat ; ce n'est pas une map libre d'attributs arbitraires.

`semantic_metadata` peut contenir des informations de provenance et de
classification neutres nécessaires à l'interprétation contractuelle du
payload : identifiants de source, type de contenu, langue ou provenance. Il
ne peut pas contenir de scoring métier, stratégie candidat, cible d'emploi,
décision de sélection, instruction d'édition cachée ou règle d'application.

`semantics` d'un slot décrit son rôle contractuel stable (`identity`,
`experience`, `skills`, etc.) et sa provenance. Il ne peut pas porter une
décision de sélection, une priorité métier, un score ou une instruction de
reformulation.

`content_lineage` contient des références immuables vers les sources et
transformations autorisées du contenu. Il ne contient pas de géométrie, CSS,
coordonnées, instruction de template ou décision métier implicite.

Le DTO ne contient aucune unité physique, coordonnée, CSS brut, classe de
framework, instruction de renderer ou objet de domaine producteur.

### Types contractuels

```text
String              = chaîne Unicode non vide
SemVer              = major.minor.patch, selon SemVer 2.0
SemVerRange         = intervalle SemVer explicite
ArtifactKind        = CV                    # V1 uniquement
BCP47Tag            = identifiant de locale BCP 47 valide
MetadataObject      = Map<String, MetadataValue>
LineageEntry        = { source_id: String, transform_id: String | null,
                        version: ImmutableVersionRef }
SlotId              = chaîne stable non vide
SlotType            = TEXT | RICH_TEXT | ITEM_LIST | MEDIA | GROUP
SlotSemantics       = rôle stable et présentation-neutre
ContentValue        = valeur conforme au SlotType déclaré
```

`MetadataValue` est limité aux scalaires de provenance, identifiants,
versions, tags et tableaux de ces valeurs. Il ne peut pas contenir de
fonction, expression, code, règle conditionnelle ou objet de domaine.

`TSlotMap` est un objet typé dont chaque clé est un `SlotId` déclaré par la
version du contrat. Une clé inconnue n'est jamais résolue implicitement.

### Versioning et extension de `TSlotMap`

- `contract_version` suit SemVer.
- Une modification incompatible incrémente le major version.
- L'ajout rétrocompatible d'un champ optionnel ou d'un slot optionnel
  incrémente le minor version.
- Une correction sans changement de forme incrémente le patch version.
- Un consommateur compatible avec une minor version doit accepter les
  extensions optionnelles antérieures et ignorer les extensions qu'il ne
  déclare pas ; il ne doit jamais les exposer au template.
- Un changement de type, de cardinalité ou de sémantique d'un champ exige une
  nouvelle major version.

`TSlotMap` doit publier son identifiant de type et sa version. Ses clés sont
fermées pour la version déclarée ; une extension ajoute une clé optionnelle
versionnée, elle ne change pas silencieusement le sens d'une clé existante.

### Primitives de slots

```text
Slot<T>
├── id: SlotId
├── type: SlotType
├── exists: Boolean
├── items: Item[]                  # requis pour les slots collection
├── count: Integer                 # dérivé, >= 0
├── content: ContentValue | null
└── semantics: SlotSemantics       # présentation-neutre
```

`SlotType` est limité à `TEXT | RICH_TEXT | ITEM_LIST | MEDIA | GROUP`.
`exists` indique la présence contractuelle et n'est pas déduit d'une
préférence visuelle. Les cardinalités et la possibilité d'être vide sont
déclarées dans le contrat du slot.

Les primitives exposées au template sont exclusivement structurelles :
`slot.exists`, `slot.items`, `slot.type`, `slot.count` et le contenu du slot
déclaré. Un template MUST NOT accéder arbitrairement au payload source, à
`semantic_metadata`, à des propriétés inconnues de `TSlotMap` ou à un objet de
domaine producteur.

### Slot failure policies

| Condition | Règle normative | Résultat |
|---|---|---|
| `REQUIRED_SLOT_MISSING` | Slot requis absent ou `null` | Rejet fail-fast avant Presentation Tree |
| `UNKNOWN_SLOT` | Slot fourni mais absent de la liste exhaustive du template | Rejet fail-fast avec diagnostic ; inaccessible au template |
| `INCOMPATIBLE_SLOT_TYPE` | Type de slot différent du type déclaré | Rejet fail-fast |
| `EMPTY_COLLECTION` | Collection vide | Valide si `allow_empty = true`, sinon `INVALID_SLOT_PAYLOAD` |
| `INVALID_SLOT_PAYLOAD` | Nullabilité, cardinalité ou forme non conforme | Rejet fail-fast |

Un slot optionnel absent est ignoré et n'est pas une erreur. Un slot requis
vide n'est pas équivalent à un slot absent : il est valide uniquement si son
contrat autorise explicitement une valeur vide. Toute erreur de contrat est
retournée comme diagnostic structuré ; aucun fallback silencieux n'est
autorisé.

## 4. `RenderRequest`

```text
RenderRequest
├── request_id: String
├── traceId: String
├── contextId: String
├── lineage: LineageEntry[]
├── template_id: String
├── template_version: SemVer
├── payload: PresentationDocumentDTO<TSlotMap>
├── presentation_contract_version: SemVer
├── design_policy_version: ImmutableVersionRef
├── token_set_version: ImmutableVersionRef
├── token_overrides: TokenOverrideObject
├── presentation_preferences: PresentationPreferences
└── renderer_configuration_ref: ImmutableVersionRef | null
```

Tous les champs hors `renderer_configuration_ref` sont obligatoires et non
nullables. `lineage` peut être vide mais doit être présent. La référence
`renderer_configuration_ref` est nullable uniquement lorsqu'aucune
configuration externe n'influence le résultat.

`payload` contient le document éditorial. `presentation_preferences` décrit
une préférence de présentation et ne doit jamais contaminer les données
métier, la stratégie de candidature ou le contenu canonique. Les préférences
ne peuvent pas supprimer, résumer ou reformuler un slot.

`token_overrides` est un objet présent, éventuellement vide, réservé aux
tokens autorisés par le template et sa policy. Toute clé inconnue ou valeur
hors contrainte devient une `CONSTRAINT_VIOLATION`.

Toute donnée qui influence le résultat doit être incluse dans le request ou
référencée par une version immuable : contrat, template, policy, token set,
préférences ou configuration de renderer. Une valeur implicite non versionnée
qui influence le résultat est interdite.

## 5. Template Contract

Un template déclare au minimum :

```text
TemplateContract
├── template_id: String
├── template_version: SemVer
├── compatible_contract_versions: SemVerRange[]
├── supported_artifact_kind: ArtifactKind
├── required_slots: SlotDeclaration[]
├── optional_slots: SlotDeclaration[]
├── unknown_slot_policy: REJECT
├── declared_capabilities: CapabilityId[]
├── slot_mapping: SlotMapping
├── token_schema: TokenSchema
├── policy_constraints: PolicyConstraint[]
└── presentation_tree_schema: TreeSchema
```

`required_slots` et `optional_slots` constituent ensemble la liste exhaustive
des slots accessibles au template. Les deux listes sont disjointes. Il
n'existe ni wildcard ni accès dynamique à un slot non déclaré.

Un template résout des slots, applique une structure visuelle et produit un
Presentation Tree. Il ne contient aucune logique métier.

Interdit :

```text
if candidate.isSenior
if targetJob == "..."
if fitScore > ...
```

Autorisé :

```text
slot.exists
slot.items
slot.type
slot.count
```

## 6. Design Tokens et Design Policies

Les Design Tokens sont des valeurs nommées de présentation : typographie,
couleur, espacement abstrait, hiérarchie visuelle et contraintes de lisibilité.
Ils ne sont pas des données métier.

Les Design Policies sont des règles de présentation : contrastes minimaux,
limites de densité, ordre visuel autorisé, comportement d'overflow et
contraintes de compatibilité du template. Elles ne peuvent pas modifier le
contenu éditorial.

Les unités physiques et primitives géométriques restent de la responsabilité
du standard/backend de rendu autant que possible. SlyDesign ne crée pas, à
ce stade, de `LayoutStrategy { Flow, FixedCanvas }` propriétaire ni de
solveur géométrique propriétaire.

## 7. Presentation Tree

Le Presentation Tree est la sortie intermédiaire déterministe de SlyDesign :

```text
PresentationTree
├── document
├── pages / regions
├── nodes
│   ├── slot_reference
│   ├── visual_role
│   ├── children
│   └── constraints
├── applied_template
├── applied_tokens
└── diagnostics
```

Il représente la composition visuelle résolue, pas une nouvelle source de
vérité métier. Le Renderer reçoit cet arbre et retourne un document compilé
ou une erreur explicite.

## 8. Exemples d'extensibilité CV

### Template CV `cv-editorial-01`

```text
ILLUSTRATIVE_NON_NORMATIVE
required_slots: identity, summary, experience, skills
optional_slots: education, certifications, languages
composition_example: single_column_flow
```

Ce template privilégie une lecture éditoriale linéaire. Il consomme le même
`PresentationDocumentDTO<CVSlotMap>` que tout autre template CV.

### Template CV `cv-compact-02`

```text
ILLUSTRATIVE_NON_NORMATIVE
required_slots: identity, experience, skills
optional_slots: summary, education, certifications, languages
composition_example: primary_column + supporting_column
```

Ces noms de composition sont illustratifs uniquement. Ils ne définissent ni
le modèle de nœuds, ni une `LayoutStrategy`, ni une primitive géométrique
propriétaire. Ce template peut produire un diagnostic
`FIT_WITH_DENSITY_ADJUSTMENT` ou `OVERFLOW`, mais il ne supprime ni ne
reformule le contenu pour tenir.

Ces deux templates sont des exemples contractuels, non des implémentations.

## 9. Invariants normatifs

### INV-SLYDESIGN-001 — Content / Geometry Separation

`PresentationDocumentDTO` ne contient ni `px`, `mm`, `cm`, coordonnées, CSS
brut ni classes de framework.

### INV-SLYDESIGN-002 — No Business Logic in Templates

Un template ne sélectionne pas le contenu et n'évalue pas la candidature.

### INV-SLYDESIGN-003 — No Semantic Mutation

SlyDesign ne modifie jamais le sens ou le contenu éditorial pour résoudre un
problème de layout ; il retourne un diagnostic.

### INV-SLYDESIGN-004 — Storage Separation

SlyDesign ne stocke, ne nomme et n'archive pas les artefacts générés. Le
document compilé est remis à SlyOrganize.

## 10. Responsabilités et interdictions

SlyDesign est responsable de la résolution des slots, de l'application du
template, des tokens et policies, de la composition visuelle, de la gestion
géométrique, de la détection d'overflow, de la génération du Presentation
Tree, de la délégation au Renderer et du diagnostic déterministe.

SlyDesign n'est pas responsable de la sélection métier, du résumé, de la
reformulation, de la suppression d'information métier, de la stratégie de
candidature, du stockage, du nommage ou de l'archivage.

## 11. Décisions différées

`DEFERRED` : Design Domain Registry, moteurs BusinessCard/Banner/Flyer,
stratégie de layout propriétaire, solveur géométrique propriétaire, éditeur
interactif, marketplace, recherche de templates et adaptation éditoriale
automatique par LLM.

Le backend de rendu est traité séparément par
`ADR-SLYDESIGN-001`. Aucune technologie n'est choisie avant stabilisation de
la présente RFC.

## 12. RFC-001 Architectural Acceptance Gate

La RFC est `ARCHITECTURE_ACCEPTED` uniquement lorsque tous les critères
suivants sont satisfaits :

```text
[ ] Core indépendant de tout producteur métier
[ ] DTO sans unité physique / CSS / coordonnées
[ ] DTO typé, versionné et extensible explicitement
[ ] Templates sans logique métier
[ ] Templates limités aux slots déclarés
[ ] Slot failure policies définies
[ ] RenderRequest traçable et versionné
[ ] Données déterminantes du rendu identifiables
[ ] Exemples géométriques explicitement non normatifs
[ ] Topologie canonique préservée
[ ] Compatibilité conceptuelle avec RFC-002
[ ] Aucun choix de renderer ratifié
```

Cette gate autorise uniquement l'adjudication de RFC-001. Elle n'ouvre ni
RFC-002, ni ADR-001, ni l'architecture des nœuds, ni l'implémentation.
