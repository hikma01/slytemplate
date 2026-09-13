# GATE-SLYDESIGN-CHROMIUM-RATIFICATION-001

```yaml
artifact_id: GATE-SLYDESIGN-CHROMIUM-RATIFICATION-001
artifact_type: ARCHITECTURAL_GATE_DECISION
module_id: SLYDESIGN
status: RATIFIED_WITH_LIMITATIONS
authority: Architecture / Coordinateur Central
production_code_authority: NOT_GRANTED
decision_date: 2026-09-09
```

## Décision

Chromium Headless derrière un `RendererAdapter` est ratifié comme backend V1
CV cible, sous réserve des contrôles de la frontière d'exécution de
production. Cette décision confirme le choix d'architecture et n'autorise
pas encore l'implémentation runtime.

```text
V1_CV_BACKEND = CHROMIUM_HEADLESS
EXECUTION_LAYER = PLAYWRIGHT_OR_EQUIVALENT_ISOLATED_ADAPTER
RFC_002_MEASUREMENTS = PASS_WITH_LIMITATIONS
DETERMINISM = PASS_WITH_LIMITATIONS
SECURITY_ISOLATION = PASS_WITH_LIMITATIONS
PERFORMANCE_MEMORY = PASS_WITH_LIMITATIONS
PRODUCTION_CODE_MODIFIED = NO
```

## Preuve examinée

- Rapport : `benchmark/SLYDESIGN-RENDERER-BENCHMARK-001/CHROMIUM-EVIDENCE-CLOSURE-REPORT.md`
- Résultats : `benchmark/SLYDESIGN-RENDERER-BENCHMARK-001/evidence/chromium-closure-results.json`
- Sécurité : `benchmark/SLYDESIGN-RENDERER-BENCHMARK-001/evidence/chromium-closure-security.json`
- Mesure processus : `benchmark/SLYDESIGN-RENDERER-BENCHMARK-001/evidence/chromium-closure-time.txt`

La preuve couvre six fixtures CV, cinq répétitions par fixture, les états
`FIT`, overflow vertical/horizontal, `CONSTRAINT_VIOLATION` et
`RENDER_FAILED`, ainsi que les signatures fonctionnelles, l'isolation réseau
et les observations de performance/mémoire.

## Limites obligatoires

La ratification reste conditionnelle aux éléments suivants :

1. figer les fichiers et versions de polices ;
2. décider et documenter la normalisation des métadonnées PDF, ou une politique
   d'équivalence fonctionnelle ;
3. apporter une preuve de déploiement pour sandbox OS, allowlist filesystem,
   délais d'exécution et limites CPU/mémoire ;
4. remplacer l'échantillonnage RSS partiel par une mesure de déploiement
   reproductible.

Ces contrôles appartiennent à la frontière d'exécution et ne doivent pas être
ajoutés au `PresentationDocumentDTO`, au Core SlyDesign ou au contrat RFC-002.

## Portée de la décision

Cette gate :

- ratifie Chromium comme cible de backend V1 CV derrière l'abstraction
  `RendererAdapter` ;
- ne modifie ni RFC-001, ni RFC-002, ni le DTO public ;
- ne crée aucun nœud SlyDesign ;
- n'autorise aucun template ou code de production ;
- maintient BusinessCard, Banner et Flyer hors périmètre.

Le prochain gate est `GATE-SLYDESIGN-CHROMIUM-PRODUCTION-BOUNDARY-001`,
consacré aux preuves de déploiement avant toute demande d'autorité de code.
