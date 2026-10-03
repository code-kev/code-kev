# Inkdesk

Inkdesk is the monochrome artwork for Kevin Rodrigues's GitHub profile. The root README stays artwork-only; project instructions live here.

## Structure

```text
README.md                 GitHub profile artwork and theme selection
assets/                   published GIFs and reduced-motion PNGs
artwork/layers/           transparent heads and backing plates
scripts/render-animation.mjs
preview.html              local theme, size, and motion controls
docs/art-prompts.md        art direction, book titles, and edit briefs
package.json              render and preview commands
package-lock.json         pinned dependency tree
tmp/                      ignored frames, palettes, and samples
```

The migration preserves all files from the original working folder, including temporary render outputs in ignored `tmp/`. Git tracks the final artwork, source layers, renderer, preview, and documentation. The original folder is retained.

## Setup

Requirements:

- Node.js 20.9 or newer and npm.
- FFmpeg and FFprobe available on `PATH`.
- Python 3 for the optional local preview server.

```sh
npm ci
```

Sharp is a pinned development dependency. Viewing the GitHub README requires no build or runtime service.

## Preview

```sh
npm run preview
```

Open <http://127.0.0.1:8769/preview.html>. Controls switch day/night, desktop/mobile/full size, and motion/still. The scene fits mobile widths; book titles need zoom there. Stop the server with Ctrl+C.

## Render and verify

```sh
npm run check
```

This first verifies the README's image paths and the published PNG/GIF dimensions, frame count, duration, and loop settings. It then rebuilds both GIFs and checks canvas size, 24 frames, infinite looping, head motion, unchanged source bookshelves, and stationary bookshelf pixels in the encoded GIFs. Each loop is two seconds at 12 frames per second.

Render without checks, or rebuild one theme:

```sh
npm run build
npm run check -- --theme day
```

The renderer reads still masters from `assets/`, heads and backing plates from `artwork/layers/`, and writes GIFs to `assets/`. Intermediate frames, palettes, and sample PNGs go into ignored `tmp/`. It uses a clipped head-area backing patch so the original shelves and room remain still.

For artwork edits, preserve the 1672 × 941 canvas and agreed composition. Match replacement head layers and backing plates to the new master; the head bounds and neck pivot are explicit constants in the renderer. Follow [the art brief](art-prompts.md) for title order and ink style.

## Publish to the GitHub profile

GitHub requires a **public repository named `code-kev`** with a nonempty root `README.md` to display this artwork on the `code-kev` profile. See [GitHub's profile README requirements](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme).

Publishing means pushing the committed repository to `code-kev/code-kev`. No website hosting or deployment service is required. The README selects day/night images with `<picture>` and uses stills for reduced motion. Keep the four asset paths valid and commit regenerated GIFs when the artwork changes.

## Repository protection

The active [protection policy](protection-plan.md) requires feature branches and pull requests for updates to the profile, including the owner's own edits. The `artwork-check` workflow runs on PRs and on `main`. The required check must pass against the latest default branch, review conversations must be resolved, and changes must use squash merge. Force pushes and deletion of the default branch are blocked without a bypass.

Kevin is the sole maintainer, so no second-person approval is required. The separate owner-control ruleset limits repository branch changes and merges to the owner. Keep Actions tokens read-only and approve external fork workflows before they run.
