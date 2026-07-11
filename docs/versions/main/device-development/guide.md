# Guide

This page explains how to create a new device implementation.

## Device identifier

Your device needs a unique identifier. There are generally 2 kinds: devices from a named manufacturer and devices without a named manufacturer.

The naming convention is as follows:

- With a manufacturer name: `manufacturer-model`
- Without a manufacturer name: `model`

Naming specifications:

- Valid characters are: `0-9`, `-`, `a-z` (lower-case)
- Spaces become `-`
- Invalid characters are removed. For example: `1.3"` becomes `13`

Examples:

- `M5Stack StickC Plus` -> `m5stack-stickc-plus`
- `unPhone` -> `unphone`
- `Elecrow CrowPanel Basic 2.8"` -> `elecrow-crowpanel-basic-28`

## Create project folder

Make an empty new folder in `Devices/` with a name that matches the device identifier exactly (case-sensitive).

## Create device.properties

The `sdkconfig` is generated from `device.properties` file in `Devices/your-device-identifier/`

Run `python device.py your-device-identifier` to generate the `sdkconfig` file for the device. You can add `--dev` to generate partitions with a `4 MB` footprint for faster flashing.

See the [device.properties documentation](device-development/device-properties.md) for more info.

## Implementation

Use `Devices/lilygo-tdeck/` as a reference.

You'll also need a `devicetree.yaml` file and a `.dts` file.

Create a `Source/module.cpp` or an equivalent `.c` file.
This file must contain a `struct Module your_device_identifier_module = { ... }` 
The top of the file should declare `extern const tt::hal::Configuration hardwareConfiguration = { };` to facilitate the old driver subsystems. It should remain an empty configuration.

Drivers based on the `TactilityKernel` subproject. The drivers are found in `Platforms/` and `Drivers/`.

Explore the [drivers documentation](device-development/drivers.md).

## Continuous Integration

Update the device matrix in `.github/workflows/build-firmware.yml`

