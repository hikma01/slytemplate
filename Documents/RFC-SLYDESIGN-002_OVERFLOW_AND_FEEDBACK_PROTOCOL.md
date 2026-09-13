# RFC-SLYDESIGN-002 — OVERFLOW AND FEEDBACK PROTOCOL

```yaml
artifact_id: RFC-SLYDESIGN-002
artifact_type: RFC
capability_id: SLYDESIGN
program_id: SLYCV
arc_id: N/A
mission_id: SLYDESIGN-RFC-002-REWORK-001
status: REWORKED_PENDING_READJUDICATION
authority: Architecture / Coordinateur Central
supersedes: N/A
references:
  - RFC-SLYDESIGN-001_PRESENTATION_DOCUMENT_CONTRACT_AND_SLOT_ARCHITECTURE.md
  - ../BOUSSOLE.md
  - ../../SlyPlatform/Documents/RFC-SLYPLATFORM-ARCH-CV-001_MODULAR_PIPELINE_CONTRACTS.md
```

## 1. Objet et portée

Cette RFC définit le feedback déterministe produit par SlyDesign lorsqu'une
composition est compatible, ajustable, en overflow, non conforme ou
impossible à rendre. Elle verrouille le contrat de retour, la machine d'états
et les bornes de réconciliation.

Elle ne prescrit aucun moteur d'exécution, ne choisit aucun renderer et
n'ouvre ni l'architecture des nœuds ni l'implémentation.

Le protocole distingue :

```text
INTERNAL_VISUAL_RECONCILIATION
same editorial payload, new bounded render attempt

UPSTREAM_EDITORIAL_RECONCILIATION
new PresentationDocumentDTO, new request and new lineage branch
```

## 2. États runtime

| État | Définition | Terminal |
|---|---|---|
| `RENDER_REQUESTED` | Requête d'un essai reçue et validée | Non |
| `RENDERING` | Composition et rendu en cours | Non |
| `FIT` | Rendu produit dans toutes les contraintes | Oui |
| `FIT_WITH_DENSITY_ADJUSTMENT` | Rendu produit après ajustement visuel autorisé | Oui |
| `OVERFLOW` | Rendu techniquement produit, mais contenu hors contrainte de surface | Non |
| `CONSTRAINT_VIOLATION` | Règle de design/composition violée, sans exigence d'overflow physique | Oui, sauf réémission explicite autorisée |
| `RENDER_FAILED` | Backend incapable de produire le résultat attendu | Oui |
| `FIT_FAILED_UNRESOLVABLE` | Convergence de fitting impossible après épuisement des bornes | Oui |

`RENDER_FAILED` ne devient jamais automatiquement
`FIT_FAILED_UNRESOLVABLE`. Un échec technique reste un échec technique,
rejouable uniquement selon sa propre politique de retry externe.

## 3. Enveloppe `RenderFeedback`

Chaque feedback est corrélable à un et un seul `RenderRequest` par
`request_id`. Chaque tentative interne possède donc un identifiant de requête
distinct ; `presentation_run_id` regroupe les tentatives d'une même
réconciliation visuelle.

```text
RenderFeedback
├── request_id: String
├── presentation_run_id: String
├── traceId: String
├── contextId: String
├── lineage: LineageEntry[]
├── status: FeedbackStatus
├── presentationContractVersion: SemVer
├── templateId: String
├── templateVersion: SemVer
├── designPolicyVersion: ImmutableVersionRef
├── tokenSetVersion: ImmutableVersionRef
├── rendererId: String | null
├── rendererVersion: SemVer | null
├── diagnostics: Diagnostic[]
├── attempt: Integer
└── createdAt: RFC3339Timestamp
```

### 3.1 Cardinalité et nullabilité

