# App Development - Symbols

The list of available function is limited. This page explains how to add new ones and how to test them.

## Exposing a libc or LVGL symbol

1. Add the symbol to `tt_init.cpp`.
2. Build a new device firmware and flash it.

Note: You don't need to publish and use a new `TactilitySDK`, as the libc function is available via an existing header file that is available to any external app project.

## Exposing a new Tactility symbol

1. Expose the symbol in `TactilityC` via a `.c` and `.h` file: this will wrap the C++ function into a C function and make it available to the apps.
2. Add the new `TactilityC` symbol to `tt_init.cpp`.
3. Build a new device firmware and flash it.
4. Build `TactilitySDK`
5. Build your external app with the new SDK.

## Building TactilitySDK locally

When making changes to `TactilityC`, you'll need to build your own SDK locally:

1. Open a terminal and navigate to the Tactility project root folder.
2. Build the firmware for the relevant target (e.g. ESP32 S3) with `idf.py build`
3. Make sure that the `release/` directory either doesn't exist or doesn't have a previous SDK in it.
4. Run `Buildscripts/release-sdk-current.sh`
5. Set environment variable `TACTILITY_SDK_PATH` - for example: `export TACTILITY_SDK_PATH=/path/to/Tactility/release/TactilitySDK`
6. Run `tactility.py build esp32s3 --local-sdk` (change "esp32s3" to the relevant hardware target where applicable)
