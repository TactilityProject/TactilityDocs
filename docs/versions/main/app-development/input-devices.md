# App Development - Input Devices

Most apps get their input through LVGL (see [Input and Focus](app-development/input.md)). Apps that take over the whole screen, like games and demos, can also read the input devices directly through their drivers: a touchscreen, a keyboard or a trackball.

## Finding devices

Input devices are [devices](kernel-concepts/device.md) of a specific type (`<tactility/device.h>`):

| Type | Header | Hardware |
|---|---|---|
| `POINTER_TYPE` | `<tactility/drivers/pointer.h>` | Touchscreens |
| `KEYBOARD_TYPE` | `<tactility/drivers/keyboard.h>` | Keyboards, button matrices, encoder wheels, GPIO buttons |
| `TRACKBALL_TYPE` | `<tactility/drivers/trackball.h>` | Trackballs |

Find the first started device of a type with `device_get_first_active_by_type()`. It takes a reference, so the device can't be stopped while you use it. Release it with `device_put()` when you're done:

```c
#include <tactility/device.h>
#include <tactility/drivers/pointer.h>

struct Device* touch = NULL;
if (device_get_first_active_by_type(&POINTER_TYPE, &touch) == ERROR_NONE) {
    // ... use the touchscreen
    device_put(touch);
}
```

A device can have several input devices of the same type, e.g. a built-in keyboard and a USB keyboard. Visit all of them with `device_for_each_of_type()`, and take a reference on each one you keep with `device_get()`. Some devices can be connected and disconnected while your app runs: check `device_is_ready()` before using one.

## Sharing input with LVGL

LVGL reads the same devices all the time. A key or touch event that your app reads directly is gone for LVGL, and the other way around. When your app reads input devices itself, stop LVGL for as long as it does, and start it again before returning:

```c
#include <lvgl/module.h>
#include <tactility/module.h>

module_stop(&lvgl_module);

// ... read the input devices and draw on the display yourself

if (!module_is_started(&lvgl_module)) {
    module_start(&lvgl_module);
}
```

While LVGL is stopped, your app owns the screen: draw it yourself through the display driver (see the [Display](driver-development/display.md) driver API), as there's no window manager or statusbar.

## Touchscreen

A pointer device reports the touched points in two steps: `pointer_read_data()` reads the latest data from the controller, and `pointer_get_touched_points()` returns it:

```c
uint16_t x[2];
uint16_t y[2];
uint8_t count = 0;
pointer_read_data(touch, 0);
if (pointer_get_touched_points(touch, x, y, NULL, &count, 2)) {
    // count points are touched, at (x[i], y[i])
}
```

- The coordinates are in the display's native orientation, from `(0, 0)` to the display's resolution.
- `max_point_count` is the size of your arrays. Multi-touch controllers can report several points.
- The strength array is optional: pass `NULL` when you don't need it.

## Keyboard

`keyboard_read_key()` returns the next key event, one at a time. Drain all pending events every frame:

```c
#include <tactility/drivers/keyboard.h>

struct KeyboardKeyData data;
while (keyboard_read_key(keyboard, &data) == ERROR_NONE && data.key != 0) {
    if (data.pressed) {
        // data.key was pressed
    }
    if (!data.continue_reading) {
        break;
    }
}
```

- `key` is a Unicode codepoint: `'a'`, `'A'` or `' '` for characters, and `CODEPOINT_*` values for other keys (e.g. `CODEPOINT_ARROW_UP`, `CODEPOINT_ENTER`, `CODEPOINT_ESCAPE`).
- `pressed` is `true` for a press, and `false` for the release. Track presses and releases to know which keys are held down, e.g. for movement in a game.
- `ctrl` and `alt` report the modifier keys, when the keyboard supports them.

Encoder wheels and devices with a few buttons are keyboards too. They send `CODEPOINT_FOCUS_NEXT` and `CODEPOINT_FOCUS_PREVIOUS` for their rotation or their next/previous buttons, and `CODEPOINT_ENTER` for their select button. Map them in your app as well, so it also works on those devices.

## Trackball

A trackball reports how far it rolled since the last read, and whether its button is pressed:

```c
#include <tactility/drivers/trackball.h>

int32_t dx = 0;
int32_t dy = 0;
trackball_read_delta(trackball, &dx, &dy);

bool pressed = false;
trackball_get_button_pressed(trackball, &pressed);
```

Each read resets the movement, so read it once per frame and use the sum.

## Tips

- Poll at a steady rate, e.g. once per frame. Polling much faster wastes power, and polling slower makes the input lag.
- Not every device has every input. Check which devices exist, and offer a way to quit with each of them (e.g. Escape on a keyboard, a corner tap on a touchscreen).
- Always start LVGL again, also when your app stops because of an error.
