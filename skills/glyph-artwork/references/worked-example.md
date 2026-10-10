# A complete dot-grid example

Copy the complete skill folder. With Node.js 20.9 or newer, run from its root:

```sh
node scripts/dot-city.mjs city.svg "AI CITY"
```

The standard-library script produces a transparent, black-dot window/city scene and a 5×7 caption. It writes explicit SVG circles; there is no external font, raster texture, random seed, package install or reference to Kevin's hero. Open the SVG in a browser on a light background.

The scene samples physical coordinates on a 160×54 grid of 6×10 cells: `160*6 / (16/9*10) = 54` rows, yielding 960×540 pixels. Glyph density varies dot radius while the circle centers remain registered. The caption uses square 4px cells with a 0.36-cell radius, independently of the scene sampling grid.

`assets/glyphs.json` bundles the recovered profile bitmap alphabet, including space. It is deliberately incomplete: Q, Z and digits 3–9 are not present. Inspect the atlas before changing copy; an unsupported character fails before the output file is replaced:

```sh
node scripts/dot-city.mjs city.svg "Ω"
```

Two successful runs with the same caption produce identical bytes. The repository test exercises dimensions, all circle bounds, transparent backgrounds, deterministic output and preservation of the prior output after a failed caption. The bundled example runs independently when only this skill folder is copied.

To adapt it, change the physical building/window shapes and tone sampler first, then choose a grid suited to the delivery width. This example proves static registered geometry; it supplies no moving layers, theme delivery or animation-preservation evidence. Use the constitution and the relevant delivery reference for those tasks. The skill is MIT-licensed; the repository's LICENSE, NOTICE.md and artwork documentation record the code/skill grant and the personal artwork that stays excluded.
