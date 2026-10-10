# Maintain the published profile

## Install and verify

Use Node.js 24 and npm. From the repository root:

```sh
npm ci --no-audit --no-fund
npm test
npm run check
npm audit
```

Verification only reads the published assets. It checks all referenced files, their formats, hero dimensions, each 600-frame GIF/WebP animation's 40/50 ms delays, its 25-second duration and infinite loop, still PNGs, all four responsive SVG exports per section, and the absence of unused assets. SVG widths must match their variant suffix; contact crops use one third of that width. The Profile SVG guard rejects scripts, embedded images, external references and paint URLs. It allows only fixed RGB palette CSS. The reduced-motion SVG is validated against an exact template containing the two approved PNGs; arbitrary CSS or external images are rejected. Tests exercise the real verifier against valid assets and broken paths, missing variants, unsafe SVGs, incorrect export sizes and incorrect animation frames, mismatched WebP/GIF timing, theme/motion source order and unbalanced contact-image padding. WebP delay arrays must exactly match their GIF fallbacks, and WebPs must be smaller than those fallbacks.

No FFmpeg installation, artwork rendering or hosting service is needed to run these checks or display the README.

The verifier rejects a missing or incorrect reduced-motion condition, a still source placed after animation, or an incorrect still source type. Each WebP is limited to 6,000,000 bytes and each GIF fallback to 8,000,000 bytes; larger deliveries require an explicit reviewed budget change. These ceilings prevent transfer-size regressions independently of the WebP/GIF size comparison.

## Change profile text or contacts

Edit `profile/content.json`, then run `npm run render:profile`. This regenerates the README, `docs/profile.md` and nine dotted SVG groups at widths `288`, `350`, `550` and `800`. The recovered 5×7 atlas in `profile/glyphs.json` preserves the original dot positions and 0.36-cell radius. Unknown characters and words that cannot fit fail before any output is written. Tests compare every published profile file against the renderer, so stale exports fail CI.

The intermediate 550px layout increases body marks to 2.4px cells; the other variants use 2.2px cells. At the previously measured 238, 308, 430 and 846px profile columns, body ink spans at least 12px vertically. Viewport sources remain independent of the fixed internal light/dark palettes. GitHub repository and profile columns differ, so inspect both before changing the breakpoints. Contact crops remain 56px tall with centered lettering and equal vertical touch padding.

The hero scene still lives in the separate local artwork workspace. Profile wording and glyph exports are now reproducible from this public repository without browser layout captures. Planning notes, experiments, screenshots and checkpoint history remain local.

## Change hero artwork

For a change to either theme, replace its WebP, GIF fallback and reduced-motion PNG together, and rebuild `still.svg` after reviewing the animation. The approved delivery format is 836 × 471, 600 frames, 40/50 ms frame delays, a 25-second total duration and infinite looping. An intentional format change must update the verifier and its tests in the same change. Keep the 1672 × 941 masters in the local artwork workspace.

The README selects a reduced-motion SVG first (with both approved PNGs embedded), then explicit light/dark `image/webp` sources, then GIF fallbacks. Delivery WebPs are 5,641,488 bytes (day) and 4,074,302 bytes (night); GIF fallbacks are 7,318,375 and 5,159,126 bytes. The directed night pass reduced the earlier compact night WebP by 30.2% and GIF by 31.3%. All 600 frames and their original delay arrays are retained. Each WebP was compared against every decoded RGBA pixel of its delivery GIF: 236,253,600 pixels per theme, with zero additional channel error, 25-second duration and infinite looping. The compact baseline resamples the original masters; these copies are not lossless relative to the full-resolution masters. Both reduced-motion PNGs exactly match frame 204 (about 8.5 seconds into the loop), selected for the visible blimp banner and the bot's attentive side pose. Day/night PNGs are 128,420 and 105,644 bytes. The combined still wrapper is 312,444 bytes, 15.7% smaller than the preceding 370,448-byte wrapper.

