---
title: توافق Designer
description: أي إصدار من Designer يحمّل أي apiVersion من describe.json، ولماذا قد لا يظهر امتداد بُني حديثًا في Designer، وكيف يُبلّغ gtdx doctor عن عدم التطابق.
---

قد يُثبَّت امتداد بنيته للتو بشكل صحيح، ويجتاز كل فحص محلي، ومع ذلك لا يظهر أبدًا في
Designer. السبب دائمًا تقريبًا هو عدم تطابق في العقد: إن `gtdx` الذي أنشأت به السقالة
(scaffold) يستهدف عقد `describe.json` أحدث من Designer الذي تشغّله.

هذه الصفحة هي مصفوفة الإصدارات، والعَرَض، والإصلاح.

## المصفوفة

يحمل `describe.json` قيمة `apiVersion`. هناك جيلان، وحصل Designer على دعم الجيل الثاني في
**1.2.0**.

| Designer | `greentic.ai/v1` | `greentic.ai/v2` | SDK / `gtdx` |
|----------|------------------|------------------|--------------|
| `< 1.2.0` | يُحمَّل | **يُتخطّى عند الإقلاع** | `0.4.x` |
| `>= 1.2.0` | يُحمَّل (يُرحَّل عند القراءة) | يُحمَّل | `1.2.x` وأحدث |

ينشئ `gtdx` الحالي دائمًا سقالة بصيغة `greentic.ai/v2`. لذا فإن التركيبة المعطوبة تحديدًا
هي: **SDK حالي مقابل Designer أقدم من 1.2.0.**

فوق بوابة العقد هذه، يعلن كل امتداد نطاق Designer الذي يحتاجه —
`compat.min_designer_version` في describe من الجيل v2، أو `engine.greenticDesigner` في
v1. يُفحَص كلاهما.

## العَرَض

الامتداد مفقود من `/api/extensions` وغائب عن الواجهة. على stderr عند الإقلاع، يسجّل
Designer سطرًا واحدًا لكل امتداد متخطّى:

```
Skipped extension my-ext-0.1.0 (declares greentic.ai/v2, which this designer (1.1.7)
cannot load — upgrade greentic-designer to >=1.2.0, or run `gtdx doctor` to check
every installed extension at once)
```

تطبع إصدارات Designer الأقدم نسخة أقصر من ذلك السطر — `built for a newer designer` —
دون الإصدار. إن كان هذا ما تراه، فأنت على بناء يسبق الرسالة المحسّنة، وهذه الصفحة هي
النصف المفقود.

## شخّصه باستخدام `gtdx doctor`

يفحص `gtdx doctor` امتداداتك المثبّتة مقابل Designer الذي تملكه فعليًا، لتعرف قبل أن تبدأ
البحث في سجلات الإقلاع:

```console
$ gtdx doctor
designer compatibility
  ✓ greentic-designer 1.1.7  /usr/local/bin/greentic-designer
  ✗ my-ext 0.1.0: declares greentic.ai/v2, which designer 1.1.7 cannot load
    (it is skipped at boot as "built for a newer designer")
    — upgrade greentic-designer to >=1.2.0
```

يأتي إصدار Designer من `greentic-designer --version`، المدعوم من كل سلالة حتى 1.1.x. إذا
كنت تشغّل Designer من نسخة مسحوبة (checkout) بدلًا من `PATH`، فوجّه doctor إلى ذلك البناء:

```bash
GREENTIC_DESIGNER_BIN=../greentic-designer/target/release/greentic-designer gtdx doctor
```

عندما لا يُعثَر على Designer، يُبلّغ الفحص بذلك ويمضي — وهذا ليس فشلًا.

لست مضطرًا لتذكّر تشغيله. يشغّل `gtdx dev` و`gtdx install` الفحص نفسه لحظة انتهاء التثبيت،
بحيث إن Designer الذي لن يحمّل ما بنيته للتو يخبرك بذلك في المكان الذي تنظر إليه أصلًا:

```console
$ gtdx dev --once
✓ installed my-ext@0.1.0
⚠ my-ext installed, but this designer cannot load it: declares greentic.ai/v2, …
```

## الإصلاح

**رقِّ Designer إلى 1.2.0 أو أحدث.** هذا هو المسار المدعوم.

لا يوجد عمدًا أي راية تجعل `gtdx` الحالي يصدر describe بصيغة v1. إن خفض العقد يعني الحفاظ
على شكلين من describe إلى أجل غير مسمّى، وسيظل يمثّل بشكل خاطئ الامتدادات التي تعتمد فعليًا
على ميزات v2. إذا كنت مقيّدًا بإصدار Designer أقدم لأسباب لا يمكنك تغييرها، ثبّت SDK ليطابقه
(`greentic-extension-sdk-* 0.4.x`) بدلًا من خفض مُخرَجات إصدار أحدث.

## أسباب أخرى لتخطّي امتداد

ليس كل امتداد متخطّى مشكلةَ إصدار. يستبعد Designer أيضًا التثبيتات التي لا يمكنه استخدامها:

| رسالة الإقلاع | السبب | الإصلاح |
|---------------|-------|---------|
| `incomplete install (missing runtime component)` | يشير `describe.json` إلى ملف مكوّن وقت تشغيل غير موجود | أعد البناء وأعد التثبيت: `gtdx dev --once` |
| `runtime artifact unavailable` | ملف المكوّن موجود لكنه ليس مكوّن WASM — عادةً كعب روتين نائب أو أرشيف غير مُستخرَج | أعد البناء: `gtdx dev --once --release` |

## انظر أيضًا

- [gtdx CLI](/ar/extensions/gtdx-cli/) — مرجع الأوامر الكامل
- [كتابة الامتدادات](/ar/extensions/writing-extensions/) — مسار التأليف من البداية إلى النهاية