| Champ | Présence | Cardinalité / nullabilité | Règle |
|---|---|---|---|
| `request_id` | Obligatoire | exactement 1, non nul | Identifie l'essai corrélé |
| `presentation_run_id` | Obligatoire | exactement 1, non nul | Regroupe les essais internes |
| `traceId` | Obligatoire | exactement 1, non nul | Corrélation plateforme |
| `contextId` | Obligatoire | exactement 1, non nul | Contexte d'exécution |
| `lineage` | Obligatoire | tableau présent, possiblement vide | Copie de la lineage de la requête |
| `status` | Obligatoire | exactement 1, non nul | Valeur de `FeedbackStatus` |
| `presentationContractVersion` | Obligatoire | exactement 1, non nul | Version du DTO accepté |
| `templateId` | Obligatoire | exactement 1, non nul | Template effectivement évalué |
| `templateVersion` | Obligatoire | exactement 1, non nul | Version effectivement évaluée |
| `designPolicyVersion` | Obligatoire | exactement 1, non nul | Policy effectivement appliquée |
| `tokenSetVersion` | Obligatoire | exactement 1, non nul | Jeu de tokens effectivement appliqué |
| `rendererId` | Obligatoire | une valeur ou `null` | `null` seulement avant sélection/exécution renderer |
| `rendererVersion` | Obligatoire | une valeur ou `null` | `null` seulement si `rendererId` est `null` |
| `diagnostics` | Obligatoire | tableau, vide seulement pour `FIT` | Diagnostics structurés par statut |
| `attempt` | Obligatoire | entier `1..3` | Numéro de tentative du run |
| `createdAt` | Obligatoire | exactement 1, non nul | Timestamp RFC 3339 UTC |

Les noms de propagation sont intentionnels : `presentationContractVersion`
provient de `RenderRequest.presentation_contract_version`, `templateId` de
`template_id`, `templateVersion` de `template_version`,
`designPolicyVersion` de `design_policy_version` et `tokenSetVersion` de
`token_set_version`. Cette table constitue la règle canonique de propagation,
pas un renommage implicite.

`diagnostics` doit contenir au moins un élément pour `OVERFLOW`,
`CONSTRAINT_VIOLATION`, `RENDER_FAILED` et `FIT_FAILED_UNRESOLVABLE`.

## 4. Diagnostics typés

Chaque diagnostic possède une enveloppe commune :

```text
Diagnostic
├── diagnostic_id: String
├── diagnostic_type: OVERFLOW | CONSTRAINT_VIOLATION | RENDER_FAILED | RECONCILIATION
├── severity: INFO | WARNING | ERROR | FATAL
└── message_code: String
```

Le contrat externe ne contient jamais de stack trace, chemin interne,
secret, message brut de processus ou détail sensible du renderer.

### 4.1 `OverflowDiagnostic`

```text
OverflowDiagnostic
├── diagnostic_type: OVERFLOW
├── slot_id: String | null
├── scope: SLOT | SECTION | DOCUMENT
├── overflow_ratio: Number
├── overflow_height_ratio: Number | null
├── overflow_width_ratio: Number | null
├── severity: INFO | WARNING | ERROR | FATAL
├── suggested_reduction_weight: NONE | LOW | MEDIUM | HIGH
└── constraint_ids: String[]
```

`slot_id` est obligatoire pour `scope = SLOT`, optionnel pour `SECTION` et
`DOCUMENT`. `overflow_ratio` est le ratio `actual / allowed`, supérieur ou
égal à `1` lorsqu'il y a overflow. Les ratios hauteur et largeur sont nuls
uniquement lorsqu'ils ne s'appliquent pas à la contrainte.

Plusieurs `OverflowDiagnostic` peuvent être retournés simultanément. Le
protocole ne limite pas l'overflow à un seul slot.

### 4.2 `ConstraintViolationDiagnostic`

```text
ConstraintViolationDiagnostic
├── diagnostic_type: CONSTRAINT_VIOLATION
├── constraint_id: String
├── constraint_type: String
├── target: String
├── measured_value: Scalar | null
├── allowed_boundary: Scalar | Range | EnumSet
└── severity: WARNING | ERROR | FATAL
```

La violation peut exister sans overflow physique : par exemple un token
interdit, un type de slot incompatible ou une policy non applicable.

### 4.3 `RenderFailureDiagnostic`

```text
RenderFailureDiagnostic
├── diagnostic_type: RENDER_FAILED
├── failure_code: String
├── renderer_stage: String
├── retryable: Boolean
├── sanitized_message: String
└── severity: ERROR | FATAL
```

`sanitized_message` est destiné à l'appelant externe. Les détails techniques
non sûrs restent dans les journaux internes gouvernés et ne sont pas
réinjectés dans `RenderFeedback`.

## 5. Bornes de tentative

Les compteurs sont distincts et non interchangeables :

```text
INITIAL_RENDER_ATTEMPT = 1
MAX_RECONCILIATION_ITERATIONS = 2
MAX_TOTAL_RENDER_ATTEMPTS = 3
```

La séquence normative est :

```text
Attempt 1 = rendu initial
Attempt 2 = correction visuelle 1
Attempt 3 = correction visuelle 2
```

