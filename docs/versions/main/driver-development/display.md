# Display

A display driver connects a display panel to Tactility. The driver only talks to the panel: LVGL, the window manager and the apps use it through the generic display API, so a new panel works with the whole OS once its driver implements that API.

Read the [Kernel Concepts](kernel-concepts/driver.md) first for how [drivers](kernel-concepts/driver.md), [devices](kernel-concepts/device.md) and [modules](kernel-concepts/module.md) work in general.

## Fundamentals

### Project structure

Display drivers live in their own module in `Drivers/`, e.g. `Drivers/gc9a01-module/`:

| File | Purpose |
|---|---|
| `bindings/galaxycore,gc9a01.yaml` | The devicetree binding: the `compatible` string and the properties a device can set |
| `include/drivers/gc9a01.h` | The configuration struct (`Gc9a01Config`) that the devicetree compiler fills in, in the order of the binding's properties |
| `include/bindings/gc9a01.h` | `DEFINE_DEVICETREE(gc9a01, struct Gc9a01Config)`, which `.dts` files include |
| `source/gc9a01.cpp` | The driver: the `DisplayApi` implementation and the `Driver` definition |
| `source/module.cpp` | The kernel module that registers the driver |
| `module.yaml` | The module's dependencies and bindings folder |

A device then declares the display in its `.dts` file:

```dts
display@0 {
    compatible = "galaxycore,gc9a01";
    horizontal-resolution = <240>;
    vertical-resolution = <240>;
    pin-dc = <&gpio0 8 GPIO_FLAG_NONE>;
    backlight = <&display_backlight>;
};
```

### The driver

A display driver is a `Driver` with `device_type = &DISPLAY_TYPE` and an `api` that points to a `DisplayApi` (`tactility/drivers/display.h`):

```c
static const DisplayApi gc9a01_display_api = {
    .capabilities = DISPLAY_CAPABILITY_CAP_MIRROR | DISPLAY_CAPABILITY_CAP_SWAP_XY | DISPLAY_CAPABILITY_BACKLIGHT,
    .reset = gc9a01_reset,
    .init = gc9a01_init,
    .draw_bitmap = gc9a01_draw_bitmap,
    .mirror = gc9a01_mirror,
    .swap_xy = gc9a01_swap_xy,
    // ...
    .get_color_format = gc9a01_get_color_format,
    .get_resolution_x = gc9a01_get_resolution_x,
    .get_resolution_y = gc9a01_get_resolution_y,
    .get_backlight = gc9a01_get_backlight,
};

Driver gc9a01_driver = {
    .name = "gc9a01",
    .compatible = (const char*[]) { "galaxycore,gc9a01", nullptr },
    .start_device = start,
    .stop_device = stop,
    .api = &gc9a01_display_api,
    .device_type = &DISPLAY_TYPE,
};
```

Use designated initializers for the `DisplayApi`, so that the functions a panel doesn't support stay `NULL`.

### Required functions

| Function | Purpose |
|---|---|
| `reset()`, `init()` | Hardware reset and the panel's initialization sequence |
| `draw_bitmap()` | Draws pixels into a rectangle |
| `get_color_format()` | The pixel format that `draw_bitmap()` receives |
| `get_resolution_x()`, `get_resolution_y()` | The panel's native resolution, without rotation |

`draw_bitmap()` is the core of the driver:
- The rectangle's start coordinates are inclusive and its end coordinates are exclusive.
- `color_data` is in the panel's color format (see below).
- It must be synchronous: when it returns, the transfer must be complete, because the caller reuses the buffer right away. For DMA transfers, wait for the transfer's completion (e.g. with a semaphore given from the "transfer done" interrupt).
- It's called on LVGL's task. Apps that stop LVGL can also call it directly, e.g. the full-screen terminal.

### Color formats

