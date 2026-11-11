# HAL Fundamentals

HAL or "Hardware Abstraction Layer" is what gives access to specific hardware in a generic manner.

All HAL-related code can be found in the `tt::hal::` namespace.

Note that `tt::hal::Device` is a driver abstraction. It does 2 things:
- Identify devices and device types
- Expose basic driver functionality such as start/stop
- Expose device-type-specific functionality (e.g. a `PowerDevice` exposes power-related metrics like voltage)

A `Device` can either directly implement a driver (e.g. communicate via I2C, SPI, etc) or it can use one or more other devices as a reference to create a new driver. For example: a `PowerDevice` might facilitate power management and status by referring to two `I2cDevice` instances that implement the actual hardware communications.

## GPIO

The `tt::gpio` namespace contains wrappers for GPIO access.

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

## I2C

The `tt::hal::i2c` namespace gives access to thread-safe I2C communications.

`tt::hal::i2c::I2cDevice` helps developers to build I2C drivers.

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

## SPI

The `tt::hal::spi` namespace gives access to thread-safe SPI communications.

## UART

The `tt::hal::uart` namespace gives access to thread-safe UART communications.

