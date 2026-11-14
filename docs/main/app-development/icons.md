# App Development - Icons

This page is about drawing a good launcher icon. For how the launcher finds and loads the files, see [Icons](fundamentals.md#icons) in Fundamentals.

A package with a UI can have two SVG files next to `manifest.properties`:

| File | Used for | Look |
|---|---|---|
| `icon.svg` | Colour themes | Full colour, with a background |
| `icon_mono.svg` | The monochrome theme | One colour on a transparent background |

Implement both. Apps without a UI (headless apps, `app.<index>.headless=true`) don't show up in the launcher, so they don't need icons.

## SVG format

Icons are rasterized by the launcher with a small SVG renderer. Stick to the basics.

Size:
- Both icons: `width="96" height="96" viewBox="0 0 96 96"`.
- The icon is scaled to fit a square, with the aspect ratio kept, so draw on a square canvas.
- Keep the file small so they can be read and cached efficiently when the device is started.

Supported:
- Paths, basic shapes (`rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`), strokes and transforms
- Fills, including gradients (`linearGradient`, `radialGradient`)
- `fill-rule="evenodd"`

Not supported:
- `<text>`: convert text to paths in your drawing tool
- `<pattern>` fills: draw the repeated shapes as a path instead (e.g. a checkerboard of small squares for a gray tone)
- Filters and masks

## Colour icon

- Start with a full-size background rectangle, then put the glyph on top.
- Use one flat background colour. Keep gradients for small accents.
- Pick a glyph that says what the app does (a clock for a clock, a controller for a game), not what it's called. Leave out words like "Demo" or "Bridge".
- Use a brand colour when the app is about a brand or product.
- Keep the contrast high, both between glyph and background and between the parts of the glyph.
- Draw letters and digits as paths (see [SVG format](#svg-format)). Avoid letters and digits whenever possible.

## Monochrome icon

The launcher paints this icon in the theme's icon colour. Only the shape and its transparency matter, so any colour you draw in is replaced.

- Draw in black on a transparent background.
- Don't add a border, frame or background tile. A frame wastes space and a filled background turns into one solid block.
- Let the glyph fill about 80 of the 96 units, centered. The [Material Symbols](https://fonts.google.com/icons) fill 75-85% of their canvas, so your icon sits well next to theirs.
- For stroked shapes, use a stroke width of 3-4 units before scaling and round caps and joins. On a small icon, 4 units is only about 1 pixel. Nothing should be thinner than that.
- Avoid details smaller than about 4 units. They disappear when scaled down.
- Text is rarely readable at this size. Only use letters or digits when the glyph is large, and draw them as bold paths. Avoid letters and digits whenever possible.
- For a gray tone, draw a checkerboard of small squares as a path (see [SVG format](#svg-format)).
- To show "inverted" or "off" parts, cut a hole in a filled shape (a path with `fill-rule="evenodd"`) instead of filling it white. 

## Examples

The same clock icon, drawn well and badly. The icons sit on a light card so the black mono icons are visible.

### Contrast

<div class="icon-compare">
<figure><img src="/images/icons/snake.svg" alt="Snake icon with a bright green snake on a dark green background"><figcaption>✅</figcaption></figure>
<figure><img src="/images/icons/snake_low_contrast.svg" alt="Snake icon with a muted green snake on a dark green background"><figcaption>❌</figcaption></figure>
</div>

The left snake is a bright green on a dark green background, so its shape stands out clearly. On the right, the snake is a muted green that is close in tone to the background. The shape is still there, but it is much harder to see, especially on small or dim screens.

### Glyph size

<div class="icon-compare">
<figure><img src="/images/icons/password.svg" alt="Password field icon that fills the canvas"><figcaption>✅</figcaption></figure>
<figure><img src="/images/icons/password_small.svg" alt="Small password field icon surrounded by empty background"><figcaption>❌</figcaption></figure>
</div>

The left glyph fills most of the canvas, so it stays readable. The right one is half the size and surrounded by empty background. The asterisks become tiny and are hard to make out when the icon is scaled down. Make the glyph as large as the canvas allows.

### Mono: no border

<div class="icon-compare">
<figure><img src="/images/icons/clock_mono.svg" alt="Mono clock icon without a border"><figcaption>✅</figcaption></figure>
<figure><img src="/images/icons/clock_mono_border.svg" alt="Mono clock icon inside a rounded border"><figcaption>❌</figcaption></figure>
</div>

The left mono icon is just the glyph, scaled up to fill the canvas. The right one has a frame, which uses up space and makes the clock smaller and harder to read.

### Mono: stroke width

<div class="icon-compare">
<figure><img src="/images/icons/clock_mono.svg" alt="Mono clock icon with thick strokes"><figcaption>✅</figcaption></figure>
<figure><img src="/images/icons/clock_mono_thin.svg" alt="Mono clock icon with hairline strokes"><figcaption>❌</figcaption></figure>
</div>

The left strokes are 3-4 units wide, so they stay visible when the icon is small. The right strokes are hairlines: they blur to almost nothing at small sizes.

### Mono: no background

<div class="icon-compare">
<figure><img src="/images/icons/clock_mono.svg" alt="Mono clock icon on a transparent background"><figcaption>✅</figcaption></figure>
<figure><img src="/images/icons/clock_mono_tile.svg" alt="Mono clock icon on a solid black tile"><figcaption>❌</figcaption></figure>
</div>

The launcher paints the mono icon in the theme's icon colour and keeps its transparency. The left icon is only a shape, so it takes on the theme colour. The right icon has a background tile, which turns into a solid block that hides the glyph.

## Checking your icon

Render both files at full size and at a small size (e.g. 24 pixels) before you ship them. With ImageMagick:

```bash
# Full size
magick -background white -density 768 icon_mono.svg -resize 96x96 mono.png
# Small size, scaled back up so you can see the pixels
magick -background white -density 96 icon_mono.svg -resize 24x24 -filter point -resize 192x192 mono_24.png
```

Check that:
- The glyph isn't cut off and is centered.
- The shapes are still distinct at a small size.
- The colour icon looks fine on both light and dark launcher backgrounds.

Then see the result on the device or the simulator: the launcher picks it up as soon as the package is installed.
