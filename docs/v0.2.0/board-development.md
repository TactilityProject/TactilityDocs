# Board Development

## New Board Considerations

### SOC

The ESP32 and ESP32-S3 are actively tested. The S3 will perform much better and is the preferred target.
Other SOCs will likely also be supported in the future, but we currently don't have device implementations for them.

### Memory

When targeting Tactility (as opposed to TactilityHeadless), external memory (PSRAM/SPIRAM) goes a long way.
External memory is not a requirement, but if you want to run WiFi then you might run into memory issues unless you
apply strict memory settings for your board.

When you don't have external memory available, it's advised to put more code into ROM instead of IRAM.
Use existing ESP32 sdkconfig configurations as a reference.

### Display

If the resolution is higher (e.g. 480x240 or larger) then performance tends to degrade.

Avoid software manipulation of pixels. For example: the byte swapping option in the esp_lvgl_port library.
This will likely degrade performance severely.

### Input

A touch screen is not a requirement, but a recommendation at this point.
You can create other types of input devices to navigate through the LVGL interface.

Note that when an input driver is not well implemented, it might degrade performance as it
might stall the render thread.

### Drivers

You can find many of drivers at [components.espressif.com](https://components.espressif.com/).

Alternatively, you can implement your own or refactor another open source driver. 

## Setting Up A New Board

### Update Kconfig

Define a new board in `App/Kconfig`.

### sdkconfig

Create a `sdkconfig.board.yourboard` file. It's good to use one of the other boards of a similar architecture as reference.

### Create Subproject

Make a new folder in `Boards/`.

### CMake Filtering

`CMakeLists.txt` and `Tactility/CMakeLists.txt` have filtering set up for individual boards or architectures.
Make sure you update these so your board gets loaded.

### Configure App project

In `App/`, add your board as a dependency in the `CMakeLists.txt`.

Update the `Boards.h` to include your board.

### Continuous Integration

Update `.github/workflows/build-firmware.yml` and `.github/actions/build-firmware/action.yml`