Après la troisième tentative, un problème de fitting non résolu produit
`FIT_FAILED_UNRESOLVABLE`. Cette valeur ne s'applique pas à
`RENDER_FAILED`.

Chaque tentative produit un `RenderFeedback` corrélé à son propre
`request_id`, avec le même `presentation_run_id` et un `attempt` croissant.

## 6. Deux types de réconciliation

### 6.1 Internal Visual Reconciliation

Une réconciliation interne conserve exactement le même contenu éditorial et
le même hash de payload. Elle peut modifier uniquement des paramètres visuels
explicitement autorisés par la matrice d'autorité :

- `visual_density` autorisée par `designPolicyVersion` ;
- token overrides autorisés par le `tokenSetVersion` et la policy ;
- configuration de template autorisée par le `templateVersion`.

Chaque nouvelle tentative reçoit un nouveau `request_id`, conserve le même
`presentation_run_id`, référence le précédent par `retry_of_request_id` dans
la lineage d'orchestration et incrémente `attempt`. Elle ne produit pas un
nouveau DTO éditorial.

### 6.2 Upstream Editorial Reconciliation

Lorsque l'application amont produit un nouveau
`PresentationDocumentDTO<TSlotMap>`, il s'agit d'une nouvelle chaîne de
présentation, et non d'une continuation silencieuse du même request :

```text
new DTO
├── new request_id
├── new lineage node
├── supersedes_request_id: String
└── supersedes_presentation_id: String | null
```

Le contenu modifié reste sous l'autorité de l'application amont. SlyDesign
ne crée, ne reformule, ne résume et ne supprime jamais ce contenu.

## 7. Borne globale de supersession

La borne de chaîne est distincte de la réconciliation visuelle interne :

```text
MAX_PRESENTATION_SUPERSESSION_DEPTH = 3
```

La profondeur est `0` pour la présentation initiale et augmente de `1` à
chaque nouveau DTO qui supersède une présentation précédente. Au-delà de `3`,
SlyDesign refuse une nouvelle tentative de fitting et retourne
`FIT_FAILED_UNRESOLVABLE` avec un diagnostic `RECONCILIATION` de type
`SUPERSESSION_DEPTH_EXCEEDED`.

Cette borne empêche la boucle non bornée :

```text
SlyDesign → Application → DTO V2 → SlyDesign → Application → DTO V3 → ...
```

La profondeur et les relations de supersession doivent être traçables dans la
lineage. Elles ne partagent pas le compteur `attempt` de la réconciliation
visuelle.

## 8. Matrice d'autorité de réconciliation

| Modification | Autorité | Condition |
|---|---|---|
| `visual_density` | RenderRequest / Design Policy | Valeur explicite, versionnée et autorisée |
| `token_overrides` | Design Policy / Token Set | Clé et valeur explicitement autorisées |
| `template_change` interne | Orchestrateur | Interdit par défaut ; autorisation explicite et nouvelle tentative |
| contenu éditorial | Application amont | Strictement interdit à SlyDesign |
| résumé, reformulation, suppression | Application amont selon ses contrats | Strictement interdit à SlyDesign |

Toute modification autorisée doit être explicite, versionnée, traçable et
reproductible. Aucun fallback silencieux n'est admis.

## 9. Machine d'états normative

```text
RENDER_REQUESTED
      ↓ validation réussie
RENDERING
      ↓
 ┌────┼──────────────────────┬─────────────────────┐
 ↓    ↓                      ↓                     ↓
FIT  OVERFLOW       CONSTRAINT_VIOLATION     RENDER_FAILED
      ↓
RECONCILIATION_ALLOWED?
      ├── no  → FIT_FAILED_UNRESOLVABLE
      └── yes → RENDER_REQUESTED (attempt + 1)
                         ↓
                    max reached
                         ↓
              FIT_FAILED_UNRESOLVABLE
```

Transitions autorisées :

- `RENDER_REQUESTED → RENDERING` après validation de contrat ;
- `RENDERING → FIT` ou `FIT_WITH_DENSITY_ADJUSTMENT` si toutes les contraintes
  sont satisfaites ;
- `RENDERING → OVERFLOW` si le rendu existe mais dépasse une contrainte de
  surface ;
- `RENDERING → CONSTRAINT_VIOLATION` si une policy ou un contrat est violé,
  indépendamment d'un overflow physique ;
- `RENDERING → RENDER_FAILED` si le backend ne produit pas le résultat ;
- `OVERFLOW → RENDER_REQUESTED` uniquement si une réconciliation autorisée
  reste disponible ;