To regenerate delivery files in the artwork workspace, resize each approved master GIF with `gifsicle --conserve-memory -O3 -Okeep-empty --resize-width 836 --resize-method lanczos3 input.gif -o delivery.gif`, then run `gif2webp -min_size -q 75 -m 4 -mt delivery.gif -o delivery.webp` from libwebp. The resize uses the source palette without adding colors or dithering. Extract frame 204 of each delivery GIF as a lossless grayscale PNG and rebuild the exact theme-aware still SVG. WebP encoding is lossless relative to the resized GIF; `-q` here controls compression effort. Repeat the full decoded comparison and review the resampling before replacing files. Runtime verification needs neither encoder. See the [Gifsicle manual](https://www.lcdf.org/gifsicle/man.html) and [WebP encoder documentation](https://developers.google.com/speed/webp/docs/gif2webp).

### Reproduce directed night lighting

The night pass uses the approved compact GIF from commit `0aba8b4204b90ac682a4a71ede9286ec508b6c81`, SHA-256 `134762e8f5a07e56d4bfb57d2f99eb60c003d0b5cbf4749741ecfdc8f410742b`. Use a full-history clone, Node.js, the installed Sharp dependency, FFmpeg, Gifsicle and libwebp's `gif2webp`. The validated encoder/decoder versions are FFmpeg 9.0.2, Gifsicle 1.96 and libwebp 1.6.0; FFmpeg must support animated WebP decoding for the complete pixel comparison.

```sh
mkdir -p tmp
git show 0aba8b4204b90ac682a4a71ede9286ec508b6c81:assets/night.gif > tmp/night-source.gif
node scripts/render-night.mjs tmp/night-source.gif tmp/night-directed
```

The output directory must be new. The renderer rejects an unapproved input before creating it. It applies a fixed grayscale field registered to the original 240×135 scene grid: the monitor, ribbon and exposed rail highlights keep their original tones; developer, city, bot and desk marks receive restrained, directional attenuation. It never creates a mark or turns an occupied pixel into background. The left-rail protection ends behind the developer and excludes the overlapping head and chair; the small exposed rail segment below the earcup remains protected. A fixed gray quantization avoids dithering and temporal noise. Lighting is an intentional tone change, not a pixel-identical copy of the earlier night scene or a simulation of new cast shadows.

The script renders 600 PNG frames, encodes the GIF and lossless WebP, and extracts poster frame 204. Before reporting success, it compares every decoded GIF pixel against the intended lighting pass, every WebP RGBA pixel against the GIF, and both complete delay arrays against the input. It also checks dimensions, infinite looping and delivery budgets. `verification.json`, intermediate frames and encodings remain local. Encoder versions can affect bytes; the decoded comparisons and budgets must still pass.

Review the start, eye tracking, housing turn, typing completion and loop reset at desktop and narrow widths before copying `night.gif`, `night.webp` and `night.png` into `assets/`. Rebuild `still.svg` with the exact existing template and both PNGs encoded as base64, then run the normal checks. The day assets are independent and need not be regenerated for a night-only change. The previous compact loop had 462 differing first/last grayscale pixels (maximum difference 24/255); the directed loop has 444 (maximum 16/255), so the pass did not introduce a larger reset seam.

Live manual-theme testing found the actual asymmetry: GitHub's `themed-picture` component rewrites a source containing `prefers-color-scheme` to a theme-only condition. It discards additional motion and viewport conditions. In dark mode, the old first source therefore selected `night.png` even with normal motion, while light mode selected `day.gif`. It also selected the narrow dark profile layout on desktop.

Keep motion, viewport and theme decisions independent: the hero's motion-only source selects `still.svg`, which inherits the page's displayed color scheme; animation sources use theme-only queries. Profile sources use viewport-only queries, while their SVG palettes inherit that same displayed scheme. This preserves reduced motion and mobile layouts in both manual and system-synced GitHub themes. The inherited SVG behavior is documented by [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-color-scheme#embedded_elements).

Browser and CDN caches still affect visible loading time independently for each theme. The compact delivery assets reduce transfer bytes while retaining the original animation timing; file-size reductions are not measured guarantees of first-paint speed.

## Review and publish

Run both commands above, then inspect the branch README on GitHub in light and dark themes, on a wide desktop and a narrow screen. Confirm heading spacing, readable subtitle hierarchy, section membership, transparent section backgrounds, footer alignment, all contact links and reduced-motion source selection. Automated checks validate files and metadata; they do not judge visual layout, complete SVG transparency or whether destinations answer.

Push the feature branch with `git push --no-follow-tags origin <branch-name>`. Only changes integrated into `main` update the public profile. Follow [the required checks and merge policy](automation.md) for that integration.

The ignore rules admit the finished assets, operational docs, profile content/atlas/renderer, verification scripts, package files and automation. They exclude scratch files by default. If another operational file becomes necessary, add its exact path to `.gitignore` and review it before staging. Retired docs and source-generation scripts remain available in Git history; they describe the older artwork and should not be used to validate this release.
