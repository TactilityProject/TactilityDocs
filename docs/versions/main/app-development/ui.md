# App Development - UI

Tactility uses [LVGL](https://lvgl.io/) (version 9) for its user interface. Apps create their UI in a window from the window manager (`lvgl-window-manager-module`), and can use LVGL's widgets and Tactility's own widgets (`lvgl-module`).

## Windows

An app gets a window with `window_manager_create()` (see [Writing an app with a window](app-development/fundamentals.md?id=writing-an-app-with-a-window)):

```c
WindowId window = window_manager_create(app_instance_id, create_widgets, ctx);
// ...
window_manager_remove(window);
```

The window manager keeps a stack of windows, one per app instance. **Only the topmost window has widgets.** When another app opens on top of yours, your window's widgets are deleted. When that app closes, your `create_widgets` function is called again to rebuild them.

This has a few consequences for `create_widgets(lv_obj_t* parent, void* user_data)`:
- It can be called many times, so it must rebuild the UI from your app's current state, which you keep in your own context (passed as `user_data`), not in the widgets.
- It must only rebuild what's already decided. Decisions (e.g. what to do with a dialog's result) belong in your app's `main()` loop, where you handle `APP_EVENT_RESULT`.
- It can run on another app's task: the one whose window was removed. Don't use thread-local state, and don't call window manager functions from it, as that would deadlock.
- Anything that refers to the widgets, like an `lv_timer` or stored `lv_obj_t*` pointers, must stop or be cleared when the widgets are deleted. Use an `LV_EVENT_DELETE` callback on one of the widgets, or `window_manager_create_ext()` with a `destroy_widgets` callback.

```c
static void on_widgets_deleted(lv_event_t* event) {
    struct Context* ctx = lv_event_get_user_data(event);
    lv_timer_delete(ctx->timer);
    ctx->timer = NULL;
    ctx->label = NULL;
}

static void create_widgets(lv_obj_t* parent, void* user_data) {
    struct Context* ctx = user_data;
    ctx->label = lv_label_create(parent);
    ctx->timer = lv_timer_create(on_tick, 100, ctx);
    lv_obj_add_event_cb(ctx->label, on_widgets_deleted, LV_EVENT_DELETE, ctx);
}
```

## The LVGL lock

LVGL isn't thread-safe. `create_widgets` and LVGL event callbacks run with the LVGL lock already held. When your app's own task (e.g. its `main()` loop) changes widgets, it must hold the lock:

```c
#include <lvgl/lvgl.h>

lvgl_lock();
lv_label_set_text(ctx->label, "Connected");
lvgl_unlock();
```

Use `lvgl_try_lock(timeout)` when you'd rather skip an update than wait. Keep the lock short: the whole UI stops updating while you hold it.

Remember that the widgets might not exist at that moment (see [Windows](#windows)), so check your stored pointers inside the lock.

## Tactility widgets

`lvgl-module` adds a few widgets on top of LVGL's own. The theme styles them, so they look consistent with the rest of the system.

| Widget | Header | Use |
|---|---|---|
| Toolbar | `<lvgl/widgets/toolbar.h>` | The bar at the top of an app, with a close button, a title and actions |
| Card | `<lvgl/widgets/card.h>` | A container for a group of related settings or content |
| Chip | `<lvgl/widgets/chip.h>` | A small selectable option, e.g. a filter |
| Icon button | `<lvgl/widgets/icon_button.h>` | A button with an icon, in standard, filled or tonal style |
| Badge | `<lvgl/widgets/badge.h>` | A small dot that marks an item |
| Slider box | `<lvgl/widgets/sliderbox.h>` | A slider with - and + buttons, for devices without touch |
| Spinner | `<lvgl/widgets/spinner.h>` | A busy indicator |

### Toolbar

```c
lv_obj_t* toolbar = lvgl_toolbar_create(parent, "My App");
lvgl_toolbar_set_nav_action(toolbar, LV_SYMBOL_CLOSE, on_close_pressed, ctx);
lv_obj_t* refresh = lvgl_toolbar_add_text_button_action(toolbar, LVGL_ICON_SHARED_REFRESH, on_refresh, ctx);
lv_obj_set_style_text_font(refresh, lvgl_get_shared_icon_default_font(), LV_STATE_DEFAULT);
lv_obj_t* enabled = lvgl_toolbar_add_switch_action(toolbar);
```

Avoid dropdowns in the toolbar (`lvgl_toolbar_add_dropdown_action()`): they're deprecated, as the toolbar can't be navigated with the arrow keys when it has one.

## Layout and screen sizes

Tactility runs on displays from 135×240 to 1280×720 pixels, in portrait and landscape. Make your layout adapt to the screen instead of using fixed positions and sizes:
- Use LVGL's flex layout (`lv_obj_set_flex_flow()`, `lv_obj_set_flex_grow()`) and percentages (`LV_PCT(100)`).
- Size things relative to the font size (e.g. `lvgl_get_text_font_height(FONT_SIZE_DEFAULT)`) instead of in pixels.
- Check `lvgl_get_ui_density()`: `LVGL_UI_DENSITY_COMPACT` devices have small screens and need tighter layouts.
- On round or rounded displays, use the [Insets](app-development/insets.md) API for content near the edges.

## Fonts and icons

Tactility has three text sizes and several icon fonts, all scaled from the device's default font size (`<lvgl/fonts.h>`):

```c
lv_obj_set_style_text_font(label, lvgl_get_text_font(FONT_SIZE_LARGE), LV_STATE_DEFAULT);
```

- Text: `FONT_SIZE_SMALL`, `FONT_SIZE_DEFAULT` and `FONT_SIZE_LARGE`.
- Icons: [Material Symbols](https://fonts.google.com/icons), with defines in `<lvgl/icons/shared.h>` (e.g. `LVGL_ICON_SHARED_SETTINGS`). Use them as label text with `lvgl_get_shared_icon_default_font()` or `lvgl_get_shared_icon_large_font()`.

Only the icons that Tactility uses are included. See [Icons and Fonts](os-development/icons-and-fonts.md) for how to add one.

## Theme

The theme styles all widgets. Users can switch between light and dark mode and choose the colors in the Appearance settings, and monochrome displays use a monochrome theme.

To look right in all of them:
- Don't hardcode colors. Use the theme's styling, or take colors from the theme with `lv_theme_get_color_primary(obj)` and `lv_theme_get_color_secondary(obj)`.
- Check `lvgl_theme_is_mono()` (`<lvgl/theme.h>`) before using colors that only make sense on a color display.

## Input

Not every device has a touchscreen: some have a keyboard, a trackball, an encoder wheel or a few buttons. See [Input and Focus](app-development/input.md) to make your app work with all of them.
