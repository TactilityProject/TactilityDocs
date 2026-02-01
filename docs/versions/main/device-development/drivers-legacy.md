# Drivers

Legacy drivers are C++ classes that derive from `tt::hal::Device` in the `Tactility` subproject.

If you find `esp_lcd` or `esp_lcd_touch` drivers, you can implement them more easily with `Drivers/EspLcdCompat/` functionality:

- `class EspLcdTouch` will assist with a touch driver implementation
- `class EspLcdSpiDisplay` is the recommended base class for SPI display drivers
- `class EspLcdDisplayV2` is the recommended base class for non-SPI display drivers
- `class EspLcdDisplay` can be used in more complex driver scenarios

When a legacy device is registered, it creates a kernel device (`struct Device` from the `TactilityKernel` subproject)
and registers that with the kernel.

