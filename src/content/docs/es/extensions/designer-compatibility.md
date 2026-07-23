---
title: Compatibilidad con Designer
description: Qué versión de Designer carga qué apiVersion de describe.json, por qué una extensión recién compilada puede no aparecer en Designer, y cómo gtdx doctor informa la incompatibilidad.
---

Una extensión que acabas de compilar puede instalarse correctamente, pasar todas las
comprobaciones locales y aun así no aparecer nunca en Designer. Casi siempre la causa es
una incompatibilidad de contrato: el `gtdx` con el que hiciste el scaffold apunta a un
contrato `describe.json` más nuevo que el Designer que tienes en ejecución.

Esta página es la matriz de versiones, el síntoma y la solución.

## La matriz

`describe.json` lleva un `apiVersion`. Hay dos generaciones, y Designer obtuvo soporte
para la segunda en **1.2.0**.

| Designer | `greentic.ai/v1` | `greentic.ai/v2` | SDK / `gtdx` |
|----------|------------------|------------------|--------------|
| `< 1.2.0` | carga | **omitida al arrancar** | `0.4.x` |
| `>= 1.2.0` | carga (migrada al leer) | carga | `1.2.x` y posteriores |

Un `gtdx` actual siempre hace scaffold de `greentic.ai/v2`. Así que la combinación
problemática es concretamente: **un SDK actual contra un Designer anterior a 1.2.0.**

Además de esta barrera de contrato, cada extensión declara el rango de Designer que
necesita — `compat.min_designer_version` en un describe v2, o `engine.greenticDesigner`
en uno v1. Ambos se comprueban.

## El síntoma

La extensión falta en `/api/extensions` y está ausente de la interfaz. En stderr al
arrancar, Designer registra una línea por cada extensión omitida:

```
Skipped extension my-ext-0.1.0 (declares greentic.ai/v2, which this designer (1.1.7)
cannot load — upgrade greentic-designer to >=1.2.0, or run `gtdx doctor` to check
every installed extension at once)
```

Las compilaciones más antiguas de Designer imprimen una versión más corta de esa línea
— `built for a newer designer` — sin la versión. Si eso es lo que ves, estás en una
compilación anterior al mensaje mejorado, y esta página es la mitad que falta.

## Diagnostícalo con `gtdx doctor`

`gtdx doctor` comprueba las extensiones instaladas contra el Designer que realmente
tienes, para que te enteres antes de ponerte a revisar los registros de arranque:

```console
$ gtdx doctor
designer compatibility
  ✓ greentic-designer 1.1.7  /usr/local/bin/greentic-designer
  ✗ my-ext 0.1.0: declares greentic.ai/v2, which designer 1.1.7 cannot load
    (it is skipped at boot as "built for a newer designer")
    — upgrade greentic-designer to >=1.2.0
```

La versión de Designer proviene de `greentic-designer --version`, admitida por todos los
linajes hasta 1.1.x. Si ejecutas Designer desde un checkout en lugar de desde el `PATH`,
apunta doctor a esa compilación:

```bash
GREENTIC_DESIGNER_BIN=../greentic-designer/target/release/greentic-designer gtdx doctor
```

Cuando no se encuentra ningún Designer, la comprobación lo informa y continúa — no es un
fallo.

No tienes que acordarte de ejecutarlo. `gtdx dev` y `gtdx install` ejecutan la misma
comprobación en cuanto terminan de instalar, de modo que un Designer que no vaya a cargar
lo que acabas de compilar te lo dice justo donde ya estás mirando:

```console
$ gtdx dev --once
✓ installed my-ext@0.1.0
⚠ my-ext installed, but this designer cannot load it: declares greentic.ai/v2, …
```

## La solución

**Actualiza Designer a 1.2.0 o posterior.** Ese es el camino admitido.

Deliberadamente no hay ningún flag para que un `gtdx` actual emita un describe v1.
Degradar el contrato significaría mantener dos formas de describe indefinidamente, y aun
así representaría erróneamente las extensiones que realmente dependen de funciones v2. Si
estás fijado a un Designer más antiguo por razones que no puedes cambiar, fija el SDK para
que coincida (`greentic-extension-sdk-* 0.4.x`) en lugar de degradar la salida de uno más
nuevo.

## Otras razones por las que se omite una extensión

No toda extensión omitida es un problema de versión. Designer también descarta
instalaciones que no puede usar:

| Mensaje de arranque | Causa | Solución |
|---------------------|-------|----------|
| `incomplete install (missing runtime component)` | `describe.json` apunta a un archivo de componente de runtime que no está ahí | Recompila y reinstala: `gtdx dev --once` |
| `runtime artifact unavailable` | El archivo del componente existe pero no es un componente WASM — normalmente un stub de marcador de posición o un archivo sin extraer | Recompila: `gtdx dev --once --release` |

## Véase también

- [gtdx CLI](/es/extensions/gtdx-cli/) — referencia completa de comandos
- [Escribir extensiones](/es/extensions/writing-extensions/) — el camino de autoría de principio a fin
