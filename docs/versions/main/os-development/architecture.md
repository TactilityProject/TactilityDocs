# Architecture

## Layer Stack

- **Tactility**: The main project which is used to build the firmware and simulator builds. It ties everything together with wrappers and some basic applications.
- **TactilityKernel**: The kernel with C API: device/driver/module lifecycle, concurrency primitives (thread, mutex, timer, dispatcher), filesystem, logging. Header convention: `<tactility/*.h>` (lowercase snake_case). See [Drivers](device-development/drivers.md) for the device/driver/module system.
- **TactilityFreeRtos**: Thin C++ wrappers around FreeRTOS primitives.

## App Framework

Apps implement `tt::app::App` (or provide plain callbacks). Each app has an `AppManifest` with `appId`, `appName`, `appCategory` and a factory function `createApp`. Internal apps are registered at startup in `Tactility.cpp`. External apps can be loaded from SD card via `manifest.properties` files, or side-loaded as ELF binaries on ESP32 — see [App Development](app-development/fundamentals.md).

## Service Framework

Services implement `tt::service::Service` with a `ServiceManifest`. Services are long-running background processes: GUI, Wi-Fi, the app loader, the statusbar, GPS, the [WebServer](../features/webserver.md), and more.

## Hardware Abstraction Layer

The main driver abstractions are in TactilityKernel. Implementations of drivers are found in `Drivers/`.
Secondary driver modules are located at `Modules/`.

Drivers are based on the Linux driver subsystem model described in [Drivers](device-development/drivers.md): modules register drivers, drivers bind to devices via `compatible` strings from the devicetree.

## Platform Abstraction

- `Platforms/platform-esp32/` — ESP-IDF specific implementations
- `Platforms/platform-posix/` — POSIX simulator implementations (SDL for display)

## Build System

The `tactility_add_module()` CMake macro (in `Buildscripts/module.cmake`) wraps ESP-IDF's `idf_component_register` on ESP32 and a standard `add_library`/`add_executable` on POSIX, allowing the same source to build for both targets.

`device.py` reads `Devices/<id>/device.properties` and generates the `sdkconfig` file with all necessary ESP-IDF config (target chip, flash size, SPIRAM, LVGL fonts, Bluetooth, USB, etc.) — see [Device Properties](device-development/device-properties.md).

## LVGL

User interfaces should scale well for everything between very large (e.g. 1280x720) and small (e.g. 135x240) displays. Vertical and horizontal layouts are both supported.

## Coding Style

Detailed coding style can be found in the project's `CODING_STYLE_C.md` and `CODING_STYLE_CPP.md` files.
