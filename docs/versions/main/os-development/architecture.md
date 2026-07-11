# Architecture

## Layer Stack

From bottom to top:

- **TactilityKernel** — C API kernel: device/driver/module lifecycle, concurrency primitives (thread, mutex, timer, dispatcher), filesystem, logging. Header convention: `<tactility/*.h>` (lowercase snake_case). See [Drivers](device-development/drivers.md) for the device/driver/module system.
- **TactilityFreeRtos** — Thin C++ wrappers around FreeRTOS primitives.
- **Tactility** — Main OS layer: app framework, service framework, HAL (deprecated, being replaced by TactilityKernel), LVGL integration, networking and services (Wi-Fi, BLE, NTP, ESP-NOW), settings, i18n.
- **TactilityC** — C bindings (`tt_*.h`) for Tactility, used by side-loaded ELF apps on ESP32. Deprecated, being replaced by TactilityKernel. See [Symbols](app-development/symbols.md).
- **Firmware** — Entry point (`app_main`), links everything together for a specific device.

## App Framework

Apps implement `tt::app::App` (or provide plain callbacks). Each app has an `AppManifest` with `appId`, `appName`, `appCategory` and a factory function `createApp`. Internal apps are registered at startup in `Tactility.cpp`. External apps can be loaded from SD card via `manifest.properties` files, or side-loaded as ELF binaries on ESP32 — see [App Development](app-development/fundamentals.md).

## Service Framework

Services implement `tt::service::Service` with a `ServiceManifest`. Services are long-running background processes: GUI, Wi-Fi, the app loader, the statusbar, GPS, the [WebServer](../features/webserver.md), and more.

## HAL Layer

### Deprecated HAL

Located in the `Tactility` folder. `tt::hal::Configuration` is declared per-device board (in `Devices/<id>/Source/Configuration.cpp`). It provides `initBoot` for early hardware setup and `createDevices` to instantiate HAL device wrappers (display, touch, power, keyboard, etc.). Devices that have been migrated to the current HAL still declare an empty placeholder configuration for compatibility.

### Current HAL

Located in TactilityKernel, based on the Linux driver subsystem model described in [Drivers](device-development/drivers.md): modules register drivers, drivers bind to devices via `compatible` strings from the devicetree.

## Platform Abstraction

- `Platforms/platform-esp32/` — ESP-IDF specific implementations
- `Platforms/platform-posix/` — POSIX simulator implementations (SDL for display)

## Build System

The `tactility_add_module()` CMake macro (in `Buildscripts/module.cmake`) wraps ESP-IDF's `idf_component_register` on ESP32 and a standard `add_library`/`add_executable` on POSIX, allowing the same source to build for both targets.

`device.py` reads `Devices/<id>/device.properties` and generates the `sdkconfig` file with all necessary ESP-IDF config (target chip, flash size, SPIRAM, LVGL fonts, Bluetooth, USB, etc.) — see [Device Properties](device-development/device-properties.md).

## LVGL

User interfaces should scale well for everything between very large (e.g. 1280x720) and small (e.g. 135x240) displays. Vertical and horizontal layouts are both supported.

## Coding Style

Two conventions coexist; which one to use depends on the project layer:

- **C code** (TactilityKernel, drivers): `lower_snake_case` for files, functions, variables. `UpperCamelCase` for types. Files live in `source/`, `include/`, `private/` directories.
- **C++ code** (Tactility, apps, services): `UpperCamelCase` for files and types. `lowerCamelCase` for functions. Files live in `Source/`, `Include/`, `Private/` directories.

Formatting is enforced by `.clang-format` (LLVM-based, 4-space indent, no column limit).

Other conventions:
- Never throw exceptions — use return types for error handling.
- Use `enum class` over plain `enum`.
- Don't do null checks: the caller is responsible for passing valid data. Pointers are expected to be non-null unless documented otherwise.
- `#ifdef ESP_PLATFORM` guards ESP32-specific code; the simulator uses POSIX equivalents.
