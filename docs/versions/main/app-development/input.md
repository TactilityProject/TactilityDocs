# App Development - Input and Focus

Tactility devices have very different inputs: a touchscreen, a keyboard (with or without arrow keys), a trackball, an encoder wheel, or just a few buttons. Many have several. An app that only works with touch can't be used on half of the devices, so design for all of them.

## How input reaches your app

LVGL turns the input devices into two kinds of input:
- **Pointer:** touchscreens, and trackballs in pointer mode. They press whatever is under the finger or cursor.
- **Keys:** keyboards, encoders, buttons, and trackballs in the default mode. They act on the **focused** widget, and move the focus between widgets.

Interactive LVGL widgets (buttons, sliders, switches, text areas, etc.) join the default focus group when they're created. The keys move through them in the order they were created:
- **Up/down** (or an encoder's rotation): the previous/next widget.
- **Left/right:** changes the focused widget's value, e.g. a slider.
- **Enter** (or pressing the encoder or trackball): presses the focused widget.

So a UI made of standard widgets already works with keys. To make it work well:
- Create widgets in the order you want the focus to move through them.
- Don't rely on long presses or gestures as the only way to do something.
- Prefer widgets that can be operated with keys. For example, use a slider box (`lvgl_sliderbox_create()`) instead of a bare slider on devices without touch, as it has - and + buttons.

## Without a touchscreen

Check whether there's a pointer device:

```c
#include <lvgl/devices/indev.h>

if (!lvgl_indev_exists(LV_INDEV_TYPE_POINTER)) {
    // Focus the most useful widget, so the user doesn't have to step to it first
    lv_group_focus_obj(start_button);
}
```

The toolbar already focuses its close button on devices without touch.

## Grids and rows

By default, up and down move to the previous and next widget, which is slow in a grid of items. Grid navigation lets the arrow keys move in two directions inside a container:

```c
#include <lvgl/grid_navigation.h>

lv_obj_t* grid = lv_obj_create(parent);
lv_obj_set_flex_flow(grid, LV_FLEX_FLOW_ROW_WRAP);
lvgl_grid_navigation_add(grid);
// Children created now or later are navigated with the arrow keys
```

- The container takes the place of its children in the focus group. The arrow keys move between the children by their position, and leave the container at its edges.
- Devices that can only step forward and backward (encoders, buttons) step through the children in order.
- `lvgl_grid_navigation_get_focused(grid)` returns the focused child.

The app grid in the Launcher, the toolbar and the statusbar use it.

## Text input

Text areas (`lv_textarea_create()`) automatically get the on-screen keyboard when the device has no hardware keyboard: it appears when the text area is focused. With a hardware keyboard, the user types directly into the focused text area.

## Reading keys directly

Most apps only need LVGL's events (`LV_EVENT_CLICKED`, `LV_EVENT_VALUE_CHANGED`, etc.). Apps that need raw key presses, like games, can handle `LV_EVENT_KEY` on a focused widget and read the key with `lv_event_get_key()`. Arrow keys arrive as `LV_KEY_UP`, `LV_KEY_DOWN`, `LV_KEY_LEFT` and `LV_KEY_RIGHT`, but up and down are only passed on as such inside a grid navigation container. Elsewhere, they move the focus.

## Reading input devices directly

Full-screen apps like games can also read the touchscreen, keyboards and trackballs through their drivers, without LVGL. See [Input Devices](app-development/input-devices.md).

## Testing

The simulator has a mouse (as a touchscreen) and your computer's keyboard. To test without touch, navigate your app with only the arrow keys and Enter, and check that every action can be reached.
