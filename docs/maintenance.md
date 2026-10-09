# Maintain the published profile

## Install and verify

Use Node.js 24 and npm. From the repository root:

```sh
npm ci --no-audit --no-fund
npm test
npm run check
```

Verification only reads the published assets. It checks all referenced files, their formats, hero dimensions, the 600-frame animation's 40/50 ms delays, its 25-second duration and infinite loop, still PNGs, all six size/theme variants per SVG section, and the absence of unused assets. SVG widths must match their variant suffix; contact crops use one third of that width. The SVG guard rejects scripts, embedded images, external references and paint URLs. Tests exercise the real verifier against valid assets and broken paths, missing variants, unsafe SVGs, incorrect export sizes and incorrect animation frames.

No FFmpeg installation, artwork rendering or hosting service is needed to run these checks or display the README.

## Change profile text or contacts

Keep visible SVG wording and the corresponding README alternative text together. A profile section has six exports: `288`, `350` and `800`, each in `day` and `night`. Contact destinations live in the README anchors; keep their descriptive names in sync with the URLs. Preserve the private project's plain section without adding a repository link.

The scene and dotted SVG generation tools live in the separate local artwork development workspace. Generate and review changes there, then copy the approved SVG exports and matching README markup into this repository. This release includes the finished assets and their verifier; it has no asset-generation command. Planning notes, experiments, layout captures, screenshots and checkpoint history stay in that local workspace.

## Change hero artwork

Replace both theme GIFs and their reduced-motion PNGs together after reviewing the animation in the artwork workspace. The current approved format is 1672 × 941, 600 frames, 40/50 ms frame delays, a 25-second total duration and infinite looping. An intentional format change must update the verifier and its tests in the same change.

## Review and publish

Run both commands above, then inspect the branch README on GitHub in light and dark themes, on a wide desktop and a narrow screen. Confirm heading spacing, readable subtitle hierarchy, section membership, transparent section backgrounds, footer alignment, all contact links and reduced-motion source selection. Automated checks validate files and metadata; they do not judge visual layout, complete SVG transparency or whether destinations answer.

Push the feature branch with `git push --no-follow-tags origin <branch-name>`. Only changes integrated into `main` update the public profile. Follow [the required checks and merge policy](automation.md) for that integration.

The ignore rules admit the finished assets, these three operational docs, verifier, test, package files and the workflow. They exclude scratch files by default. If another operational file becomes necessary, add its exact path to `.gitignore` and review it before staging. Retired docs and source-generation scripts remain available in Git history; they describe the older artwork and should not be used to validate this release.
