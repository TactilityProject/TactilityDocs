# HAL Fundamentals

HAL or "Hardware Abstraction Layer" is what gives access to specific hardware in a generic manner.

All HAL-related code can be found in the `tt::hal::` namespace.

## Display

`Display` represents a display driver.

## Touch

`Touch` represents a touch driver.

## Keyboard

`Keyboard` represents a keyboard driver.

## Power (Status)

`Power` is the driver for power status information.

## SD Card

`SdCard` is the driver for mounting an SD card.

Use the `SpiSdCard` class for SPI-based drivers, if it fits your needs.

## I2C

The `tt::hal::i2c` namespace gives access to thread-safe I2C communications.

## SPI

The `tt::hal::spi` namespace gives access to thread-safe SPI communications.

## UART

The `tt::hal::uart` namespace gives access to thread-safe UART communications.

## GPS

The `tt::hal::gps` namespace gives access to thread-safe GPS abstractions.