| Format | Pixels | Use |
|---|---|---|
| `DISPLAY_COLOR_FORMAT_RGB565` (+ `_SWAPPED`, `BGR565`, `BGR565_SWAPPED`) | 16 bpp | Most color panels. The swapped variants make LVGL swap the bytes for SPI panels |
| `DISPLAY_COLOR_FORMAT_RGB888` | 24 bpp | Panels with 24-bit color |
| `DISPLAY_COLOR_FORMAT_MONOCHROME` | 1 bpp | Black and white panels (see [Monochrome panels](#monochrome-1-bpp-panels)) |
| `DISPLAY_COLOR_FORMAT_GRAYSCALE8` | 8 bpp luminance, `0x00` is black | Grayscale panels, and black and white panels that want partial updates |

Monochrome and grayscale displays automatically get the monochrome theme.

### Capabilities

`capabilities` declares the optional features. The functions that belong to a capability must be `NULL` when it's not set.

| Capability | Functions | Effect |
|---|---|---|
| `CAP_MIRROR`, `CAP_SWAP_XY` | `mirror()`, `swap_xy()`, `get_mirror_x/y()`, `get_swap_xy()` | Display rotation in hardware. Without both, LVGL rotates in software, which costs an extra buffer and CPU time |
| `CAP_SET_GAP` | `set_gap()`, `get_gap_x/y()` | Offsets for panels whose visible area doesn't start at the controller's first pixel. Swapped by the LVGL bridge on rotation |
| `INVERT_COLOR` | `invert_color()` | |
| `ON_OFF`, `SLEEP` | `disp_on_off()`, `disp_sleep()` | Turning the panel off and putting it to sleep |
| `BACKLIGHT` | `get_backlight()` | Returns the backlight device from the devicetree, without taking a reference |
| `REQUIRES_FULL_FRAME` | | LVGL always renders and sends the whole screen |
| `SLOW_REFRESH` | | E-paper and other slow panels (see [E-paper](#e-paper-and-other-slow-panels)) |
| `PREFER_EXTERNAL_RAM` | | A promise that `draw_bitmap()` never DMAs from `color_data`, so the draw buffers can be in PSRAM instead of scarce internal RAM |

When capabilities depend on the device's configuration, implement `has_capability()`: it's then called instead of checking `capabilities`.

### How LVGL uses the driver

The LVGL bridge in `lvgl-module` (`source/devices/devices.cpp`, `source/devices/display.cpp`) binds every started display:
- **Buffers:** by default, a single draw buffer of 1/10th of the screen height, rendered in parts. Monochrome displays and displays with `REQUIRES_FULL_FRAME` get one full-screen buffer.
- **Frame buffers:** panels that expose their own frame buffers (`get_frame_buffer()`, `get_frame_buffer_count()`) are rendered into directly, when rotation is done in hardware.
- **Rotation:** with `CAP_SWAP_XY` and `CAP_MIRROR`, a rotation becomes `swap_xy()` and `mirror()` calls relative to the devicetree's base orientation. Otherwise the pixels are rotated in software.

### Shared SPI buses

A panel on a shared SPI bus (its parent is an `SPI_CONTROLLER_TYPE` device) must lock the bus around each logical operation, e.g. a whole `draw_bitmap()`, with `spi_controller_lock()` and `spi_controller_unlock()`, or `spi_controller_lock_bus_of()` and `spi_controller_unlock_bus_of()` for a direct child of the controller. The generic display API doesn't do it for you, because only the driver knows which calls use the bus. SD cards often share the bus with the display. See [SPI Controller](driver-development/spi-controller.md).

## Monochrome (1 bpp) panels

Return `DISPLAY_COLOR_FORMAT_MONOCHROME` for panels that store 1 bit per pixel, like the SSD1306 OLED or black and white e-paper:
- `color_data` is row-major, with the most significant bit first: one byte holds 8 horizontal pixels. LVGL's palette header is already stripped off.
- A set bit is white and a cleared bit is black.
- LVGL renders the full frame, so `draw_bitmap()` is always called with the whole screen.
- Converting to the panel's own memory layout is the driver's job. For example, the SSD1306 stores vertical 8-pixel columns ("pages"), so `ssd1306_draw_bitmap()` transposes the rows.

If the panel can update parts of the screen, consider `DISPLAY_COLOR_FORMAT_GRAYSCALE8` instead: LVGL then renders in parts, and the driver converts each pixel to black or white itself.

## E-paper and other slow panels

E-paper panels take hundreds of milliseconds or more per update and keep a faint image of earlier content ("ghosting"). Set `DISPLAY_CAPABILITY_SLOW_REFRESH` so that Tactility adapts to them:
- Animations are turned off in the theme.
- Touch long presses take 2 seconds instead of the default, as taps would otherwise turn into long presses during the slow updates.
- `clear()` is called when the display is bound to LVGL: at startup, and after an app that stopped LVGL (and may have drawn directly) closes.
- After 5 seconds without activity, the whole screen is redrawn once and `refresh()` is called.

Implement the two maintenance functions:
- `clear()` wipes the panel's image completely, regardless of what was drawn.
- `refresh()` redraws the current content in the panel's highest quality mode (like a GC16 waveform), to remove the ghosting that fast partial updates leave behind.

A common approach in `draw_bitmap()` is to use the fast update mode for small areas, and a full-quality update when (almost) the whole screen changes.

Examples: `Drivers/gdeq031t10-module` (1 bpp, full frame), `Drivers/esp-epaper-module` and `Drivers/lilygo-t5s3-epd-module`.

## Display shape (insets)

Displays with rounded corners or a circular visible area report their shape, so that the statusbar, the toolbar and the apps keep their content inside it (see [Insets](app-development/insets.md) for how apps use it).

To support it in a driver:
1. Include the shared `display.yaml` binding, which adds the optional `shape` and `corner-radius` properties:
   ```yaml
   include: ["display.yaml"]

   compatible: "galaxycore,gc9a01"
   ```
2. Start the configuration struct with the fields for those properties. Included properties come first:
   ```c
   struct Gc9a01Config {
       // From display.yaml: a DisplayShapeType value and the corner radius for rounded displays
       uint8_t shape;
       uint16_t corner_radius;
       uint16_t horizontal_resolution;
       // ...
   };
   ```
3. Implement `get_shape()`:
   ```c
   static void gc9a01_get_shape(Device* device, DisplayShape* shape) {
       const auto* config = GET_CONFIG(device);
       *shape = { .shape = config->shape, .corner_radius = config->corner_radius };
   }
   ```

Devices then set the shape on the display node:

```dts
display@0 {
    compatible = "galaxycore,gc9a01";
    shape = <DISPLAY_SHAPE_CIRCLE>;
    // ...
};
```

```dts
display@0 {
    compatible = "jadard,jd9853";
    shape = <DISPLAY_SHAPE_ROUNDED>;
    corner-radius = <40>;
    // ...
};
```

Without `get_shape()`, or without a `shape` property, the display is a rectangle.

## Checklist

- The `DisplayApi` uses designated initializers, with `NULL` for every unsupported function.
- `capabilities` matches the functions that are implemented.
- `draw_bitmap()` returns only after the transfer is complete.
- Bus access on a shared SPI bus is locked.
- The base orientation (`swap-xy`, `mirror-x`, `mirror-y`) and gaps come from the devicetree, so that rotation works from the right starting point.
- Slow panels set `SLOW_REFRESH` and implement `clear()` and `refresh()`.
- Panels with rounded corners or a circular shape include `display.yaml` and implement `get_shape()`.
