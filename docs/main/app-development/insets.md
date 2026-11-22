# App Development - Insets

Some devices have a display that isn't a plain rectangle: it has rounded corners (e.g. Waveshare ESP32-S3-Touch-LCD-1.47) or it's circular (e.g. Waveshare ESP32-S3-Touch-LCD-1.28). Content near the edges of such a display is cut off. Insets are the margins that keep content inside the visible area.

## What Tactility does for you

The window manager arranges the system bars around the display's shape. On rounded displays the bars are made thick enough to cover the corners, and on circular displays the app area is padded to the square that fits inside the circle. Apps that only use the app area, and the toolbar, don't need to do anything. See [System bars](ui.md#system-bars).

Use the API below when your content isn't in the app area, like full screen apps and apps without LVGL.

## LVGL API

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

## Apps without LVGL

Apps that draw to the display directly can read the shape from the display device (`<tactility/drivers/display.h>`) and keep their content inside it. This doesn't need the LVGL lock:

```c
static bool find_display(struct Device* device, void* context) {
    *(struct Device**)context = device;
    return false;
}

struct Device* display = NULL;
device_for_each_of_type(&DISPLAY_TYPE, &display, find_display);

struct DisplayShape shape;
display_get_shape(display, &shape);
```

`shape.shape` and `shape.corner_radius` are the same as in the [LVGL API](#display-shape). The resolution comes from `display_get_resolution_x()` and `display_get_resolution_y()`. For a rounded display, a margin of `ceil(corner_radius * (1 - 1/sqrt(2)))` on the top and the bottom keeps a full-width rectangle inside the curve.
