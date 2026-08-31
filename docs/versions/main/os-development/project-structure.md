# Project Structure

- `Buildscripts`: CMake helpers, the devicetree compiler, release/CDN scripts and other build tooling
- `Data`: Files that are flashed as a FAT filesystem image (`Data/system/` and `Data/data/`) on ESP32
- `Devices`: Device implementation projects
- `Drivers`: Various device drivers, including newer kernel-module style drivers (`*-module`)
- `Libraries`: A mix of regular libraries and ESP components
- `Modules`: Each subproject represents a group of functionality (e.g. `lvgl-module`, `hal-device-module`, `http-module`)
- `Platforms`: The platform-specific driver implementations for TactilityKernel (`platform-esp32`, `platform-posix`)
- `Tactility`: The main application/service platform: app framework, HAL, networking, settings, i18n
- `TactilityFreeRtos`: Thin C++ wrappers around FreeRTOS primitives (threads, mutexes, timers, etc.)
- `TactilityKernel`: The core C API kernel: device/driver/module lifecycle, concurrency primitives, filesystem, logging
- `Tests`: Doctest-based unit tests that run on the simulator (POSIX) target
- `Translations`: Localization CSV files, compiled via `generate.py`

See [Architecture](os-development/architecture.md) for how these layers fit together.

