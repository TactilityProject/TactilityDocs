# Board Development

## New Board Considerations

### SOC

The ESP32 and ESP32-S3 are actively tested. The S3 will perform much better and is the preferred target.
Other SOCs will likely also be supported in the future, but we currently don't have device implementations for them.

### Memory

External memory (PSRAM/SPIRAM) goes a long way. External memory is not a hardware requirement,
but if you want to run WiFi then you might run into memory issues unless you apply strict memory settings for your board.

When you don't have external memory available, it's advised to put more code into ROM instead of IRAM.
Use existing ESP32 sdkconfig configurations as a reference.

### Display

A display is optional.

If the resolution is higher (e.g. 480x240 or larger) then performance tends to degrade.

Avoid software manipulation of pixels. For example: the byte swapping option in the esp_lvgl_port library.
This will likely degrade performance severely.

### Input

There are various types of input devices: touchscreens, encoders and keyboards.

Note that when an input driver is not well implemented, it might degrade performance as it
might stall the render thread.

### Drivers

Re-use existing drivers from:
- Tactility at `Drivers/`
- [components.espressif.com](https://components.espressif.com/) and write your own wrappers. Look at Tactility's `Drivers/` for examples.

Alternatively, you can implement your own or refactor another open source driver.

## Setting Up A New Board

### Update Kconfig

Define a new board in `Firmware/Kconfig`.

### sdkconfig

Create a `sdkconfig.board.yourboard` file. It's good to use one of the other boards of a similar architecture as reference.

Devices with a large flash ROM (e.g. `16 MB`) will take long to flash. Consider making making a copy of `sdkconfig.board.yourboard` named `sdkconfig.board.yourboard.dev` with a `4 MB` partition table. The `.dev` files are ignored by git.

### Create Subproject

Make a new folder in `Boards/`: the name should match board identifier that was set in the sdkconfig file.

Look at other board projects to see how they are set up. The LilyGO T-Deck is one of the better reference implementations.
Keep in mind that other boards might have the same or similar hardware, so you can possibly copy parts of their implementations. (e.g. the display and/or touch driver)

Make sure there's a `extern const tt::hal::Configuration hardwareConfiguration = { .. }` variable declared. It needs to be declared exactly like this. Place it in a file named `Configuration.cpp`

### Continuous Integration

Update the board matrix in `.github/workflows/build-firmware.yml`
