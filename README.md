# Messaging Intel marketing site

Astro source for [https://messaging-intel.github.io/](https://messaging-intel.github.io/).

Consent-aware follow-up review with explicit evidence, exact-body approval, and immediate pre-send revalidation.

## Product boundary

The site describes a release-gated preview. Live provider sending remains fail-closed until selector certification and release evidence pass.

## Local validation

```sh
npm ci --ignore-scripts
npm test
npm run check
npm run build
```

GitHub Pages publishes only the tested `dist/` artifact from `main`. Dependencies are locked and all third-party workflow actions are pinned to immutable commits.
