# Symbols

The list of available function is limited. This page explains how to add new ones and how to test them.

## Core symbols

Symbols relating to libc, string and other basic functionality are registered in the `TactilityC` subproject:

1. Add the new symbol to `tt_init.cpp`.
2. Build a new device firmware and flash it.

Note: You don't need to publish and use a new `TactilitySDK`, as the libc function is available via an existing header file that is available to any external app project.

## Module symbols

Some functionality is part of a (kernel) module, such as `lvgl-module`:
```c
const struct ModuleSymbol lvgl_module_symbols[] = {
    DEFINE_MODULE_SYMBOL(lv_event_get_code),
    DEFINE_MODULE_SYMBOL(lv_event_get_indev),
    DEFINE_MODULE_SYMBOL(lv_event_get_key),
    DEFINE_MODULE_SYMBOL(lv_event_get_param),
    /* ... */
    MODULE_SYMBOL_TERMINATOR
};

static error_t start() { /* Initialize LVGL memory and task(s) */ }

static error_t stop() { /* Stop LVGL tasks and free up memory */ }

struct Module lvgl_module = {
    .name = "lvgl",
    .start = start,
    .stop = stop,
    .symbols = (const struct ModuleSymbol*)lvgl_module_symbols,
    .internal = NULL
};
```

Modules are found in these locations:

- `Drivers/`: Older style drivers and newer module-based ones
- `Modules/`: Contains functionality modules
- `Platforms/`: Platform modules (e.g. ESP32 or POSIX) 
- `TactilityKernel/`: The core kernel/system.

## Exposing a symbol for new functionality

New Tactility symbols should be part of a kernel module whenever possible. Legacy symbol types can remain part of `TactilityC` for now.

## Building TactilitySDK locally

When you export new symbols, you'll need to build your own SDK locally:

1. Open a terminal and navigate to the Tactility project root folder.
2. Build the firmware for the relevant target (e.g. ESP32 S3) with `idf.py build`
3. Make sure that the `release/` directory either doesn't exist or doesn't have a previous SDK in it.
4. Run `Buildscripts/release-sdk-current.sh`
5. Set environment variable `TACTILITY_SDK_PATH` - for example: `export TACTILITY_SDK_PATH=/path/to/Tactility/release/TactilitySDK`
6. Run `tactility.py build esp32s3 --local-sdk` (change "esp32s3" to the relevant hardware target where applicable)

