# Icons and Fonts

Tactility renders its fonts on the device, from TrueType (`.ttf`) files. That way, any font size works on any display, and the firmware doesn't need to contain a pre-rendered font for every size.

## Fonts

| Font | Use | Source |
|---|---|---|
| Adwaita Sans | All text | `Data/system/fonts/AdwaitaSans.ttf` |
| Adwaita Mono | The terminal | `Data/system/fonts/AdwaitaMono.ttf` |
| Material Symbols Rounded | Icons | `Data/system/fonts/MaterialSymbolsRounded.ttf` |

These files are subsets: they only contain the characters and icons that Tactility uses, to keep them small.

### Sizes

All sizes are derived from the device's default font size (`lvgl.fontSize` in `device.properties`, or the user's choice in the Appearance settings). `Tactility/Source/lvgl/FontSizes.cpp` calculates the others:

| Font | Size |
|---|---|
| `FONT_SIZE_SMALL` | 0.75 × default |
| `FONT_SIZE_DEFAULT` | default |
| `FONT_SIZE_LARGE` | 1.25 × default |
| Statusbar icons | 1.15 × default |
| Shared icons (default) | 1.25 × default |
| Shared icons (large) | 2 × the default shared icons |
| Launcher icons | 2.6 × default |

### Rendering and caching

At startup, Tactility renders each font size from its TTF file, and stores the result as a `.bin` file in the font cache (`<data path>/cache/fonts`). Later startups load the cached files, which is much faster. The cache is regenerated when a font file or a size changes.

Users can choose their own TTF fonts in the Appearance settings. Fonts with many characters (more than 1000) take long to render and use a lot of memory, as every character is rendered.

### Changing the supported characters

`Tactility/Fonts/generate.py` creates the text font subsets from the full fonts in `Tactility/Fonts/`. `TEXT_CODEPOINT_RANGES` in the script decides which characters are included (currently ASCII, Latin-1 and common punctuation).

```bash
pip install fonttools
python Tactility/Fonts/generate.py
```

It also updates `Tactility/Private/Tactility/lvgl/FontVersions.h`, so that devices regenerate their font cache.

Every added character makes the fonts larger, and makes rendering them at startup slower and more memory-hungry. Only add what's needed.

## Icons

Icons come from [Material Symbols](https://fonts.google.com/icons) (Rounded style). They're grouped into three sets, each with its own header in `Modules/lvgl-module/include/lvgl/icons/`:

| Set | Header | Use |
|---|---|---|
| Shared | `shared.h` | Apps, settings, buttons, etc. |
| Statusbar | `statusbar.h` | The statusbar |
| Launcher | `launcher.h` | The Launcher |

Each icon is a define with its UTF-8 text, e.g. `LVGL_ICON_SHARED_SETTINGS`. Show it in a label with the matching icon font:

```c
lv_obj_t* icon = lv_label_create(parent);
lv_obj_set_style_text_font(icon, lvgl_get_shared_icon_default_font(), LV_STATE_DEFAULT);
lv_label_set_text(icon, LVGL_ICON_SHARED_SETTINGS);
```

### Adding an icon

1. Find the icon's name on [Google Fonts](https://fonts.google.com/icons) (e.g. `location_off`).
2. Add the name to the matching list in `Modules/lvgl-module/generate-icons.py`: `shared_symbol_code_point_names`, `statusbar_symbol_code_point_names` or `launcher_symbol_code_point_names`.
3. Run the script from the module's folder:
   ```bash
   pip install fonttools
   cd Modules/lvgl-module
   python generate-icons.py
   ```

The script downloads the full Material Symbols font when needed, and regenerates:
- the icon headers (`include/lvgl/icons/*.h`) and name lists (`include/lvgl/icons/names.h`, `source/icon_names.c`)
- the TTF subset and its codepoints file in `Data/system/fonts/`

Commit all generated files together.

Like characters, every icon makes the icon fonts larger. Add the icons that are actually used, and reuse existing ones where they fit.
