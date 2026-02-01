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

## Update Kconfig

Define the new device in `Firmware/Kconfig`.

You'll need a new configuration entry that matches a preprocessor definition with a device name. Like this:

```kconfig
config TT_DEVICE_LILYGO_TDECK
    bool "LilyGo T-Deck"
```

The `TT_` prefix is required. Use the device identifier as a basis for the name. Make it all upper-case and replace hyphens with underscores.

## Create project folder

Make an empty new folder in `Devices/` with a name that matches the device identifier exactly (case-sensitive).

## Create device.properties

The `sdkconfig` is generated from `device.properties` file in `Devices/your-device-identifier/`

Run `python device.py your-device-identifier` to generate the `sdkconfig` file for the device. You can add `--dev` to generate partitions with a `4 MB` footprint for faster flashing.

See the [device.properties documentation](device-development/device-properties.md) for more info.

## Implementation

Look at other device projects to see how they are set up. The LilyGO T-Deck is one of the better reference implementations.
Keep in mind that other devices might have the same or similar hardware, so you can possibly copy parts of their implementations. (e.g. the display and/or touch driver)

Make sure there's a `extern const tt::hal::Configuration hardwareConfiguration = { .. }` variable declared. It needs to be declared exactly like this. Place it in a file named `Configuration.cpp`

You'll also need a `devicetree.yaml` file and a `.dts` file.

When possible, re-use existing drivers:

- Legacy drivers, using a C++ interface based on `tt::hal::Device`, found in `Drivers/`
- New kernel drivers based on the `TactilityKernel` subproject. The drivers are found in `Platforms/` and `Drivers/`
- [components.espressif.com](https://components.espressif.com/) and write your own wrappers.

New drivers should be written as kernel drivers. Look at `Platforms/PlatformEsp32` for examples.

Explore the [drivers documentation](device-development/drivers.md) or the [legacy drivers documentation](device-development/drivers-legacy.md) for more details.

## Continuous Integration

Update the device matrix in `.github/workflows/build-firmware.yml`

