# App Development - Insets

Some devices have a display that isn't a plain rectangle: it has rounded corners (e.g. Waveshare ESP32-S3-Touch-LCD-1.47) or it's circular (e.g. Waveshare ESP32-S3-Touch-LCD-1.28). Content near the edges of such a display is cut off. Insets are the margins that keep content inside the visible area.

## What Tactility does for you

Most apps don't need to do anything: the window manager and the standard widgets handle the display's shape.

| Display shape | Statusbar | App area | Toolbar (`lvgl_toolbar_create()`) |
|---|---|---|---|
| Rectangle | Normal layout | Full screen below the statusbar | Normal layout |
| Rounded corners | Content moved inward from the corners | Full screen below the statusbar | Content moved inward where it overlaps a corner |
| Circle | Two centered rows: the time, with the status icons below it | Padded to the square that fits inside the circle | Content moved inward where it overlaps the edge |

On rounded displays, the app area reaches the bottom corners of the screen. Rows that touch the bottom edge should move their content inward themselves (see [Edge padding](#edge-padding)).

## API

The functions are in `lvgl-module`'s `<lvgl/insets.h>`. They must be called with the LVGL lock held, e.g. from an app's `create_widgets` callback.

### Display shape

```c
void lvgl_display_get_shape(lv_display_t* display, struct DisplayShape* out_shape);
```

`DisplayShape` comes from `<tactility/drivers/display.h>`:
- `shape`: `DISPLAY_SHAPE_RECTANGLE`, `DISPLAY_SHAPE_ROUNDED` or `DISPLAY_SHAPE_CIRCLE`
- `corner_radius`: the corner radius in pixels, for `DISPLAY_SHAPE_ROUNDED`

Displays without a known shape are reported as rectangles.

### Insets

```c
void lvgl_display_get_insets(lv_display_t* display, LvglInsets* out_insets);
```

Gets the margins (`top`, `bottom`, `left`, `right`) that keep a rectangle inside the visible area. They're all zero for rectangular displays.

- Rounded corners: only `top` and `bottom` are set, so that a full-width rectangle clears the corners.
- Circle: all sides are set, so that the rectangle is the square that fits inside the circle (about 36 pixels per side on a 240×240 display).

### Row insets

```c
int32_t lvgl_display_get_row_inset(lv_display_t* display, int32_t y);
```

Gets the horizontal margin on both sides of a single row (in display coordinates). Use it for layouts that follow the edge of the display, such as list items on a circular display that get narrower towards the top and bottom.

### Edge padding

```c
void lvgl_obj_add_edge_padding(lv_obj_t* obj);
```

Moves an object's content inward where it overlaps the curved edge of the display: the extra horizontal padding is added on top of the object's own padding. It's updated when the object's size changes (e.g. after a layout change or a display rotation). On rectangular displays, it does nothing.

Set the object's own padding before calling it. The toolbar uses it, and so does the Launcher's bottom row:

```c
lv_obj_t* bottom_bar = lv_obj_create(parent);
lv_obj_set_width(bottom_bar, LV_PCT(100));
lv_obj_set_style_pad_all(bottom_bar, 0, LV_STATE_DEFAULT);
lvgl_obj_add_edge_padding(bottom_bar);
```

## Full-screen content

Apps that draw over the whole screen, like games, can keep their important content within the insets:

```c
LvglInsets insets;
lvgl_display_get_insets(lv_obj_get_display(parent), &insets);
lv_obj_set_style_pad_top(score_label_container, insets.top, LV_STATE_DEFAULT);
```
