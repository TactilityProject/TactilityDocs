# Drivers

Legacy drivers are C++ classes that derive from `tt::hal::Device` in the `Tactility` subproject.

If you find `esp_lcd` or `esp_lcd_touch` drivers, you can implement them more easily with `Drivers/EspLcdCompat/` functionality:

- `class EspLcdTouch` will assist with a touch driver implementation
- `class EspLcdSpiDisplay` is the recommended base class for SPI display drivers
- `class EspLcdDisplayV2` is the recommended base class for non-SPI display drivers
- `class EspLcdDisplay` can be used in more complex driver scenarios

When a legacy device is registered, it creates a kernel device (`struct Device` from the `TactilityKernel` subproject)
and registers that with the kernel.
All HAL-related code can be found in the `tt::hal::` namespace.

Note that `tt::hal::Device` is a driver abstraction. It does 2 things:

- Identify devices and device types
- Expose basic driver functionality such as start/stop
- Expose device-type-specific functionality (e.g. a `PowerDevice` exposes power-related metrics like voltage)

A `Device` can either directly implement a driver (e.g. communicate via I2C, SPI, etc) or it can use one or more other devices as a reference to create a new driver. For example: a `PowerDevice` might facilitate power management and status by referring to two `I2cDevice` instances that implement the actual hardware communications.

## Display

`DisplayDevice` represents a display driver with the following features:

- start/stop
- (optional) ability to attach and detach from LVGL (`startLvgl()`, `stopLvgl()`)
- (optional) ability to expose a `DisplayDriver` which gives access to the core driver. When this driver is used, LVGL must first be stopped via `tt::lvgl::stop()`

## Encoder

`EncoderDevice` represents a touch driver with the following features:
- Ability to attach and detach from LVGL (`startLvgl()`, `stopLvgl()`)

Note: A core driver interface is not available yet.

## GPS

The `tt::hal::gps` namespace gives access to thread-safe GPS abstractions.

## Keyboard

`KeyboardDevice` represents a keyboard driver with the following features:
- Ability to attach and detach from LVGL (`startLvgl()`, `stopLvgl()`)

Note: A core driver interface is not available yet.

## Power

`PowerDevice` is the driver for power status information with the following features:
- Read certain metrics such as voltage and power usage
- (optional) ability to power off the device
- (optional) ability for charging status and control

## Touch

`TouchDevice` represents a touch driver with the following features:
- start/stop
- (optional) ability to attach and detach from LVGL (`startLvgl()`, `stopLvgl()`)
- (optional) ability to expose a `TouchDriver` which gives access to the core driver. When this driver is used, LVGL must first be stopped via `tt::lvgl::stop()`

## SD Card

`SdCard` is the driver for mounting an SD card.

Use the `SpiSdCard` class for SPI-based drivers, if it fits your needs.

