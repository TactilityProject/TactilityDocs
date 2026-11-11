# Requirements

## Software

- GCC compiler that supports C++23. If you're running Ubuntu, this means you need Ubuntu 24.04 or newer.
- [ESP-IDF v5.5](https://docs.espressif.com/projects/esp-idf/en/v5.5/esp32/get-started/index.html) or a newer v5.5.x
- Linux, macOS, or Windows (Win11 natively or via WSL2 with Ubuntu 24.04 or newer) (\*)

(\*) Continuously tested with latest Arch (x86-64) and Ubuntu 24.04 (x86-64). Sporadically tested with latest macOS (aarch64). The simulator is currently only supported on Linux and Windows.

## Hardware

There are no specific hardware requirements for the development PC.

The list of supported devices is available on the [main website](https://tactility.one/#/supported-devices). You can implement your own ESP32 and ESP32S3 devices as you wish. Other Espressif SOCs might also compile, but official support for these is planned for the future.

A Wi-Fi connection is not required, but it will greatly improve the development experience as it allows you to upload and run apps directly from a PC.

