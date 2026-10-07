# Device Properties

Every device has a `device.properties` file in its folder (`Devices/<device-id>/device.properties`). `device.py` reads it to generate the `sdkconfig` for that device, and the build and release scripts use it for metadata.

## Format

Each line is a `group.key=value` pair:

```properties
general.vendor=LilyGO
general.name=T-Deck

hardware.target=ESP32S3
hardware.flashSize=16MB
```

- Empty lines and lines that start with `#` are ignored.
- Spaces around the key and the value are removed.
- A boolean value must be the literal `true` or `false`. This is case-sensitive.

Below you will find the documentation for each group.

## general

- `general.vendor`: required text value with the device's vendor (e.g. `LilyGO`). If there's no company name, leave it empty or set it to the device name (e.g. `unPhone`).
- `general.name`: required text value with the device's name (e.g. `T-Deck`). For a firmware that supports several devices, separate the names with commas (e.g. `Panda Touch,K Touch`).
- `general.incubating`: optional boolean that marks a device as in development or as having known issues. Defaults to `false`.

The device's full name is the vendor followed by the name. When the vendor is empty or equal to the name, only the name is used.

## apps

- `apps.launcherAppId`: required id of the launcher app (e.g. `tactility.launcher`).
- `apps.autoStartAppId`: optional id of an app that is started automatically after boot.

## hardware

- `hardware.target`: required hardware target: `ESP32`, `ESP32S3`, `ESP32C6` or `ESP32P4`.
- `hardware.flashSize`: required flash size (e.g. `16MB`).
- `hardware.flashMode`: optional flash mode (e.g. `QIO` or `DIO`). Defaults to `QIO`.
- `hardware.esptoolFlashFreq`: optional flash frequency for esptool (e.g. `80M` or `120M`). `120M` also enables the flash's high-performance mode.
- `hardware.spiRam`: required boolean for the availability of SPI RAM (PSRAM).
- `hardware.spiRamMode`: the SPI RAM mode: `QUAD`, `OCT` (or `OPI`), `HEX` or `AUTO`. Required when `hardware.spiRam` is `true`.
- `hardware.spiRamSpeed`: the SPI RAM frequency (e.g. `80M`, `120M` or `200M`). Don't add spaces and always use an upper-case `M`. Required when `hardware.spiRam` is `true`.
- `hardware.spiRamXipDisabled`: optional boolean for ESP32-S3 devices. Set it to `true` when the device fails to boot with "PSRAM space not enough for the Flash instructions". Code and read-only data then stay in flash instead of being copied to SPI RAM. Defaults to `false`.
- `hardware.bluetooth`: optional boolean to enable Bluetooth (NimBLE). Defaults to `false`.
- `hardware.usbHostEnabled`: optional boolean to enable USB host support (hubs, mass storage, etc.). Defaults to `false`.

### USB device

The USB device classes are enabled separately. They're all optional booleans that default to `false`, and they only work on targets with USB OTG (ESP32-S2, S3, P4 and H4):

- `hardware.tinyUsbMsc`: USB mass storage, to access the SD card from a computer.
- `hardware.tinyUsbHid`: USB HID, to act as a keyboard.
- `hardware.tinyUsbMidi`: USB MIDI, to act as a MIDI controller.
- `hardware.tinyUsbCdc`: a USB serial console next to HID or MIDI. Only set it when the device's `.dts` file has an enabled `usbdevicecdc0` node.

## storage

- `storage.userDataLocation`: required location of the user data: `SD` or `Internal`.

## display

Devices without a display leave out the `display` and `lvgl` groups.

- `display.size`: required text value with the physical display size, including the `"` (e.g. `1.47"`).
- `display.dpi`: required integer with the display's dots per inch (e.g. `247`).

The display's shape (rounded corners or circular) isn't set here: the display driver reports it, based on the device's `.dts` file.

## lvgl

- `lvgl.colorDepth`: required integer with the number of bits per pixel (e.g. `16`).
- `lvgl.theme`: optional default theme mode: `DefaultDark`, `DefaultLight` or `Mono`. `Mono` starts in light mode. Defaults to `DefaultDark`. Users can change the theme in the Appearance settings.
- `lvgl.fontSize`: optional default font size in pixels. Defaults to `14`.
- `lvgl.dpi`: optional override for `display.dpi`. This changes the way LVGL scales its widgets.
- `lvgl.uiDensity`: optional, decides how closely the widgets are put together: `default` or `compact`. Defaults to `default`.

## touch

- `touch.calibrationSupported`: optional boolean that enables touch calibration, for touch screens that need it (e.g. resistive ones). Defaults to `false`.
- `touch.calibrationRequired`: optional boolean that makes the setup process start with the touch calibration. Only works together with `touch.calibrationSupported`. Defaults to `false`.

## cdn

- `cdn.warningMessage`: optional warning message for the device in the CDN (App Hub) metadata.
- `cdn.infoMessage`: optional info message for the device in the CDN (App Hub) metadata.

## sdkconfig

Any property that starts with `sdkconfig.` is copied directly into the `sdkconfig` file by `device.py`.

For example, this `device.properties`:

```properties
sdkconfig.CONFIG_ESP_HOSTED_USE_MEMPOOL=n
```

becomes the following `sdkconfig`:

```properties
CONFIG_ESP_HOSTED_USE_MEMPOOL=n
```
