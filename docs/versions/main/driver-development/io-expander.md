# IO Expander

An IO expander is a chip that adds GPIO pins to a device, usually over I2C. Boards use them for reset lines, power enables, backlight switches, buttons and more.

In Tactility, an IO expander driver is a **GPIO controller**, just like the ESP32's own GPIO. Other drivers use its pins through the same GPIO API, so they don't need to know whether a pin is on the ESP32 or on an expander.

Read the [Kernel Concepts](kernel-concepts/driver.md) first for how [drivers](kernel-concepts/driver.md), [devices](kernel-concepts/device.md) and [modules](kernel-concepts/module.md) work in general.

## Fundamentals

### Project structure

IO expander drivers live in their own module in `Drivers/`, e.g. `Drivers/pi4ioe5v6408-module/`:

| File | Purpose |
|---|---|
| `bindings/diodes,pi4ioe5v6408.yaml` | The devicetree binding. Include `i2c-device.yaml` for an I2C expander, which adds the `reg` (address) property |
| `include/drivers/pi4ioe5v6408.h` | The configuration struct (e.g. the I2C address) |
| `include/bindings/pi4ioe5v6408.h` | `DEFINE_DEVICETREE(pi4ioe5v6408, struct Pi4ioe5v6408Config)`, which `.dts` files include |
| `source/pi4ioe5v6408.cpp` | The driver: the `GpioControllerApi` implementation and the `Driver` definition |
| `source/module.cpp` | The kernel module that registers the driver |

The expander is a child of its bus in the device's `.dts` file, and other nodes refer to its pins:

```dts
i2c0 {
    compatible = "espressif,esp32-i2c-master";
    // ...

    io_expander0 {
        compatible = "diodes,pi4ioe5v6408";
        reg = <0x43>;
    };

    camera {
        // ...
        pin-reset = <&io_expander0 6 GPIO_FLAG_ACTIVE_LOW>;
    };
};
```

A pin reference has three parts: the controller, the pin number, and the pin's flags.

### The driver

An IO expander driver is a `Driver` with `device_type = &GPIO_CONTROLLER_TYPE` and an `api` that points to a `GpioControllerApi` (`tactility/drivers/gpio_controller.h`):

```c
const static GpioControllerApi pi4_gpio_api = {
    .set_level = set_level,
    .get_level = get_level,
    .set_flags = set_flags,
    .get_flags = get_flags,
    .get_native_pin_number = get_native_pin_number,
    .add_callback = add_callback,
    .remove_callback = remove_callback,
    .enable_interrupt = enable_interrupt,
    .disable_interrupt = disable_interrupt
};

Driver pi4ioe5v6408_driver = {
    .name = "pi4ioe5v6408",
    .compatible = (const char*[]) { "diodes,pi4ioe5v6408", nullptr },
    .start_device = start,
    .stop_device = stop,
    .api = &pi4_gpio_api,
    .device_type = &GPIO_CONTROLLER_TYPE,
    .owner = &pi4ioe5v6408_module,
};
```

In `start_device`, check the parent bus and create the pin descriptors with `gpio_controller_init_descriptors()`. Release them in `stop_device`:

```c
static error_t start(Device* device) {
    if (device_get_type(device_get_parent(device)) != &I2C_CONTROLLER_TYPE) {
        return ERROR_RESOURCE;
    }
    return gpio_controller_init_descriptors(device, 8, nullptr);
}

static error_t stop(Device* device) {
    return gpio_controller_deinit_descriptors(device);
}
```

The GPIO controller base code owns the device's driver data. To keep your own state, pass it as the `controller_context` of `gpio_controller_init_descriptors()` and get it back with `gpio_controller_get_controller_context()`.

### Pin descriptors

Users of a pin acquire a `GpioDescriptor` (with `gpio_descriptor_acquire()` or `gpio_descriptor_acquire_pin_spec()`). Every API function receives that descriptor:
- `descriptor->pin`: the pin number on the expander
- `descriptor->flags`: the flags that the pin was acquired with, including `GPIO_FLAG_ACTIVE_LOW`
- `descriptor->controller`: the expander's device

When a pin is acquired, the kernel stores the flags in the descriptor and calls your `set_flags()` with them.

### API functions

