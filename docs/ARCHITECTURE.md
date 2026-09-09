# Certification Architecture

## Before

`index.html` was simultaneously source code, finance engine, UI, styles, diagnostics and deployment artifact.

## After

```text
src/finance/engine.js      pure, dependency-free certified calculations
src/runtime/install.js     compatibility bridge into existing workstation engines
scripts/build.js           deterministic single-file generator / injector
scripts/verify-build.js    deployment artifact checks
scripts/static-audit.js    financial-danger-pattern audit leads
tests/*.test.js            known-answer, regression, property and integration tests
docs/*                     certification, limitations, baseline and test evidence
dist/index.html            generated standalone artifact
index.html                 generated deployable root on certification branch
```

The existing HTML remains the UI template and preserves its navigation, screens, storage schema and visual identity. The build injects the certified calculation layer immediately before the existing `DOMContentLoaded` initialization hook, so patched calculations are installed before the app starts.

The build is idempotent: an existing certification block is removed before the current engine/runtime versions are injected. This allows the deployable root to remain a single portable HTML file while the financial logic is maintained and tested separately.
