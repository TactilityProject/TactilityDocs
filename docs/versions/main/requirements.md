# Requirements

## Software

- GCC compiler that supports C++23. If you're running Ubuntu, this means you need Ubuntu 24.04 or newer.
- [ESP-IDF v5.5](https://docs.espressif.com/projects/esp-idf/en/v5.5/esp32/get-started/index.html) or a newer v5.5.x
- Linux, macOS, or Windows (Win11 natively or via WSL2 with Ubuntu 24.04 or newer) (\*)

(\*) Continuously tested with latest Fedora (x86-64) and Ubuntu 24.04 (x86-64). Sporadically tested with latest macOS (aarch64). The simulator is currently only supported on Linux and Windows+WSL2.

## Hardware

There are no specific hardware requirements for the development PC.

The list of supported devices is available [here](https://tactilityproject.org/#/supported-devices). You can implement your own device based on ESP32, ESP32-S3, ESP32-C6 or ESP32-P4 as you wish. Other Espressif SOCs might also compile, but aren't officially supported yet.

A Wi-Fi connection is not required, but it will greatly improve the development experience as it allows you to install and run apps directly from a PC.

## IDE

An IDE is optional. You can build everything with CMake via the commandline.

Here are some good IDE options:
- [CLion](https://www.jetbrains.com/clion/) (paid)
- [VSCode](https://code.visualstudio.com/) (free)

