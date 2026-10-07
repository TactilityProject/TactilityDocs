# Keyboard

A keyboard driver reports key presses: from a full keyboard, a matrix of buttons, an encoder wheel or a few GPIO buttons. Tactility uses the same driver type for all of them.

Read the [Kernel Concepts](kernel-concepts/driver.md) first for how [drivers](kernel-concepts/driver.md), [devices](kernel-concepts/device.md) and [modules](kernel-concepts/module.md) work in general.

## The driver

A keyboard driver is a `Driver` with `device_type = &KEYBOARD_TYPE` and an `api` that points to a `KeyboardApi` (`tactility/drivers/keyboard.h`):

| Function | Purpose |
|---|---|
| `read_key(device, data)` | Returns the next pending key event, or a key of `0` when nothing is pending |
| `get_backlight(device, backlight)` | Optional: the keyboard's backlight device |

## Key events

Each event is a `KeyboardKeyData`:

| Field | Meaning |
|---|---|
| `key` | The key, as a **Unicode codepoint**: `'a'`, `'A'`, `' '`, etc. |
| `pressed` | `true` for a key press, `false` for its release |
| `continue_reading` | `true` when more events are queued, so `read_key()` is called again right away |
| `ctrl`, `alt` | Whether Ctrl or Alt was held. Leave them `false` when the hardware can't report them |
| `hid_keycode`, `hid_modifier` | Optional USB HID codes, for keyboards that map cleanly onto them. `0` otherwise |

Report every key as a codepoint, never as a scan code or an LVGL key. The driver applies the keyboard's layout, Shift and Caps Lock itself, so `key` is the character that the user typed.

Keys without a character use the `CodePoint` values:

| Codepoint | Key |
|---|---|
| `CODEPOINT_ENTER`, `CODEPOINT_ESCAPE`, `CODEPOINT_BACKSPACE`, `CODEPOINT_DELETE`, `CODEPOINT_TAB` | The usual control keys |
| `CODEPOINT_ARROW_UP`, `_DOWN`, `_LEFT`, `_RIGHT` | Arrow keys |
| `CODEPOINT_HOME`, `CODEPOINT_END` | Home and End |
| `CODEPOINT_FOCUS_NEXT`, `CODEPOINT_FOCUS_PREVIOUS` | Move the focus to the next or previous widget |

### Arrow keys vs. focus keys

Choose between the two kinds of navigation keys based on what the hardware can do:
- A keyboard or D-pad with **four directions** sends the arrow keys. Inside grids (like the Launcher's app grid), they move in two directions.
- A device that can only **step forward and backward**, like an encoder wheel or one to three buttons, sends `CODEPOINT_FOCUS_NEXT` and `CODEPOINT_FOCUS_PREVIOUS`. They step through every widget in order, including the items inside grids, so everything stays reachable.

Don't let a step-only device send arrow up and down: inside a grid, up and down skip the items in between, and a step-only device has no left and right to reach them.

Pressing an encoder or the select button sends `CODEPOINT_ENTER`.

## Reading vs. pushing events

There are two ways to deliver events:
- **Polled:** implement `read_key()`. The LVGL bridge calls it on every input poll, on the LVGL task. Keep it fast, and queue events in the driver (e.g. from a scan task or an interrupt) so that none are lost between polls.
- **Pushed:** for hardware that delivers events on its own task, call `keyboard_emit_key(device, data)` for every event, and leave `read_key` `NULL`. `keyboard_emit_key()` takes a mutex, so call it from a task, not from an interrupt.

Either way, other parts of the system can receive the events through `keyboard_subscribe()`.

## Hotplug

Keyboards that can be connected and disconnected (e.g. a detachable keyboard) should implement the driver's `probe` function, which reports whether the hardware is present. The kernel then starts and stops the device automatically, and the LVGL bridge adds and removes it.

The older `KeyboardApi::is_present` function is deprecated in favor of `probe`.

## Checklist

- `device_type` is `&KEYBOARD_TYPE`.
- Keys are Unicode codepoints, with the layout, Shift and Caps Lock applied.
- Four-way devices send arrow keys, step-only devices send `CODEPOINT_FOCUS_NEXT`/`PREVIOUS`.
- Every press has a matching release.
- `read_key()` is fast, and doesn't lose events between polls. Pushing drivers use `keyboard_emit_key()` from a task.
