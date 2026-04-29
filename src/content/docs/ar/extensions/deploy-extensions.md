---
title: Deployer Extensions
description: Declare deployment planners and operations with greentic.deployer.v1 metadata.
---

Deployer extensions describe how Greentic can deploy a bundle without baking every target into application packs. A deployer can target local development, Docker or Podman, Kubernetes, Terraform, AWS, Azure, GCP, private clouds, or a custom enterprise deployer.

The current deployer path is `greentic.deployer.v1` metadata inside a `.gtpack`.

## Contract Shape

`greentic.deployer.v1` is not a `greentic.ext.capabilities.v1` offer list. It has its own validated contract:

```yaml title="pack.yaml"
extensions:
  greentic.deployer.v1:
    kind: greentic.deployer.v1
    version: 1.0.0
    inline:
      schema_version: 1
      planner:
        flow_id: flows/plan.ygtc
      capabilities:
        - capability: plan
          flow_id: flows/plan.ygtc
        - capability: apply
          flow_id: flows/apply.ygtc
        - capability: destroy
          flow_id: flows/destroy.ygtc
        - capability: status
          flow_id: flows/status.ygtc
        - capability: rollback
          flow_id: flows/rollback.ygtc
```

Supported deployer capabilities are:

- `generate`
- `plan`
- `apply`
- `destroy`
- `status`
- `rollback`

Validation requires `schema_version: 1`, a non-empty planner `flow_id`, non-empty capability `flow_id` values, no duplicate capability entries, and at least the `plan` capability.

## Create One with the Wizard

Use the wizard and select the `deployer` extension type:

```bash
gtc wizard
```

For repeatable generation:

```bash
gtc wizard --schema
gtc wizard --answers deployer-extension-answers.json
```

The wizard catalog maps `deployer` to `greentic.deployer.v1`. It writes catalog answers under `extensions/`, updates `pack.yaml`, and scaffolds the files the selected template needs.

## What a Deployer Does

A deployer extension normally provides one or more flows:

- a planner flow that turns bundle configuration into a deployment plan
- an apply flow that performs the deployment
- a status flow that reports deployment state
- optional generate, destroy, or rollback flows

This keeps deployment separate from business flows. The same application bundle can be planned locally, applied to Kubernetes, deployed to one of the major clouds, or handed to a platform-team deployer selected by the operator.

## Validate

Run:

```bash
gtc dev pack lint --in ./my-deployer-pack
gtc dev pack resolve --in ./my-deployer-pack
gtc dev pack build --in ./my-deployer-pack
gtc dev pack doctor ./my-deployer-pack
```

Do not document the older `.gtxpack` deploy-extension contract or `gtdx` commands as the current path.