- `OVERFLOW → FIT_FAILED_UNRESOLVABLE` si la borne est épuisée ou aucune
  correction autorisée n'existe.

La précédence est la suivante :

1. violation de contrat ou de policy détectée avant rendu →
   `CONSTRAINT_VIOLATION` ;
2. échec du backend pendant le rendu → `RENDER_FAILED` ;
3. rendu produit avec dépassement de surface → `OVERFLOW` ;
4. borne de fitting épuisée après `OVERFLOW` →
   `FIT_FAILED_UNRESOLVABLE`.

Un état terminal ne peut pas être réinterprété silencieusement comme un autre
état.

## 10. Déterminisme et propagation RFC-001

Pour un même payload, template, policy, tokens, préférences, configuration de
renderer et versions immuables, le résultat et le feedback sont
reproductibles. `request_id`, `traceId`, `contextId` et `createdAt` assurent la
corrélation mais ne doivent pas influencer le résultat visuel.

| RenderRequest | RenderFeedback | Règle de propagation |
|---|---|---|
| `request_id` | `request_id` | Copie exacte de l'essai corrélé |
| `traceId` | `traceId` | Copie exacte |
| `contextId` | `contextId` | Copie exacte |
| `lineage` | `lineage` | Copie enrichie seulement par les relations de tentative |
| `presentation_contract_version` | `presentationContractVersion` | Copie exacte |
| `template_id` | `templateId` | Template effectivement exécuté |
| `template_version` | `templateVersion` | Version effectivement exécutée |
| `design_policy_version` | `designPolicyVersion` | Policy effectivement appliquée |
| `token_set_version` | `tokenSetVersion` | Token set effectivement appliqué |
| renderer configuration | `rendererId`, `rendererVersion` | Références du renderer réellement utilisé, ou `null` avant exécution |
| `attempt` / orchestration | `attempt` | Entier `1..3`, propre au run interne |

Le champ `contractVersion` des conventions plateforme est représenté ici par
`presentationContractVersion`, dont la source exacte est
`presentation_contract_version` dans RFC-001. Aucune seconde version implicite
ne doit être introduite.

## 11. Responsabilités

L'orchestrateur ou l'application amont décide quoi faire d'un feedback :

- accepter `FIT` ou `FIT_WITH_DENSITY_ADJUSTMENT` ;
- appliquer une réconciliation interne autorisée ;
- produire un nouveau DTO éditorial dans une nouvelle chaîne bornée ;
- demander un autre template si l'autorité le permet ;
- solliciter une décision utilisateur ;
- arrêter sur un état terminal.

SlyCV reste propriétaire de la stratégie de candidature et du contenu. Il
peut produire un nouveau DTO dans son propre périmètre, mais SlyDesign ne le
fabrique pas et ne le mutile pas.

SlyOrganize intervient après génération pour le nommage, le stockage et
l'indexation ; il ne résout pas un overflow de présentation.

## 12. Hors périmètre

Ce protocole n'autorise ni adaptation éditoriale automatique par LLM, ni
solveur propriétaire, ni stockage d'artefacts, ni sélection métier du
contenu, ni choix de renderer, ni création de nœuds SlyDesign.

## 13. RFC-002 Architectural Acceptance Gate

RFC-002 est `ARCHITECTURE_ACCEPTED` uniquement lorsque tous les critères
suivants sont satisfaits :

```text
[ ] RenderFeedback normatif défini
[ ] Corrélation 1:1 avec RenderRequest
[ ] Diagnostics typés par statut
[ ] Multi-slot overflow supporté
[ ] Overflow global supporté
[ ] Machine d'états définie
[ ] États terminaux explicités
[ ] Précédence des erreurs définie
[ ] MAX_RECONCILIATION_ITERATIONS non ambigu
[ ] MAX_TOTAL_RENDER_ATTEMPTS explicite
[ ] Réconciliation interne séparée du nouveau DTO
[ ] supersedes_request_id défini
[ ] Borne globale de supersession définie
[ ] Autorités de modification définies
[ ] Aucun changement éditorial par SlyDesign
[ ] Propagation RFC-001 vérifiée
[ ] Déterminisme garanti
[ ] Aucun fallback silencieux
```

Cette gate autorise uniquement l'adjudication de RFC-002. Elle n'ouvre ni
ADR-001, ni l'architecture des nœuds, ni l'implémentation.

