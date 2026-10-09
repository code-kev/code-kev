# Current code-kev profile contract

Read this only when maintaining the already-approved code-kev artwork. It is a concrete application of the constitution, not a template that assigns Kevin's composition or settings to another user's scene.

## Approved composition and movement

The hero depicts a developer with headphones at a futuristic city workstation, a rounded bot and a blimp with an **AGI Soon** ribbon. Preserve the developer, desk, scene framing, architecture, bot expression, ribbon lettering and their registered geometry when making a bounded change. The day/night scenes share geometry; night is an inverse treatment rather than independently designed lighting.

The underlying dot/block study uses a 240×135 sampling grid. The blimp crosses the outer canvas edges behind the window bars. The bot notices at about 3 seconds, moves its eyes before its complete rounded housing turns, then returns to its bored resting pose. Music nod, two subtle hand motions and editor reveal/completion/hold/fade share the same loop clock. Keep eyes and mouth attached to the curved head surface, wrists/palms and keys anchored, and banner texture deterministic in ribbon coordinates.

## Published asset contract

- Canvas: 1672×941 for both GIFs and reduced-motion PNGs.
- GIFs and preferred lossless WebPs: 600 frames, identical 40/50 ms encoded delay arrays totaling 25,000 ms, infinite looping.
- Profile: nine exported sections/crops, each in day/night and 800/350/288 source-size variants. Each contact crop is one third of its source canvas width and 56 pixels tall, with equal vertical padding around the lettering. Container-end padding stays outside the clickable images.
- The README references six hero files (WebP, GIF fallback and PNG still in each theme) and 54 profile SVGs; body/hero display width is fluid and footer pieces each fill one third of the same column.
- Name and section headings outrank the smaller muted subtitle and body items. Stack, Building, Environment and Connect have coherent insets and separators. Contact links stay within the same boundary.
- Keep the approved profile wording, the public certkit destination and contact names/URLs together with their alternative text. Pentagent has no public repository link. The selectable-text disclosure was intentionally removed.

The conservative optimization retained all frame geometry and delays and reduced each GIF from roughly 21.86 to 16.31 MiB. It was accepted after full-loop decoded comparison measured a maximum grayscale error of 2/255 per theme. This is bounded lossy tone rounding, not a lossless export or a universally acceptable error limit. Further edits need fresh evidence. The preferred WebPs preserve every decoded pixel of these GIFs and reduce each transfer to about 11.1 MB; the GIFs remain compatibility fallbacks.

## Maintenance boundary

The published repository stores finished assets, a verifier, locked dependencies and operational docs. Source generation, earlier experiments and checkpoint tags remain in the local artwork workspace. A new skill or maintenance change does not authorize exporting that history or regenerating the approved art.

The current `artwork-check` validates asset paths, formats, SVG variants and widths, and hero metadata. It does not prove every pixel or complete visual transparency. For artwork changes, also perform the relevant rendered/decoded preservation comparisons and real-page visual checks; do not describe metadata-only validation as full-loop image verification.

Consult the current repository's [maintenance docs](https://github.com/code-kev/code-kev/blob/main/docs/maintenance.md) and [asset verifier](https://github.com/code-kev/code-kev/blob/main/scripts/check-profile.mjs). Read its active integration rules when publication is requested; successful owner pushes are not evidence that normal merge requirements passed.
