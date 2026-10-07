# Pointer

A pointer driver connects a touch controller (or another pointing device) to Tactility. It reports the coordinates of the touched points, and the LVGL bridge in `lvgl-module` turns them into touch input for the UI.

Read the [Kernel Concepts](kernel-concepts/driver.md) first for how [drivers](kernel-concepts/driver.md), [devices](kernel-concepts/device.md) and [modules](kernel-concepts/module.md) work in general.

## The driver

A pointer driver is a `Driver` with `device_type = &POINTER_TYPE` and an `api` that points to a `PointerApi` (`tactility/drivers/pointer.h`):

| Function | Purpose |
|---|---|
| `read_data(device, timeout)` | Reads the latest touch data from the controller into the driver's own state |
| `get_touched_points(device, x, y, strength, point_count, max_point_count)` | Returns the points that `read_data()` read: up to `max_point_count` coordinates, and `true` when anything is touched |
| `set_swap_xy()`, `set_mirror_x()`, `set_mirror_y()` and their getters | The orientation of the coordinates |
| `enter_sleep()`, `exit_sleep()` | Optional low-power mode. `NULL` when the controller has none |

The LVGL bridge calls `read_data()` and then `get_touched_points()` on every input poll, on the LVGL task. Keep `read_data()` fast: a slow read makes the whole UI stutter. Multi-touch controllers can report several points: the strength array is optional and may be `NULL`.

## Coordinates and orientation

Report coordinates in the display's native orientation: `(0, 0)` is the display's top-left corner when it isn't rotated, and the maximum is the display's native resolution minus one.

Touch controllers often have a different orientation than the display they're mounted on. The devicetree describes how to correct that, with the usual properties of pointer bindings:

```dts
touch0 {
    compatible = "goodix,gt911";
    reg = <0x5D>;
    x-max = <320>;
    y-max = <240>;
    swap-xy;
    mirror-y;
};
```

The driver applies `swap-xy`, `mirror-x` and `mirror-y` to the raw coordinates. Display rotation is handled by LVGL, so the driver doesn't need to know about it.

## Calibration

Resistive touch screens (e.g. the XPT2046 on CYD boards) need a calibration: the raw values don't cover the full range, and differ per device. The LVGL bridge can apply a linear calibration per axis (`lvgl_pointer_set_calibration()`), which the Touch Calibration app measures and stores.

Enable it for a device with these [device properties](device-development/device-properties.md):
- `touch.calibrationSupported=true` adds the Touch Calibration app.
- `touch.calibrationRequired=true` also runs it during the first setup.

## Slow displays

On displays with `DISPLAY_CAPABILITY_SLOW_REFRESH` (e.g. e-paper), the LVGL bridge sets a longer long-press time, so that taps aren't mistaken for long presses during slow display updates.

## Checklist

- `device_type` is `&POINTER_TYPE`, and the API's functions match the controller's capabilities (`NULL` for no sleep mode).
- `read_data()` is fast, and returns `ERROR_TIMEOUT` or another error when the controller doesn't respond.
- Coordinates are in the display's native orientation, after applying the devicetree's `swap-xy`/`mirror-*`.
- A controller on a shared SPI bus locks the bus (see [SPI Controller](driver-development/spi-controller.md)).
