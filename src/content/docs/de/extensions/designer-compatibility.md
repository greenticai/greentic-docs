---
title: Designer-Kompatibilität
description: Welche Designer-Version welche describe.json-apiVersion lädt, warum eine frisch gebaute Extension in Designer unsichtbar sein kann und wie gtdx doctor die Inkompatibilität meldet.
---

Eine gerade gebaute Extension kann korrekt installiert werden, jede lokale Prüfung
bestehen und trotzdem nie in Designer erscheinen. Fast immer ist die Ursache eine
Vertrags-Inkompatibilität: Das `gtdx`, mit dem du das Scaffold erstellt hast, zielt auf
einen neueren `describe.json`-Vertrag als der Designer, den du laufen hast.

Diese Seite enthält die Versionsmatrix, das Symptom und die Lösung.

## Die Matrix

`describe.json` trägt eine `apiVersion`. Es gibt zwei Generationen, und Designer erhielt
Unterstützung für die zweite in **1.2.0**.

| Designer | `greentic.ai/v1` | `greentic.ai/v2` | SDK / `gtdx` |
|----------|------------------|------------------|--------------|
| `< 1.2.0` | lädt | **beim Start übersprungen** | `0.4.x` |
| `>= 1.2.0` | lädt (beim Lesen migriert) | lädt | `1.2.x` und neuer |

Ein aktuelles `gtdx` erzeugt immer ein Scaffold mit `greentic.ai/v2`. Die problematische
Kombination ist also konkret: **ein aktuelles SDK gegen einen Designer älter als 1.2.0.**

Zusätzlich zu dieser Vertragsschranke deklariert jede Extension den Designer-Bereich, den
sie benötigt — `compat.min_designer_version` bei einem v2-describe oder
`engine.greenticDesigner` bei einem v1-describe. Beide werden geprüft.

## Das Symptom

Die Extension fehlt in `/api/extensions` und ist in der UI nicht vorhanden. Auf stderr
protokolliert Designer beim Start eine Zeile pro übersprungener Extension:

```
Skipped extension my-ext-0.1.0 (declares greentic.ai/v2, which this designer (1.1.7)
cannot load — upgrade greentic-designer to >=1.2.0, or run `gtdx doctor` to check
every installed extension at once)
```

Ältere Designer-Builds geben eine kürzere Version dieser Zeile aus — `built for a newer
designer` — ohne Versionsangabe. Wenn du das siehst, bist du auf einem Build vor der
verbesserten Meldung, und diese Seite ist die fehlende Hälfte.

## Diagnose mit `gtdx doctor`

`gtdx doctor` prüft deine installierten Extensions gegen den Designer, den du tatsächlich
hast, sodass du es erfährst, bevor du die Start-Logs durchsuchst:

```console
$ gtdx doctor
designer compatibility
  ✓ greentic-designer 1.1.7  /usr/local/bin/greentic-designer
  ✗ my-ext 0.1.0: declares greentic.ai/v2, which designer 1.1.7 cannot load
    (it is skipped at boot as "built for a newer designer")
    — upgrade greentic-designer to >=1.2.0
```

Die Designer-Version stammt aus `greentic-designer --version`, unterstützt von jeder
Linie zurück bis 1.1.x. Wenn du Designer aus einem Checkout statt aus dem `PATH`
ausführst, richte doctor auf diesen Build:

```bash
GREENTIC_DESIGNER_BIN=../greentic-designer/target/release/greentic-designer gtdx doctor
```

Wird kein Designer gefunden, meldet die Prüfung das und fährt fort — das ist kein Fehler.

Du musst nicht daran denken, es auszuführen. `gtdx dev` und `gtdx install` führen dieselbe
Prüfung aus, sobald die Installation abgeschlossen ist, sodass ein Designer, der nicht
laden wird, was du gerade gebaut hast, es dir genau dort sagt, wo du ohnehin hinschaust:

```console
$ gtdx dev --once
✓ installed my-ext@0.1.0
⚠ my-ext installed, but this designer cannot load it: declares greentic.ai/v2, …
```

## Die Lösung

**Aktualisiere Designer auf 1.2.0 oder neuer.** Das ist der unterstützte Weg.

Es gibt bewusst kein Flag, um ein aktuelles `gtdx` ein v1-describe ausgeben zu lassen. Den
Vertrag herabzustufen würde bedeuten, zwei describe-Formen auf unbestimmte Zeit zu pflegen,
und würde Extensions, die wirklich auf v2-Funktionen angewiesen sind, weiterhin falsch
darstellen. Wenn du aus unveränderlichen Gründen an einen älteren Designer gebunden bist,
fixiere das SDK entsprechend (`greentic-extension-sdk-* 0.4.x`), statt die Ausgabe eines
neueren herabzustufen.

## Weitere Gründe, warum eine Extension übersprungen wird

Nicht jede übersprungene Extension ist ein Versionsproblem. Designer sortiert auch
Installationen aus, die es nicht verwenden kann:

| Start-Meldung | Ursache | Lösung |
|---------------|---------|--------|
| `incomplete install (missing runtime component)` | `describe.json` verweist auf eine Runtime-Komponentendatei, die nicht vorhanden ist | Neu bauen und neu installieren: `gtdx dev --once` |
| `runtime artifact unavailable` | Die Komponentendatei existiert, ist aber keine WASM-Komponente — meist ein Platzhalter-Stub oder ein nicht entpacktes Archiv | Neu bauen: `gtdx dev --once --release` |

## Siehe auch

- [gtdx CLI](/de/extensions/gtdx-cli/) — vollständige Befehlsreferenz
- [Extensions schreiben](/de/extensions/writing-extensions/) — der Authoring-Weg von Anfang bis Ende
