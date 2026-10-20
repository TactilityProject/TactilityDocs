# Symbols

Apps can only call the functions that the firmware exports. This page explains how symbols are exported, how to add new ones and how to test them.

## How symbols are exported

Every [kernel module](kernel-concepts/module.md) can export symbols through the `symbols` field of its `struct Module`: a table of `ModuleSymbol` entries, terminated by `MODULE_SYMBOL_TERMINATOR`. When an app is loaded, its undefined symbols are looked up in the tables of the modules that were added to the system with `module_add()`. A module doesn't need to be started for this. The [modules from a package](app-development/modules.md) are looked up the same way.

```c
const struct ModuleSymbol lvgl_module_symbols[] = {
    DEFINE_MODULE_SYMBOL(lvgl_lock),
    DEFINE_MODULE_SYMBOL(lvgl_unlock),
    DEFINE_MODULE_SYMBOL(lv_event_get_code),
    /* ... */
    MODULE_SYMBOL_TERMINATOR
};

struct Module lvgl_module = {
    .name = "lvgl",
    .start = start,
    .stop = stop,
    .symbols = (const struct ModuleSymbol*)lvgl_module_symbols,
    .internal = NULL
};
```

Modules usually keep their table in `source/symbols.c` (e.g. `Modules/lvgl-module/source/symbols.c`, `TactilityKernel/source/symbols.c`).

`tactility/module.h` has three macros for the entries:
- `DEFINE_MODULE_SYMBOL(symbol)`: exports a function or variable under its own name.
- `DEFINE_MODULE_SYMBOL_SIGNATURE(symbol, type)`: for overloaded functions (e.g. C++ math functions for `float` and `double`), where `type` picks the overload.
- `DEFINE_MODULE_SYMBOL_ALIAS(name, symbol)`: exports a function under a different name, e.g. so that apps built against an old name keep working after a rename.

## Where symbols live

- **C library:** `Modules/c-symbols-module` exports the C standard library functions that apps can use: memory, strings, `stdio`, math, time, etc.
- **Kernel:** `TactilityKernel/source/symbols.c` exports the kernel API: devices, drivers, GPIO, I2C, displays, threads, timers, logging, etc.
- **Modules:** every module in `Modules/` exports its own API, e.g. `lvgl-module` (LVGL and Tactility's widgets), `app-module`, `http-module` and `wifi-module`.
- **Platforms:** `Platforms/` contains the platform modules (e.g. ESP32 or POSIX).
- **Drivers:** driver modules in `Drivers/` can export functions for their own device types.

## Exposing a new symbol

1. Add a `DEFINE_MODULE_SYMBOL()` entry to the symbol table of the module that implements the function. New functionality belongs in a kernel module.
2. Make sure the function is declared in a public header of that module (`include/`), so that apps can include it.
3. Build the firmware and flash it.

A function from the C standard library only needs step 1 (in `c-symbols-module`) and step 3. Apps can already use it, because its header is part of the toolchain.

For anything else, apps also need a new TactilitySDK with the module's headers (see below). The SDK includes the modules that are listed in `Buildscripts/release-sdk-modules.txt`, so a new module that apps use must be added there.

## Building TactilitySDK locally

When you export new symbols, you'll need to build your own SDK locally to build apps against them:

1. Open a terminal and navigate to the Tactility project root folder.
2. Build the firmware for the relevant target (e.g. ESP32-S3) with `idf.py build`.
3. Run `python Buildscripts/release-current.py`. It creates the SDK in `release/sdk/<version>/platform-<target>/TactilitySDK`, and the [tt](app-development/tt.md) tools in `release/sdk/<version>/tools`, where `<version>` comes from `version.txt`.
   - With an activated ESP-IDF environment, it builds the SDK for the target in `sdkconfig`.
   - Without one, it builds the SDK for the simulator (`posix-<architecture>`).
4. Set the environment variable `TACTILITY_SDK_PATH` to the `release` folder, for example: `export TACTILITY_SDK_PATH=/path/to/Tactility/release`
5. In the app's folder, run `./tt app build --architecture esp32s3` (change `esp32s3` to the relevant hardware target where applicable). The app's `target.sdk` in `manifest.properties` must match the SDK's version.

While `TACTILITY_SDK_PATH` is set, `tt` uses this SDK for every command. Unset it to use the downloaded SDKs again.

## Testing

Run the app on a device with the new firmware. When a function or variable that the app uses isn't exported, the app fails to load, and the log names it, e.g.:

```
E (5156) ELF: Can't find symbol lv_obj_set_flag
```

`Can't find common <name>` is logged for a missing variable, or for a C++ symbol (e.g. from `std::shared_ptr`) that the app defines itself. For the latter, make sure that the app was built with an up-to-date SDK, which links apps so that they use their own definitions.
