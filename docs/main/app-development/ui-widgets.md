# App Development - UI Widgets

Apps build their UI from widgets: the widgets of [LVGL](https://lvgl.io/) and the widgets that Tactility adds in `lvgl-module`. The theme styles both, so they look consistent with the rest of the system. See [UI](ui.md) for windows, threading, layout and the theme.

## LVGL widgets

Tactility uses LVGL 9. Its widgets (labels, buttons, switches, sliders, text areas, dropdowns and more) are documented in the [LVGL widget documentation](https://docs.lvgl.io/master/details/widgets/index.html). Include them with:

```c
#include <lvgl.h>
```

Prefer a Tactility widget when there is one for what you need, e.g. a [Card](#card) instead of a plain `lv_obj_create()` container: a plain container has the background colour of the window, so it doesn't stand out.

## Tactility widgets

| Widget | Header | Use |
|---|---|---|
| [Toolbar](#toolbar) | `<lvgl/widgets/toolbar.h>` | The bar at the top of an app, with a close button, a title and actions |
| [Card](#card) | `<lvgl/widgets/card.h>` | A container for a group of related settings or content |
| [List](#list) | `<lvgl/widgets/list.h>` | A column of full-width buttons, with optional section headers |
| [Tabs](#tabs) | `<lvgl/widgets/tabs.h>` | A Material 3 tab bar to switch between views |
| [Chip](#chip) | `<lvgl/widgets/chip.h>` | A small selectable option (a "pill"), e.g. a filter or one choice out of a few |
| [Icon button](#icon-button) | `<lvgl/widgets/icon_button.h>` | A button with an icon, in standard, filled or tonal style. It can also be an on/off toggle |
| [Text button](#text-button) | `<lvgl/widgets/text_button.h>` | A button without a container, for low-emphasis actions such as "Skip" |
| [Slider box](#slider-box) | `<lvgl/widgets/sliderbox.h>` | A slider with - and + buttons and a value label, so it also works without touch |
| [Badge](#badge) | `<lvgl/widgets/badge.h>` | A small dot that marks an item |
| [Page indicator](#page-indicator) | `<lvgl/widgets/page_indicator.h>` | A row of dots that shows the current page of a paged view |
| [Step indicator](#step-indicator) | `<lvgl/widgets/step_indicator.h>` | A row of line segments that shows the progress through a number of steps |
| [Focus container](#focus-container) | `<lvgl/widgets/focus_container.h>` | A transparent container that is selectable as a whole |
| [Spinner](#spinner) | `<lvgl/widgets/spinner.h>` | A busy indicator |
| [QR code](#qr-code) | `<lvgl/widgets/qr.h>` | Shows text or data as a QR code |
| [Statusbar](#statusbar) | `<lvgl/widgets/statusbar.h>` | The system's statusbar. Apps can add icons to it |

### Toolbar

```c
lv_obj_t* toolbar = lvgl_toolbar_create(parent, "My App");
lvgl_toolbar_set_nav_action(toolbar, LV_SYMBOL_CLOSE, on_close_pressed, ctx);
lv_obj_t* refresh = lvgl_toolbar_add_text_button_action(toolbar, LVGL_ICON_SHARED_REFRESH, on_refresh, ctx);
lv_obj_set_style_text_font(refresh, lvgl_get_shared_icon_default_font(), LV_STATE_DEFAULT);
lv_obj_t* enabled = lvgl_toolbar_add_switch_action(toolbar);
```

- `lvgl_toolbar_set_title()` changes the title.
- `lvgl_toolbar_add_image_button_action()` adds an action with an image file, `lvgl_toolbar_add_spinner_action()` adds a busy indicator.
- `lvgl_toolbar_clear_actions()` removes all actions.

Avoid dropdowns in the toolbar (`lvgl_toolbar_add_dropdown_action()`): they're deprecated, as the toolbar can't be navigated with the arrow keys when it has one.

### Card

A card groups related content and stands out from the window's background:

```c
lv_obj_t* card = lvgl_card_create(parent);
lv_obj_set_size(card, LV_PCT(100), LV_SIZE_CONTENT);
```

A card that can be selected (e.g. a launcher tile) shows the theme's selection outline when it's focused.

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

### Tabs

A Material 3 tab bar. It only shows the tabs: your app shows the content of the selected tab.

```c
lv_obj_t* tabs = lvgl_tabs_create(parent);
lvgl_tabs_add_tab(tabs, "All");
lvgl_tabs_add_tab(tabs, "Installed");
lvgl_tabs_add_tab(tabs, "Updates");
lv_obj_add_event_cb(tabs, on_tab_changed, LV_EVENT_VALUE_CHANGED, ctx);

static void on_tab_changed(lv_event_t* event) {
    lv_obj_t* tabs = lv_event_get_current_target_obj(event);
    uint32_t index = lvgl_tabs_get_selected(tabs);
    /* ... show the content of the tab ... */
}
```

The first tab is selected. `lvgl_tabs_set_selected()` selects another one without sending `LV_EVENT_VALUE_CHANGED`. The arrow keys move between the tabs.

`lvgl_tabs_set_mode()` chooses how the tabs are sized:

| Mode | Tabs |
|---|---|
| `LVGL_TABS_MODE_FIXED` (default) | The tabs have equal widths and fill the bar, which is as wide as its parent. Labels that don't fit end in an ellipsis. |
| `LVGL_TABS_MODE_SCROLLABLE` | The tabs are as wide as their label, and the bar scrolls horizontally when they don't fit. For many tabs or long labels. |
| `LVGL_TABS_MODE_WRAP` | The bar is as wide as its tabs, and the tabs are as wide as their label. When the bar doesn't fit in its parent, the longest labels are shortened and end in an ellipsis. Useful on small displays. |

### Chip

Chips don't select themselves: give the selected one `LV_STATE_CHECKED`. Put a group of chips in a container with grid navigation, so the arrow keys move between the chips and up/down move to the next group (see [Input and Focus](input.md)):

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

Use [Tabs](#tabs) instead when the choice switches between views.

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

### Text button

A button without a container, for actions that shouldn't draw attention, such as "Skip" or "Back":

```c
lv_obj_t* skip = lvgl_text_button_create(parent);
lv_label_set_text(lv_label_create(skip), "Skip");
lv_obj_add_event_cb(skip, on_skip_pressed, LV_EVENT_SHORT_CLICKED, ctx);
```

### Slider box

```c
lv_obj_t* volume = lvgl_sliderbox_create(parent, 0, 100, 10, 50);
lvgl_sliderbox_add_value_changed_cb(volume, on_volume_changed, ctx);
int32_t value = lvgl_sliderbox_get_value(volume);
lvgl_sliderbox_set_value(volume, 70, LV_ANIM_OFF);
```

The parameters are the minimum, the maximum, the step and the initial value. Dragging snaps to the step, and the - and + buttons move one step. With a keyboard, the slider box is one stop: left and right move between the - button, the slider and the + button.

### Badge

A small dot that marks its parent, e.g. a favourite item. It ignores the parent's layout, so align it yourself:

```c
lv_obj_t* badge = lvgl_badge_create(item);
lv_obj_align(badge, LV_ALIGN_TOP_RIGHT, 0, 0);
```

### Page indicator

```c
lv_obj_t* dots = lvgl_page_indicator_create(parent);
lvgl_page_indicator_set_page_count(dots, 3);
lvgl_page_indicator_set_page(dots, 0);
```

When the dots don't fit in the indicator's maximum width (`lv_obj_set_style_max_width()`), it shows the page number as text instead (e.g. "2/5"). `lvgl_page_indicator_set_vertical()` puts the dots in a column.

### Step indicator

A row of line segments, one per step, that share the indicator's width. The finished steps have another colour:

```c
lv_obj_t* steps = lvgl_step_indicator_create(parent);
lv_obj_set_width(steps, LV_PCT(100));
lvgl_step_indicator_set_step_count(steps, 4);
lvgl_step_indicator_set_finished_count(steps, 1);
```

### Focus container

A focus container is transparent and has no padding. The theme only shows a focus ring around it, so a group of widgets can be selected and clicked as one:

```c
lv_obj_t* group = lvgl_focus_container_create(parent);
lv_obj_add_flag(group, LV_OBJ_FLAG_CLICKABLE);
lv_obj_add_event_cb(group, on_group_pressed, LV_EVENT_SHORT_CLICKED, ctx);
```

It's also useful for content that only scrolls, such as a long text: the keys can scroll it when it's focused.

### Spinner

```c
lv_obj_t* spinner = lvgl_spinner_create(parent);
```

### QR code

The view draws the code with square modules of a whole number of pixels, centered in the view, with the quiet zone that scanners need around it:

```c
lv_obj_t* qr = lvgl_qr_create(parent);
lv_obj_set_size(qr, 150, 150);
if (lvgl_qr_set_data(qr, "https://tactilityproject.org") != ERROR_NONE) {
    /* The data is too long (more than 1273 bytes) or there was no memory */
}
```

- `lvgl_qr_get_min_size()` gives the smallest size that can draw the code. The view draws nothing when it's smaller.
- `lvgl_qr_set_colors()` changes the colours. Keep a dark code on a light background, as most scanners need that.

### Statusbar

The window manager shows the statusbar (see [System bars](ui.md#system-bars)), so apps don't create one. An app or service can add its own icon to it, without holding the LVGL lock:

```c
#include <lvgl/icons/statusbar.h>

int8_t icon = lvgl_statusbar_icon_add(LVGL_ICON_STATUSBAR_CLOUD, true);
lvgl_statusbar_icon_set_visibility(icon, false);
lvgl_statusbar_icon_remove(icon);
```

Use a symbol from `<lvgl/icons/statusbar.h>` as the image. `lvgl_statusbar_icon_add_with_priority()` sets which icons stay when there is no room for all of them: the ones with the lowest priority are hidden first.
