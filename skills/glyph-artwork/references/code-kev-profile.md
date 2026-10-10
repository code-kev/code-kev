# Current code-kev profile contract

Read this only when maintaining the already-approved code-kev artwork. It is a concrete application of the constitution, not a template that assigns Kevin's composition or settings to another user's scene.

## Approved composition and movement

The hero depicts a developer with headphones at a futuristic city workstation, a rounded bot and a blimp with an **AGI Soon** ribbon. Preserve the developer, desk, scene framing, architecture, bot expression, ribbon lettering and their registered geometry when making a bounded change. The day/night scenes share geometry. Night adds a fixed, grid-registered lighting pass to the approved inverse motion frames, preserving every occupied pixel while directing attention toward the monitor.

The underlying dot/block study uses a 240×135 sampling grid. The blimp crosses the outer canvas edges behind the window bars. The bot notices at about 3 seconds, moves its eyes before its complete rounded housing turns, then returns to its bored resting pose. Music nod, two subtle hand motions and editor reveal/completion/hold/fade share the same loop clock. Keep eyes and mouth attached to the curved head surface, wrists/palms and keys anchored, and banner texture deterministic in ribbon coordinates.

## Published asset contract

- Published delivery canvas: 836×471 for GIFs, WebPs and reduced-motion PNGs. Keep the 1672×941 masters in the local artwork workspace.
- GIFs and preferred lossless WebPs: 600 frames, identical 40/50 ms encoded delay arrays totaling 25,000 ms, infinite looping.
- Profile: nine exported sections/crops, each in 800/550/350/288 source-size variants with inherited day/night palettes. Each contact crop is one third of its source canvas width and 56 pixels tall, with equal vertical padding around the lettering. Container-end padding stays outside the clickable images.
- The README references five direct hero files (two WebPs, two GIF fallbacks and a theme-aware still SVG), the two PNGs embedded verbatim in that still, and 36 profile SVGs; body/hero display width is fluid and footer pieces each fill one third of the same column.
- Name and section headings outrank the smaller muted subtitle and body items. Stack, Building, Environment and Connect have coherent insets and separators. Contact links stay within the same boundary.
- Keep the approved profile wording, the public certkit destination and contact names/URLs together with their alternative text. Pentagent has no public repository link. The selectable-text disclosure was intentionally removed; a permanent text/static profile link now provides native headings and selectable copy.

The full-resolution masters include an earlier bounded tone optimization with a measured maximum grayscale error of 2/255; that is not a universally acceptable error limit. The compact baseline resamples those approved GIFs to 836×471 with Lanczos3 and the source palette, retaining all 600 frames and the exact original delays. Resizing changes pixels and can soften large or high-density displays. The current night pass intentionally changes tones using `scripts/render-night.mjs`; all 600 decoded GIF frames exactly match that pass applied to the pinned compact baseline. The banner, monitor and exposed rail highlights keep their approved tones, and no marks are added or removed. Preferred WebPs preserve every decoded RGBA pixel of their delivery GIFs: 5,641,488 bytes (day) and 4,074,302 bytes (night). GIF fallbacks are 7,318,375 and 5,159,126 bytes. Delivery PNG stills exactly match frame 204 (about 8.5 seconds), with the blimp banner inside the window and the bot turned toward it. The automated poster test compares all decoded pixels of this frame in both themes. Further edits need fresh preservation evidence and explicit tradeoffs.

## Maintenance boundary

The published repository stores finished assets, the reproducible profile content/atlas/renderer, the bounded night lighting renderer, a verifier, locked dependencies and operational docs. Original hero scene generation, earlier experiments and checkpoint tags remain in the local artwork workspace. A new skill or maintenance change does not authorize exporting that history or regenerating the approved art.

The current `artwork-check` validates asset paths, formats, SVG variants and widths, strictly limited palette CSS, the exact embedded PNG stills, and hero metadata. It does not prove every pixel or complete visual transparency. For artwork changes, also perform the relevant rendered/decoded preservation comparisons and real-page visual checks; do not describe metadata-only validation as full-loop image verification.

Consult the current repository's [maintenance docs](https://github.com/code-kev/code-kev/blob/main/docs/maintenance.md) and [asset verifier](https://github.com/code-kev/code-kev/blob/main/scripts/check-profile.mjs). Read its active integration rules when publication is requested; successful owner pushes are not evidence that normal merge requirements passed.
