# Boussole structurelle — Module Template / SlyTemplate

```yaml
artifact_id: BOUSSOLE-SLYDESIGN-001
artifact_type: STRUCTURAL_COMPASS
project_id: MODULE_DESIGN
module_id: SLYTEMPLATE
mission_ref: SLYDESIGN-GOV-FOUNDATION-002
status: DOCUMENTARY_FOUNDATION
authority: Architecture / Coordinateur Central
code_authority: NOT_GRANTED
```

## Mission

SlyTemplate transforme une représentation de présentation structurée en
composition visuelle gouvernée et reproductible.

## Topologie canonique

```text
SlyDoc
  ↓
SlyKnowledge
  ↓
SlyOrganize
  ↓
SlyTemplate
  ↓
Output Service
```

```text
MODULE_1 = SlyDoc
MODULE_2 = SlyKnowledge
MODULE_3 = SlyOrganize
MODULE_4 = SlyTemplate
FINAL_OUTPUT_BOUNDARY = Output Service
```

Cette position est une propriété structurelle de la plateforme jusqu'à une
nouvelle décision architecturale explicite.

## Topologie et flux d'exécution

La topologie décrit la place et la responsabilité conceptuelle des modules.
Elle ne prescrit pas l'ordre de chaque orchestration applicative.

Exemple de génération et persistance d'un CV :

```text
SlyCV
  ↓
SlyTemplate
  ↓
artefact compilé
  ↓
SlyOrganize
  ↓
stockage / naming
```

Ce flux ne modifie pas la topologie canonique. Toute proposition qui la
modifie doit faire l'objet d'un arbitrage architectural explicite.

## Vision

SlyTemplate est un moteur transverse réutilisable dont le Core reste distinct
des domaines d'artefacts :

```text
                 SlyTemplate Core
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
       Template      Template     Template
          CV       BusinessCard    Banner
```

```text
CURRENT_SCOPE = CV
FUTURE_SCOPE = DEFERRED
SLYTEMPLATE_NODE_MODEL = TO_BE_ARCHITECTED
```

BusinessCard, Banner, Flyer et autres artefacts ne sont pas des chantiers
actuels.

## Principes non négociables

- Le Core est agnostique et ne dépend pas de SlyCV.
- SlyTemplate ne décide pas du contenu : il ne résume, n'invente, ne supprime
  et ne reformule aucune information métier.
- Les templates ne contiennent aucune logique métier.
- Le contrat de contenu est séparé de la géométrie : pas de CSS brut,
  coordonnées ou unités physiques.
- À entrée, template et configuration identiques, le rendu est reproductible.
- Tout overflow produit un diagnostic observable, jamais une mutation
  sémantique silencieuse.
- SlyTemplate ne stocke pas les artefacts.
- SlyTemplate n'est pas un moteur graphique généraliste de type Figma ou Canva.

## Garde-fous de simplicité

La conception doit prévenir :

```text
OVER_ENGINEERING
PREMATURE_GENERALIZATION
BUSINESS_LOGIC_LEAK
SEMANTIC_MUTATION
TEMPLATE_COUPLING
RENDERER_LOCK_IN
```

> Construire ce qui est nécessaire pour le CV aujourd'hui, tout en
> protégeant les frontières nécessaires à la réutilisation future.

## Nœuds

Le nombre et le découpage des nœuds ne sont pas décidés. Ils découleront des
responsabilités et contrats validés par les RFC. Aucun nœud ne doit être créé
pour reproduire artificiellement la structure de SlyDoc, SlyKnowledge ou
SlyOrganize.

## Discipline d'autorité

Cette Boussole est une autorité de vision et de garde-fou documentaire. Elle
n'autorise ni moteur, ni template exécutable, ni renderer, ni choix
technologique. Une dérogation à la topologie ou aux principes exige une
nouvelle décision architecturale explicite.
