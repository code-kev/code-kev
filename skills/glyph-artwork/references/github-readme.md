# GitHub README delivery

Read this for a GitHub profile or repository README. A working custom HTML preview is not sufficient: GitHub sanitizes the markup and supplies its own layout, styles and theme components.

## Use the supported surface

Use raster hero assets and self-contained SVG images for deterministic glyphs. Keep profile SVGs free of scripts, foreign HTML, embedded images, external paint URLs and font dependencies. Restrict any palette CSS to exact color rules. A still-image wrapper may embed only the reviewed PNG data with fixed theme-selection CSS; validate that exception explicitly. Supply descriptive alternative text for image lettering and accessible names for contact links. An SVG rendered through an image is not selectable text, and links inside that SVG do not become normal README links. Use actual surrounding HTML anchors for clickable exported sections.

Use `<picture>` animation sources with theme-only media queries. GitHub's manual-theme component can replace the entire media condition, discarding combined motion or viewport clauses. Keep a motion-only still source ahead of animation sources; a self-contained SVG can embed both approved PNGs and inherit the displayed theme internally. Keep responsive profile sources viewport-only, and let their SVGs inherit theme palettes through narrowly restricted CSS. Verify manual themes as well as system sync. For large GIFs, measure a lossless animated WebP candidate and compare its full decoded timeline before adopting it; prefer explicit light and dark `type="image/webp"` sources while retaining compatible GIF fallbacks. Inspect `currentSrc` in each real theme before blaming compression or caching: an instant dark image may actually be a PNG still while the light image is an animation. Do not discard the picture markup while solving a sizing issue. Check the output through GitHub's Markdown renderer and then the real page; preserved markup is not proof that every asset loaded or painted.

## Scale against the README column

The browser viewport and README column are different widths. A repository sidebar can shrink an 800px export to 582px while fixed-size footer images keep their original dimensions. The result has inconsistent type scale and inset even if there is no page overflow.

One proven arrangement for a three-link glyph footer:

- Export each body section across the full canvas with a shared inset.
- Export three equal canvas-width contact crops, maintaining that same coordinate system and type scale.
- Give hero/body fallback images `width="100%"` and each adjacent contact fallback image `width="33.333333%"`.
- Use viewport-only media sources to choose size files; omit numeric source-width attributes that would override the fluid fallback width.
- Put the footer anchors on their own line and omit whitespace between adjacent pieces that could cause wrapping.
- Center lettering vertically within each clickable crop. Keep the page/container end gutter outside those crops; including it makes the touch area extend farther below the text than above it.

These percentages depend on equal crops. Do not apply them to compact crops with different widths. CSS flex/grid rules in the local preview cannot enforce the arrangement after GitHub removes those styles. A Markdown table is a separate layout option; its cell padding, overflow and typography still need real-page proof.

The body-image structure is a media selector plus a fluid fallback, with no `width` on the source elements:

```html
<picture>
  <source media="(max-width: 600px)" srcset="assets/profile/body-350.svg">
  <img src="assets/profile/body-800.svg" width="100%" alt="Profile summary">
</picture>
```

Here the SVGs carry inherited theme palettes, so sizing sources need no theme clauses. For a hero, put its independent reduced-motion source before theme-only animation sources.

Use transparent profile SVGs so separate exports do not become floating paper-colored rectangles against GitHub's theme. Give each content group a clear heading and separator; keep headings with their items. Test subtitle and section-heading hierarchy at display scale, rather than checking color values alone.

## Verify before publication

Inspect light/dark, motion/still, narrow/mobile, desktop and intermediate viewport widths, including a narrow README column beside the sidebar. Check loaded image URLs, displayed bounds, equal footer scale, contact destinations and complete visible sections. Scroll artwork into view before saving screenshots: a full-page capture can omit images that have not painted outside the viewport.

Check the proposed repository tree, ancestry and outgoing refs. Keep required CI job names and actual dependencies; do not remove operational automation merely because it runs during development. A clean delivery branch from the remote base can exclude local checkpoint history. `.gitignore` cannot clean old commits, and a late deletion does not undo uploading those commits. Push explicit refs with no-follow-tags when tags must remain local. Do not change protection rules or infer permission to create/merge a PR from permission to push a branch.

Authoritative background: [GitHub images and picture markup](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/quickstart-for-writing-on-github#adding-an-image-to-suit-your-visitors), [profile README requirements](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme). The layout above was checked on the published code-kev profile; other surfaces still require their own proof.
