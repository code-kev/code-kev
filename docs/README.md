# Kevin Rodrigues's GitHub profile

This repository publishes the profile README and its finished artwork. GitHub displays the root README from the default branch; pushing a release branch provides a preview until its changes reach `main`.

## Repository contents

- `README.md`: artwork, profile sections, alternative text and contact links.
- `assets/day.gif` and `assets/night.gif`: the animated hero, 1672 × 941, 600 frames and a 25-second loop.
- `assets/day.png` and `assets/night.png`: reduced-motion stills at the same canvas size.
- `assets/profile/`: transparent dotted SVG sections in day and night themes, at widths 800, 350 and 288.
- `scripts/check-profile.mjs` and its test: verification of the published files.
- `package.json` and `package-lock.json`: verification commands and the locked Sharp dependency.
- `.github/workflows/artwork.yml`: the required `artwork-check` job.

The README selects theme and motion variants with `<picture>` sources. Profile sections fill the README column; each clickable contact fills one third of the footer. Visible lettering is supplied by images, with profile copy retained in alternative text and descriptive names on links.

Start with [maintenance](maintenance.md) for changes and local verification, or [automation](automation.md) for CI and integration requirements. These docs replace the retired Inkdesk maintenance, prompt and protection documents.
