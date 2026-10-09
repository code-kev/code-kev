# Kevin Rodrigues's GitHub profile

This repository publishes the profile README and its finished artwork. GitHub displays the root README from the default branch; pushing a release branch provides a preview until its changes reach `main`.

Read the [text / static profile](profile.md) for selectable copy, semantic headings and project usage links, or explore the [reusable artwork skill](../skills/glyph-artwork/SKILL.md).

## Repository contents

- `README.md`: artwork, profile sections, alternative text and contact links.
- `assets/day.webp` and `assets/night.webp`: the preferred animated hero, 836 × 471, 600 frames and a 25-second loop. WebP encoding preserves the delivery GIF pixels exactly.
- `assets/day.gif` and `assets/night.gif`: the approved GIF fallbacks for browsers without animated WebP support.
- `assets/day.png` and `assets/night.png`: approved stills at the same canvas size, embedded verbatim in the theme-aware reduced-motion `assets/still.svg`.
- `assets/profile/`: transparent dotted SVG sections at widths 800, 550, 350 and 288. Each export inherits the displayed theme with a fixed internal color palette.
- `profile/content.json`, `profile/glyphs.json` and `scripts/render-profile.mjs`: reviewed copy, the original glyph atlas and reproducible profile exports.
- `scripts/check-profile.mjs` and the test suite: verification of the published files and source/export consistency.
- `package.json` and `package-lock.json`: verification commands and the locked Sharp dependency.
- `.github/workflows/artwork.yml`: the required `artwork-check` job.

The README selects theme and motion variants with `<picture>` sources. Profile sections fill the README column; each clickable contact fills one third of the footer. Visible lettering is supplied by images, with profile copy retained in alternative text and descriptive names on links.

Start with [maintenance](maintenance.md) for changes and local verification, or [automation](automation.md) for CI and integration requirements. These docs replace the retired Inkdesk maintenance, prompt and protection documents.

See [artwork, sources and reuse](artwork.md) for the reproducible source-to-delivery mapping, known provenance and current license status.

## Reusable artwork skill

[Glyph Artwork Constitution](../skills/glyph-artwork/SKILL.md) captures the reusable techniques behind this artwork: aspect-correct character grids, deterministic glyph geometry, registered motion layers, preservation checks, honest encoding tradeoffs and GitHub delivery. Its general instructions are separate from this profile's specific asset contract. Earlier checkpoint history is not bundled with the skill.

To use it, copy the complete `skills/glyph-artwork` folder into your agent runtime's skill directory and invoke `$glyph-artwork`, or ask an agent to read its `SKILL.md` directly. Keep its references, script and alphabet asset with the entrypoint. The GitHub guide applies only to that surface, and the profile contract applies only to explicitly identified code-kev maintenance work.

The [worked example](../skills/glyph-artwork/references/worked-example.md) runs with Node.js and no installed dependencies. It produces a transparent 16:9 dot city/window scene, verifies its physical dimensions and rejects unsupported caption glyphs before writing. It is a static example, independent of Kevin's profile animation.
