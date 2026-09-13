# GATE-SLYDESIGN-CHROMIUM-PRODUCTION-BOUNDARY-001

```yaml
artifact_id: GATE-SLYDESIGN-CHROMIUM-PRODUCTION-BOUNDARY-001
artifact_type: ARCHITECTURAL_SUB_GATE
module_id: SLYDESIGN
phase: PHASE_2_MODULE_STRUCTURE
status: ARCHITECTURE_ACCEPTED_WITH_LIMITATIONS
authority: Architecture / Coordinateur Central
code_authority: NOT_GRANTED
production_code_authority: NOT_GRANTED
decision_date: 2026-09-09
```

## Objet et adjudication

Ce sous-gate fige la frontière d'exécution Chromium avant toute analyse des
responsabilités internes. Il est accepté comme préalable de Phase 2 et
n'autorise ni implémentation, ni création de nœud, ni template exécutable.

```text
RFC_001 = ARCHITECTURE_ACCEPTED
RFC_002 = ARCHITECTURE_ACCEPTED
ADR_001 = ARCHITECTURE_ACCEPTED
V1_CV_BACKEND = CHROMIUM_HEADLESS
BACKEND_STATUS = RATIFIED_WITH_LIMITATIONS
PHASE_2 = OPEN_FOR_ARCHITECTURE
CODE_AUTHORITY = NOT_GRANTED
PRODUCTION_CODE_AUTHORITY = NOT_GRANTED
```

La décision s'appuie sur l'evidence closure Chromium rattachée au gate de
ratification. Les limitations de polices, métadonnées PDF, sandbox de
production, filesystem, ressources et mesure RSS restent ouvertes comme
preuves de déploiement ; elles ne sont pas converties en hypothèses
silencieuses.

## Frontière verrouillée

```text
SlyDesign Core
      ↓
Renderer Contract
      ↓
RendererAdapter
══════════════════════  ← PRODUCTION BOUNDARY
      ↓
Chromium Headless
      ↓
OS / Fonts / Sandbox / Resources
```

La frontière est une frontière de responsabilité et de sécurité. Le contrat
public s'arrête avant toute représentation DOM, CSS, Playwright ou Chromium.

## Responsabilités du SlyDesign Core

Le Core :

- valide et prépare la représentation de présentation selon RFC-001 ;
- applique les règles de composition et de diagnostic prévues par RFC-002 ;
- fournit au `Renderer Contract` une entrée indépendante du moteur ;
- ne connaît ni DOM, ni CSS calculé, ni API Chromium, ni processus OS ;
- ne gère ni sandbox, ni réseau, ni filesystem, ni limites de ressources ;
- ne modifie jamais le contenu métier pour corriger un overflow.

## Responsabilités du RendererAdapter

L'Adapter :

- traduit le `Renderer Contract` vers la configuration d'exécution ;
- crée et ferme le contexte isolé et contrôle son lifecycle ;
- collecte les mesures brutes nécessaires à la normalisation ;
- traduit les mesures Chromium en diagnostics RFC-002 ;
- traduit les erreurs d'exécution en erreurs typées et assainies ;
- porte l'observabilité, le lineage et les versions réellement utilisées ;
- ne change ni le payload métier, ni la sémantique des slots.

Les détails DOM/CSS/Chromium restent internes à l'Adapter et à ses preuves.

## Responsabilités spécifiques Chromium et configuration

La configuration d'exécution doit être versionnée, immuable par rendu et
traçable. Elle couvre au minimum :

- version exacte de Chromium et couche de pilotage ;
- mode headless, arguments autorisés et politique de sandbox ;
- format de page, impression, pagination et device scale factor ;
- fichiers et versions de polices ;
- locale, timezone et paramètres déterminants ;
- politique réseau et allowlist filesystem ;
- timeouts, retries, arrêt forcé et nettoyage du profil temporaire.

Toute valeur implicite non enregistrée est une lacune de déterminisme, pas une
valeur par défaut ratifiée.

## Isolation, lifecycle et ressources

La frontière de production doit imposer :

1. un profil et un contexte isolés par rendu ou unité d'isolation définie ;
2. sandbox OS active et vérifiable ;
3. absence de réseau par défaut, avec allowlist explicite si nécessaire ;
4. absence d'accès filesystem hors ressources autorisées ;
5. timeout global et timeouts d'étapes ;
6. arrêt et nettoyage garantis en succès, échec et timeout ;
7. limites CPU, mémoire, processus et concurrence appliquées par le runtime
   de déploiement.

Le benchmark prouve des contrôles au niveau harness, mais ne ratifie pas à lui
seul les garanties OS ou les limites de déploiement.

## Normalisation et erreurs

La chaîne obligatoire est :

```text
Chromium raw DOM/PDF measurements
        ↓
RendererAdapter normalization
        ↓
RFC-002-compatible diagnostics
```

L'Adapter normalise notamment `page_count`, bornes de pages/contenu/slots,
overflow hauteur/largeur, régions affectées et contraintes. Il distingue au
minimum `FIT`, `OVERFLOW`, `CONSTRAINT_VIOLATION` et `RENDER_FAILED`.

Les erreurs exposées sont typées, assainies, corrélées au rendu et
observables ; elles ne contiennent ni secret, ni message brut de processus,
ni chemin sensible, ni détail exploitable du navigateur.

## Observabilité et lineage

Chaque rendu doit pouvoir être relié à son entrée, sa configuration versionnée,
son renderer, sa version Chromium, son résultat, ses diagnostics et son état
d'exécution. Les logs et métriques restent séparés du contrat public et ne
doivent pas transformer le DOM ou le CSS en API métier.

## Interdictions et sortie de gate

Ce sous-gate interdit explicitement :

- toute fuite de DOM, CSS, Playwright ou Chromium dans RFC-001, RFC-002 ou le
  DTO public ;
- toute déduction automatique de nœuds à partir de la frontière ;
- toute implémentation de `RendererAdapter`, Core, template ou runtime ;
- toute mutation éditoriale en réponse à un diagnostic.

Le prochain gate est `GATE-SLYDESIGN-MODULE-STRUCTURE-001`. Il déterminera,
sur la base des responsabilités, des frontières et des contrats, quels
éléments deviennent des nœuds distincts ou restent des responsabilités
internes.
