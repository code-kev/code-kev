---
name: glyph-artwork
description: Use when creating or refining monochrome ASCII, dot-grid, block-glyph, or pixel artwork, including layered animations and artwork for GitHub READMEs.
---

# Glyph Artwork Constitution

Treat glyph artwork as a designed scene on a registered grid. Preserve the composition and character of an approved image while changing only the requested treatment or motion. These principles apply to new scenes too; choose their dimensions, palette and timing from the user's brief.

## Establish the contract

Identify the approved source, delivery surface, intended viewing widths, important silhouettes and expressions, permitted edit regions, theme behavior, motion/still requirements and file budget. Preserve a baseline and record those decisions. Separate the output canvas from the sampling grid and CSS display size. A small display does not authorize a smaller export.

For an existing approved scene, prefer bounded edits to whole-scene regeneration. If a requested technique cannot produce the requested outcome, explain the mismatch and offer the smallest useful alternative. A face patch over a fixed casing produces facial motion; a whole-head swivel requires the housing to turn too. Honor an explicitly chosen facial-only effect and label it accurately.

## Author the grid

Choose literal character cells, square pixels, or dot/block cells deliberately. Render explicit glyph geometry or a fixed bitmap atlas for repeatable output; define missing-character behavior rather than silently changing the font. Each cell should represent sampled tone or an authored mark, rather than an ASCII texture placed over the original raster.

Character cells are often rectangular. For a source aspect ratio `A`, `C` columns and cell dimensions `cw × ch`, choose `R ≈ C*cw/(A*ch)` rows. Check the resulting pixel dimensions, not the character-count ratio. At 6×10 cells, 160×90 characters produce 960×900 (16:15); a 16:9 source needs 160×54 characters, producing 960×540.

Sample luminance into a restrained, deterministic palette or calibrated glyph-density ramp. Preserve negative space, silhouettes and foreground/background separation. Inspect actual delivery widths: recognizable shape is not proof that an eye, mouth or letter reads. Confine contrast corrections to their intended objects; density and dot occupancy affect perceived brightness as well as RGB values.

For a complete dependency-free scene and caption, run `node scripts/dot-city.mjs city.svg "AI CITY"` from this skill's folder. Read [the worked example](references/worked-example.md) when adapting it. Its 160×54 rectangular-cell grid produces a 960×540 transparent SVG; the bundled bitmap alphabet rejects unsupported captions before writing. The example's dimensions and geometry are optional starting points, not a contract for another scene.

## Compose motion as registered layers

Extract the moving object and prepare a clean plate where its baked-in source pixels were removed. Keep shared coordinates for the base, sprite, edit mask and foreground occluders. Draw occluders after the moving layer. Window rails can hide a passing object without defining its route; entering/exiting at the outer canvas edge is a separate choice.

Define which parts move together. For a complete head turn, remove the original housing and animate the entire head, carrying eyes and mouth on its surface; preserve the stationary body. Author unseen sides as approximations and inspect front/profile/rear poses. Anchor tiny hand movement to stable wrists, palms and neighboring keys.

Use one scene clock, eased phase handoffs and continuous positions. Fractional-cell translation can smooth movement while preserving glyph shapes. Attach procedural grain to the object with deterministic coordinates, avoiding frame-to-frame noise. Check pose and attention continuity, offscreen holds and the loop reset. A still study is not an animation proof.

## Encode and prove the delivered artifact

Use a stable palette and measure the encoded output. GIF delays are centisecond units: 24 fps needs a distributed 40/50 ms schedule to preserve duration, not one rounded delay repeated forever. Read metadata without decoding every frame into one giant image; stream full-loop comparisons when needed.

Compare rendered frames outside the permitted masks exactly. After lossy encoding, compare decoded candidates against the approved reference using a declared error bound; report measured maximum/mean error and the scope actually checked. Also check stationary regions across encoded frames, phase samples, duration, delay sequence, looping and reset. An accepted small tone error is not lossless or pixel-identical.

If lossless or bounded-tone optimization misses the size budget, report the measured result. Offer resolution, frame-rate or tone changes as explicit design tradeoffs; do not silently alter an approved canvas or timing. Provide the intended reduced-motion still and verify each theme rather than treating inversion as separately directed lighting.

## Deliver for the actual surface

For GitHub, read [the README delivery guide](references/github-readme.md). Only when the user's request explicitly identifies the existing code-kev profile, also read [its current profile contract](references/code-kev-profile.md). A generic profile hero or a different client's scene uses that user's own contract, not this example's asset counts, dimensions or choreography.

Keep source-generation work, scratch proofs and checkpoint history distinct from the reviewed delivery set. Include the operational files needed to maintain and verify that set, including an existing required workflow and its dependencies. Derive files from actual references and callers, not a blanket “development” filter. Ignoring tip files does not remove tracked files or commit ancestry. Publish only when the user has authorized it, and preserve that authorization's branch/PR/merge scope.

## License

MIT (see the repository `LICENSE`). Adapt this skill and its example freely. The host profile's personal artwork is a separate scope and is not covered by that license; see `NOTICE.md`.
