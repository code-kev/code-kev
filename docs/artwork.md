# Artwork, sources and reuse

The hero and profile lettering share a monochrome dot treatment, but use separate source and delivery paths. The hero's approved animation remains unchanged by the profile renderer.

## Source to delivery

| Reviewed source | Published output | Regeneration / verification |
| --- | --- | --- |
| `profile/content.json` | Root README, native profile and matching alternative text | `npm run render:profile`; source/export drift tests |
| `profile/glyphs.json` | Nine SVG groups, each at 288/350/550/800px | Same renderer; explicit circles, word wrapping, bounds and contact-padding tests |
| Local approved 1672×941 GIF masters | 836×471 GIF fallbacks and lossless WebP copies | Encoders and decoded comparisons described in [maintenance](maintenance.md) |
| Approved compact night GIF from commit `0aba8b4` and `profile/developer-head.svg` | Directed night GIF, lossless WebP and matching poster | `scripts/render-night.mjs`; glyph-owned head lighting and full-loop decoded comparisons |
| Selected common frame of the delivery GIFs | Day/night PNGs and theme-aware `still.svg` | Poster pixel comparison and exact wrapper validation |
| Self-contained skill folder | A generic 960×540 city/window example | `node scripts/dot-city.mjs city.svg "AI CITY"` from that folder |

The profile atlas was recovered from the existing approved dotted SVG word exports used by the earlier profile. It retains their 5×7 bitmaps and 0.36-cell dot radius. Its limited character set is explicit; new glyphs need deliberate authoring. The skill bundles a copy so installation does not depend on this repository's profile sources.

The developer head SVG contains the original hero's explicit head marks and clipping paths at the native canvas size. It supplies coverage for the lighting pass, not replacement animation geometry. It belongs to the personal artwork scope described below.

The hero's earlier raster/source attribution is not recorded in this release. The available evidence establishes which delivery files were approved and how they were resized/encoded; it does not establish upstream rights. Local masters, checkpoint history, planning documents and lighting studies are excluded from publication.

## Learn and adapt

Start with [Glyph Artwork Constitution](../skills/glyph-artwork/SKILL.md) and its [complete worked example](../skills/glyph-artwork/references/worked-example.md). The generic example uses authored physical coordinates, a calibrated rectangular-cell grid, explicit dot geometry and a bundled caption alphabet. It contains no developer, bot, personal contact data or animation choreography from Kevin's hero.

For this profile, the [maintenance guide](maintenance.md) defines the operational contracts. Metadata checks protect formats, timing and byte ceilings; relevant decoded/rendered comparisons provide preservation evidence. The directed night animation uses a deterministic tone pass over the approved motion frames. It darkens existing marks around the monitor while preserving their occupied pixels; it does not generate new geometry or use an AI-produced raster as an animation frame. All 600 GIF frames were compared to that intended tone pass, and all 600 WebP frames to the GIF, with exact decoded matches.

## Reuse terms

The code, the reusable skill and the documentation are licensed under the MIT License ([LICENSE](../LICENSE)). Personal profile artwork is a separate scope and is not covered by it: `assets/**` and `profile/**` remain © 2026 Kevin Rodrigues, all rights reserved. The skill bundles its own copy of the alphabet, so the MIT-licensed part stays self-contained. Public GitHub access alone does not supply a reuse grant for the artwork; see [NOTICE.md](../NOTICE.md) and [GitHub's licensing guide](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).
