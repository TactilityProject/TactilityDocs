# Building Tactility

## Cloning from git

Ensure you clone the repository including the submodules! For example:

```sh
git clone --recurse-submodules -j8 https://github.com/ByteWelder/Tactility.git
```

## ESP32 Build Environment

- ESP32 (any?)
- [esp-idf 5.3.2](https://docs.espressif.com/projects/esp-idf/en/v5.3.2/esp32/get-started/index.html) or a newer v5.3.x

## Build an ESP32 variant

Run this:

```sh
Buildscripts/build.sh <board-name>
```

`<board_name>` is the the last part of the names of the boards in `./sdkconfig.board.<board-name>`.

For example:

```sh
Buildscripts/build.sh lilygo-tdeck
```

## Building ESP32 manually

Copy the `sdkconfig.board.YOUR_BOARD` into `sdkconfig`. Use `sdkconfig.defaults` if you are setting up a custom board.

```sh
cp sdkconfig.board.<board-name>
idf.py build
```

Flash:

```sh
idf.py -p <port> flash monitor
```

`<port>` is something like `/dev/ttyACM0` or `/dev/ttyUSB0` on Linux/macOS, or `COM3` on Windows.


Flashing ESP32:

```bash
idf.py flash monitor
```

