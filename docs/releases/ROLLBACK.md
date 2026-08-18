# Temple Release and Rollback Procedure

## Known-good recovery point

- Version: `v5.4.0`
- Commit: `ea3c90cb1257e82cd96be480921bf4fdc37dc614`
- Branch: `release/v5.4.0`

## Green-release rule

A production release is green only when all of these refer to the same intended release commit:

1. Source CI passes.
2. GitHub Pages reaches a successful terminal build/deployment state.
3. Deployed-origin verification passes.
4. Responsive visual checks pass at supported mobile/tablet/desktop widths.
5. Critical same-origin network diagnostics and ritual-media transport checks pass.
6. PWA/runtime diagnostics resolve the intended version and cache revision.

## Rollback

If a new release fails after deployment, restore `main` to a corrective commit based on `release/v5.4.0` or revert the offending release commit. Do not force-move the preserved rollback branch. After rollback, wait for Pages and deployed-origin verification to confirm the rollback commit before declaring recovery complete.
