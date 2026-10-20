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

## No file operations on the LVGL thread

Code that runs on the LVGL thread must not do file operations: `create_widgets`, LVGL event callbacks, timers, and anything that runs while you hold the LVGL lock. That includes reading or writing settings, and calls that do it for you.

- A file read can block for a long time, especially on an SD card, and the whole UI freezes meanwhile.
- `create_widgets` can run on another app's thread, when that app's window closes. Those threads can have small stacks, or stacks in external RAM that can't access flash.

Do the file work in your app's own task, keep the result in your context, and make the widgets only show what's there. In a callback, signal your task with an event group bit and let it do the work. The same goes for other calls that wait on a service.

## Tactility widgets

`lvgl-module` adds a few widgets on top of LVGL's own. The theme styles them, so they look consistent with the rest of the system.

| Widget | Header | Use |
|---|---|---|
| Toolbar | `<lvgl/widgets/toolbar.h>` | The bar at the top of an app, with a close button, a title and actions |
| Card | `<lvgl/widgets/card.h>` | A container for a group of related settings or content |
| List | `<lvgl/widgets/list.h>` | A column of full-width buttons, with optional section headers |
| Chip | `<lvgl/widgets/chip.h>` | A small selectable option (a "pill"), e.g. a filter or one choice out of a few |
| Icon button | `<lvgl/widgets/icon_button.h>` | A button with an icon, in standard, filled or tonal style. It can also be an on/off toggle |
| Badge | `<lvgl/widgets/badge.h>` | A small dot that marks an item |
| Slider box | `<lvgl/widgets/sliderbox.h>` | A slider with - and + buttons and a value label, so it also works without touch |
| Page indicator | `<lvgl/widgets/page_indicator.h>` | A row of dots that shows the current page of a paged view |
| Focus container | `<lvgl/widgets/focus_container.h>` | A transparent container that is selectable as a whole, e.g. a group of icons with one click action |
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

### List

```c
lv_obj_t* list = lvgl_list_create(parent);
lvgl_list_add_text(list, "Networks");
lv_obj_t* button = lvgl_list_add_button(list, LV_SYMBOL_WIFI, "Home");
lv_obj_add_event_cb(button, on_network_pressed, LV_EVENT_SHORT_CLICKED, ctx);
```

Every item has a divider below it. When the list is in a card, the divider of the last item lies on the card's border. Call `lvgl_list_hide_last_divider()` after you added the last item:

```c
lv_obj_t* card = lvgl_card_create(parent);
lv_obj_t* list = lvgl_list_create(card);
/* ... add the items ... */
lvgl_list_hide_last_divider(list);
```

It also works on a card that has the items as its direct children, without a separate list object.

### Chips

Chips don't select themselves: give the selected one `LV_STATE_CHECKED`. Put a group of chips in a container with grid navigation, so the arrow keys move between the chips and up/down move to the next group (see [Input and Focus](app-development/input.md)):

```c
lv_obj_t* chips = lv_obj_create(parent);
lv_obj_set_size(chips, LV_SIZE_CONTENT, LV_SIZE_CONTENT);
lv_obj_set_flex_flow(chips, LV_FLEX_FLOW_ROW);
for (int i = 0; i < OPTION_COUNT; i++) {
    lv_obj_t* chip = lvgl_chip_create(chips);
    lv_label_set_text(lv_label_create(chip), OPTION_NAMES[i]);
    lv_obj_add_event_cb(chip, on_option_pressed, LV_EVENT_SHORT_CLICKED, ctx);
}
lvgl_grid_navigation_add(chips);
// When an option is selected:
lv_obj_set_state(selected_chip, LV_STATE_CHECKED, true);
```

### Icon button

`lvgl_icon_button_create()` makes a standard icon button. `lvgl_icon_button_create_variant()` also offers `LVGL_ICON_BUTTON_FILLED` (for the most important action) and `LVGL_ICON_BUTTON_TONAL`.

A standard icon button can be an on/off toggle: the theme shows it as "on" while it's checked.

```c
lv_obj_t* toggle = lvgl_icon_button_create(parent);
lv_obj_add_flag(toggle, LV_OBJ_FLAG_CHECKABLE);
lv_obj_add_event_cb(toggle, on_toggled, LV_EVENT_VALUE_CHANGED, ctx);
lv_label_set_text(lv_label_create(toggle), LVGL_ICON_SHARED_WIFI);
```

LVGL switches checkable widgets with the arrow keys, so put toggles (and switches) in a grid navigation container instead of letting them be focused directly.

### Slider box

```c
lv_obj_t* volume = lvgl_sliderbox_create(parent, 0, 100, 10, 50);
lvgl_sliderbox_add_value_changed_cb(volume, on_volume_changed, ctx);
int32_t value = lvgl_sliderbox_get_value(volume);
```

With a keyboard, the slider box is one stop: left and right move between the - button, the slider and the + button.

### Page indicator

```c
lv_obj_t* dots = lvgl_page_indicator_create(parent);
lvgl_page_indicator_set_page_count(dots, 3);
lvgl_page_indicator_set_page(dots, 0);
```

When the dots don't fit in the indicator's maximum width (`lv_obj_set_style_max_width()`), it shows the page number as text instead (e.g. "2/5").

### Focus container

A focus container is transparent and has no padding. The theme only shows a focus ring around it, so a group of widgets can be selected and clicked as one:

```c
lv_obj_t* group = lvgl_focus_container_create(parent);
lv_obj_add_flag(group, LV_OBJ_FLAG_CLICKABLE);
lv_obj_add_event_cb(group, on_group_pressed, LV_EVENT_SHORT_CLICKED, ctx);
```

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
