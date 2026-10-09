# Kevin Rodrigues's GitHub profile

This repository publishes the profile README and its finished artwork. GitHub displays the root README from the default branch; pushing a release branch provides a preview until its changes reach `main`.

## Repository contents

- `README.md`: artwork, profile sections, alternative text and contact links.
- `assets/day.webp` and `assets/night.webp`: the preferred animated hero, 836 × 471, 600 frames and a 25-second loop. WebP encoding preserves the delivery GIF pixels exactly.
- `assets/day.gif` and `assets/night.gif`: the approved GIF fallbacks for browsers without animated WebP support.
- `assets/day.png` and `assets/night.png`: approved stills at the same canvas size, embedded verbatim in the theme-aware reduced-motion `assets/still.svg`.
- `assets/profile/`: transparent dotted SVG sections at widths 800, 350 and 288. Each export inherits the displayed theme with a fixed internal color palette.
- `scripts/check-profile.mjs` and its test: verification of the published files.
- `package.json` and `package-lock.json`: verification commands and the locked Sharp dependency.
- `.github/workflows/artwork.yml`: the required `artwork-check` job.

The README selects theme and motion variants with `<picture>` sources. Profile sections fill the README column; each clickable contact fills one third of the footer. Visible lettering is supplied by images, with profile copy retained in alternative text and descriptive names on links.

Start with [maintenance](maintenance.md) for changes and local verification, or [automation](automation.md) for CI and integration requirements. These docs replace the retired Inkdesk maintenance, prompt and protection documents.

## Reusable artwork skill

[Glyph Artwork Constitution](../skills/glyph-artwork/SKILL.md) captures the reusable techniques behind this artwork: aspect-correct character grids, deterministic glyph geometry, registered motion layers, preservation checks, honest encoding tradeoffs and GitHub delivery. Its general instructions are separate from this profile's specific asset contract. Earlier checkpoint history is not bundled with the skill.

To use it, copy the complete `skills/glyph-artwork` folder into your agent runtime's skill directory and invoke `$glyph-artwork`, or ask an agent to read its `SKILL.md` directly. Keep the two reference files with the entrypoint; the GitHub guide applies only to that surface, and the profile contract applies only to explicitly identified code-kev maintenance work.
