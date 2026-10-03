# Inkdesk — artwork prompt brief

Tool mode: built-in ImageGen edits, followed by layer animation with Sharp and FFmpeg. The briefs below summarize the final edit requests; they are not verbatim tool-call transcripts.

## Scene and lettering

Keep the approved close-cropped composition: rear three-quarter view of a developer wearing headphones at a laptop, modern mesh chair and desk, window overlooking rooftops and mountains, and a metal bookshelf on the right. Use clean black-and-white manga-informed ink with restrained hatching. No colors, smooth shading, plants, or table lamp. Preserve the room composition while adding legible titles to all nine upright book spines on each shelf.

Day: black ink on white, with clouds and a daytime outside view.

Night: white ink on black, with a crescent moon, stars, and lit windows. Preserve the same shelf geometry and title order.

Titles, left to right:

- Upper: Data Structures; Algorithms; Computer Architecture; Operating Systems; Computer Networks; Databases; Distributed Systems; Design Patterns; System Design.
- Middle: JavaScript; TypeScript; React; React Native; Node.js; API Design; CLI Tooling; Library Design; Property Testing.
- Lower: Agent Harnesses; Adaptive Loops; MCP; Orchestration; Tool Routing; Context Engineering; Sandboxing; Guardrails; Agent Evals.

## Animation layers

Head extraction, one edit per theme: isolate only the developer's hair, head, headphones, and neck on a transparent background. Retain the ink style and canvas dimensions. Exclude the shirt, chair, desk, window, and shelves.

Backing plate, one edit per theme: remove the head and headphones and reconstruct the window/view behind them. Preserve the collar, body, chair, desk, books, and surrounding scene. Retain the theme's monochrome ink style and canvas dimensions.

The renderer restores only the small head-area backing patch over the original scene, fits the extracted head to its original bounds, and applies a 0.9-degree sway with a 1.2-pixel bob. Two music notes rise and fade. The 24-frame loop lasts two seconds; shelves and titles remain stationary.

## Saved files

Paths are relative to the repository root:

- `assets/day.png`, `assets/night.png`: titled still masters.
- `artwork/layers/day-head.png`, `artwork/layers/night-head.png`: transparent head layers.
- `artwork/layers/day-plate.png`, `artwork/layers/night-plate.png`: backing plates.
- `assets/day.gif`, `assets/night.gif`: final animation exports.
- `README.md`: artwork-only markup, theme selection, and reduced-motion still sources.
- `preview.html`: local day/night, desktop/mobile, and motion/still preview.

Install with `npm ci`, then rebuild and verify with `npm run check`. See [maintenance](maintenance.md) for prerequisites and the repository layout.
