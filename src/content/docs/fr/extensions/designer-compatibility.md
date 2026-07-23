---
title: Compatibilité avec Designer
description: Quelle version de Designer charge quelle apiVersion de describe.json, pourquoi une extension fraîchement compilée peut être invisible dans Designer, et comment gtdx doctor signale l'incompatibilité.
---

Une extension que vous venez de compiler peut s'installer correctement, passer toutes les
vérifications locales et pourtant ne jamais apparaître dans Designer. La cause est presque
toujours une incompatibilité de contrat : le `gtdx` avec lequel vous avez fait le scaffold
cible un contrat `describe.json` plus récent que le Designer que vous exécutez.

Cette page contient la matrice des versions, le symptôme et la correction.

## La matrice

`describe.json` porte une `apiVersion`. Il existe deux générations, et Designer a obtenu
la prise en charge de la seconde en **1.2.0**.

| Designer | `greentic.ai/v1` | `greentic.ai/v2` | SDK / `gtdx` |
|----------|------------------|------------------|--------------|
| `< 1.2.0` | charge | **ignorée au démarrage** | `0.4.x` |
| `>= 1.2.0` | charge (migrée à la lecture) | charge | `1.2.x` et ultérieures |

Un `gtdx` actuel génère toujours un scaffold en `greentic.ai/v2`. La combinaison
problématique est donc précisément : **un SDK actuel face à un Designer antérieur à 1.2.0.**

Au-delà de cette barrière de contrat, chaque extension déclare la plage de Designer dont
elle a besoin — `compat.min_designer_version` sur un describe v2, ou
`engine.greenticDesigner` sur un v1. Les deux sont vérifiés.

## Le symptôme

L'extension est absente de `/api/extensions` et de l'interface. Sur stderr au démarrage,
Designer journalise une ligne par extension ignorée :

```
Skipped extension my-ext-0.1.0 (declares greentic.ai/v2, which this designer (1.1.7)
cannot load — upgrade greentic-designer to >=1.2.0, or run `gtdx doctor` to check
every installed extension at once)
```

Les builds Designer plus anciens impriment une version plus courte de cette ligne —
`built for a newer designer` — sans la version. Si c'est ce que vous voyez, vous êtes sur
un build antérieur au message amélioré, et cette page est la moitié manquante.

## Diagnostiquer avec `gtdx doctor`

`gtdx doctor` vérifie vos extensions installées par rapport au Designer que vous avez
réellement, afin que vous le sachiez avant d'aller fouiller les journaux de démarrage :

```console
$ gtdx doctor
designer compatibility
  ✓ greentic-designer 1.1.7  /usr/local/bin/greentic-designer
  ✗ my-ext 0.1.0: declares greentic.ai/v2, which designer 1.1.7 cannot load
    (it is skipped at boot as "built for a newer designer")
    — upgrade greentic-designer to >=1.2.0
```

La version de Designer provient de `greentic-designer --version`, prise en charge par
toutes les lignées jusqu'à 1.1.x. Si vous exécutez Designer depuis un checkout plutôt que
depuis le `PATH`, pointez doctor vers ce build :

```bash
GREENTIC_DESIGNER_BIN=../greentic-designer/target/release/greentic-designer gtdx doctor
```

Lorsqu'aucun Designer n'est trouvé, la vérification le signale et continue — ce n'est pas
un échec.

Vous n'avez pas besoin de penser à l'exécuter. `gtdx dev` et `gtdx install` exécutent la
même vérification dès qu'ils terminent l'installation, de sorte qu'un Designer qui ne
chargera pas ce que vous venez de compiler vous le dit là où vous regardez déjà :

```console
$ gtdx dev --once
✓ installed my-ext@0.1.0
⚠ my-ext installed, but this designer cannot load it: declares greentic.ai/v2, …
```

## La correction

**Mettez Designer à niveau vers 1.2.0 ou une version ultérieure.** C'est la voie prise en
charge.

Il n'existe délibérément aucun flag pour qu'un `gtdx` actuel émette un describe v1.
Rétrograder le contrat signifierait maintenir deux formes de describe indéfiniment, et
représenterait toujours de manière erronée les extensions qui dépendent vraiment des
fonctionnalités v2. Si vous êtes bloqué sur un Designer plus ancien pour des raisons que
vous ne pouvez pas changer, épinglez le SDK pour qu'il corresponde
(`greentic-extension-sdk-* 0.4.x`) plutôt que de rétrograder la sortie d'un SDK plus
récent.

## Autres raisons pour lesquelles une extension est ignorée

Toute extension ignorée n'est pas un problème de version. Designer écarte aussi les
installations qu'il ne peut pas utiliser :

| Message de démarrage | Cause | Correction |
|----------------------|-------|------------|
| `incomplete install (missing runtime component)` | `describe.json` pointe vers un fichier de composant de runtime absent | Recompilez et réinstallez : `gtdx dev --once` |
| `runtime artifact unavailable` | Le fichier du composant existe mais n'est pas un composant WASM — généralement un stub d'espace réservé ou une archive non extraite | Recompilez : `gtdx dev --once --release` |

## Voir aussi

- [gtdx CLI](/fr/extensions/gtdx-cli/) — référence complète des commandes
- [Écrire des extensions](/fr/extensions/writing-extensions/) — le parcours d'authoring de bout en bout
