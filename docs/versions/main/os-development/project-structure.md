# Project Structure

- `Buildscripts`: CMake helpers, the devicetree compiler, release/CDN scripts and other build tooling
- `Data`: Files that are flashed as a FAT filesystem image (`Data/system/` and `Data/data/`) on ESP32
- `Devices`: Device implementation projects
- `Drivers`: Various device drivers, including newer kernel-module style drivers (`*-module`)
- `Firmware`: The main project to build the firmware (and simulator); contains the `app_main` entry point
- `Libraries`: A mix of regular libraries and ESP components
- `Modules`: Each subproject represents a group of functionality (e.g. `lvgl-module`, `hal-device-module`)
- `Platforms`: The platform-specific driver implementations for TactilityKernel (`platform-esp32`, `platform-posix`)
- `Tactility`: The main application/service platform: app framework, HAL, networking, settings, i18n
- `TactilityC`: (deprecated) C wrappers for Tactility used by external apps, being replaced by TactilityKernel
- `TactilityFreeRtos`: Thin C++ wrappers around FreeRTOS primitives (threads, mutexes, timers, etc.)
- `TactilityKernel`: The core C API kernel: device/driver/module lifecycle, concurrency primitives, filesystem, logging
- `Tests`: Doctest-based unit tests that run on the simulator (POSIX) target
- `Translations`: Localization CSV files, compiled via `generate.py`

See [Architecture](os-development/architecture.md) for how these layers fit together.

