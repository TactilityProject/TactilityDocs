# Hardware Considerations

## SOC

ESP32, ESP32-S3 and ESP32-P4 are the most actively tested targets. The S3 will perform much better and is the preferred target.
ESP32-C6 is also supported , but is less widely tested than the S3.
Other Espressif SOCs might also compile, but aren't officially supported yet.

## Memory

External memory (PSRAM/SPIRAM) goes a long way. External memory is not a hardware requirement,
but if you want to run WiFi then you might run into memory issues unless you apply strict memory settings for your device.

When you don't have external memory available, it's advised to put more code into ROM instead of IRAM.
Use existing ESP32 sdkconfig configurations as a reference.

## Display

A display is optional.

If the resolution is higher (e.g. 480x240 or larger) then performance tends to degrade.

Avoid software manipulation of pixels. For example: the byte swapping option in the esp_lvgl_port library.
This will likely degrade performance severely.

## Input

There are various types of input devices: touchscreens, encoders and keyboards.

Note that when an input driver is not well implemented, it might degrade performance as it
might stall the render thread.