| Function | Purpose |
|---|---|
| `set_level()`, `get_level()` | Write and read the **logical** level of a pin (see [Active low and active high](#active-low-and-active-high)) |
| `set_flags()` | Configure direction, pull-up/down and high impedance. Return `ERROR_NOT_SUPPORTED` for options that the chip doesn't have |
| `get_flags()` | Report the pin's configuration |
| `get_native_pin_number()` | Return `ERROR_NOT_SUPPORTED`: expander pins can't be used by ESP32 peripherals directly |
| `add_callback()`, `remove_callback()`, `enable_interrupt()`, `disable_interrupt()` | Pin interrupts, if the expander has an interrupt output. Otherwise return `ERROR_NOT_SUPPORTED` |

### Register access

Most expanders have one bit per pin in a few 8-bit registers (direction, output, input, pull-up/down). The I2C controller API has helpers for read-modify-write on single bits:

```c
i2c_controller_register8_set_bits(parent, address, REGISTER_OUTPUT, bit, portMAX_DELAY);
i2c_controller_register8_reset_bits(parent, address, REGISTER_OUTPUT, bit, portMAX_DELAY);
i2c_controller_register8_get(parent, address, REGISTER_INPUT, &value, portMAX_DELAY);
```

When an operation needs several register writes that must apply together, lock the device (`device_lock()`/`device_unlock()`) around them, so that another task can't change the same registers in between.

## Active low and active high

**Every IO expander driver must support `GPIO_FLAG_ACTIVE_LOW`, on both inputs and outputs. If the chip can't invert a pin in hardware, the driver must do it in software.**

### Why it matters

Many signals are active low: a reset line resets the chip while it's low, an enable line is often "enabled when low", and a button input reads low when it's pressed. The devicetree describes this with the pin's flags:

```dts
pin-reset = <&io_expander0 6 GPIO_FLAG_ACTIVE_LOW>;
```

The driver that uses the pin then works with **logical** levels only: `gpio_descriptor_set_level(reset, true)` means "assert the reset", whether the line is active high or active low. This keeps drivers independent of the board: the same camera or touch driver works on boards that wire the reset line differently, and only the `.dts` file differs.

That only works if every GPIO controller translates logical levels into physical levels the same way. If an expander ignores the flag:
- an output is driven at the wrong level, e.g. a chip is held in reset forever, or a power rail stays off
- an input reads inverted, e.g. a button reads "pressed" while it's released
- the error shows up on one board with one expander, and not on another board where the same pin is on the ESP32. That's hard to track down.

Rejecting `GPIO_FLAG_ACTIVE_LOW` with `ERROR_NOT_SUPPORTED` isn't a good alternative either: acquiring the pin then fails, and the device that needs it doesn't start.

### Software inversion

Without hardware support, invert the level in `set_level()` and `get_level()`, based on the descriptor's flags:

```c
static error_t set_level(GpioDescriptor* descriptor, bool high) {
    // This chip has no output polarity register: active-low is inverted in software
    bool physical_high = (descriptor->flags & GPIO_FLAG_ACTIVE_LOW) != 0 ? !high : high;
    // ... write physical_high to the output register
}

static error_t get_level(GpioDescriptor* descriptor, bool* high) {
    bool physical_high = /* ... read from the input register */;
    *high = (descriptor->flags & GPIO_FLAG_ACTIVE_LOW) != 0 ? !physical_high : physical_high;
    return ERROR_NONE;
}
```

Report the flag back in `get_flags()`:

```c
*flags |= (descriptor->flags & GPIO_FLAG_ACTIVE_LOW);
```

The ESP32's own GPIO driver works the same way, as its pins have no output inversion either.

### Hardware inversion

Some expanders have a polarity register. Check what it actually inverts:
- If it inverts both inputs and outputs, use it, and don't invert in software as well, or the level is inverted twice.
- Many chips (e.g. the PCA9555 family) only invert what's **read** from an input. In that case use the register for inputs and still invert outputs in software.

Make sure that the logical level is the same in every case: `set_level(true)` followed by `get_level()` on an output (where the chip allows reading outputs back) must return `true`, for both active high and active low.

### Initial level

When an active-low output is configured, the physical output register still holds its power-on value. That's often low, which asserts an active-low signal. If a short pulse is a problem (e.g. an unwanted reset), set the output register to the inactive level before switching the pin to output.

## Checklist

- The binding includes `i2c-device.yaml` (for I2C expanders), and the `.dts` node is a child of its bus.
- `start_device` checks the parent bus type and calls `gpio_controller_init_descriptors()` with the chip's pin count.
- `set_level()` and `get_level()` use logical levels: `GPIO_FLAG_ACTIVE_LOW` works on inputs and outputs, in hardware or in software.
- `get_flags()` reports `GPIO_FLAG_ACTIVE_LOW`.
- Options that the chip doesn't have return `ERROR_NOT_SUPPORTED`, and polarity is never one of them.
- Multi-register changes are made under `device_lock()`.
