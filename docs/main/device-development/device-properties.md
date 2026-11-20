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

## modules

- `modules.audio`: optional boolean. Set it to `false` to leave out the audio decoder module and the audio codec library, which saves about 55 KB of flash. Use it on devices without audio hardware, especially those with 4MB of flash. Defaults to `true`. The build fails when it's `false` and the device's `module.yaml` depends on `Drivers/audio-stream-module`. Apps that use the audio decoder can't run on such a device.

## storage

- `storage.path`: the mount path of the storage that holds the user data, e.g. `/data` for the internal data partition or `/sdcard` for an SD card. Defaults to `/sdcard` or `/data` when the older `storage.userDataLocation` (`SD` or `Internal`) is set instead.

The device's `.dts` file must provide the storage at that path. For `/data` it needs an `espressif,esp32-flash-fatfs` node with `partition-label = "data"` and `mount-path = "/data"`. Any other path is provided by the driver of the storage, such as an SD card. See [Filesystems](../kernel-concepts/filesystems.md).

## display

Devices without a display leave out the `display` and `lvgl` groups.

- `display.size`: required text value with the physical display size, including the `"` (e.g. `1.47"`).
- `display.dpi`: required integer with the display's dots per inch (e.g. `247`).

The display's shape (rounded corners or circular) isn't set here: the display driver reports it, based on the device's `.dts` file.

## lvgl

- `lvgl.colorDepth`: required integer with the number of bits per pixel (e.g. `16`).
- `lvgl.fsCacheSize`: optional integer with the size in bytes of the buffer that LVGL allocates on the first read of a file (default `4096`). Lower it on devices without PSRAM, where this allocation can fail when memory is low (e.g. `512`).
- `lvgl.theme`: optional default theme mode: `DefaultDark`, `DefaultLight` or `Mono`. `Mono` starts in light mode. Defaults to `DefaultDark`. Users can change the theme in the Appearance settings.
- `lvgl.fontSize`: optional default font size in pixels. When it's left out, the size is derived from `display.dpi` so that text has the same physical size as on the LilyGO T-Deck (`14` at 143 dpi): `round(14 * dpi / 143)`. For example, 294 dpi gives `29`. `font.defaultSize` is accepted as an alternative name for this property.
- `lvgl.dpi`: optional override for `display.dpi`. This changes the way LVGL scales the widgets that are sized in density-independent pixels (`LV_DPX()`), such as margins and padding. It doesn't change the default font size, which is derived from `display.dpi`, or the launcher icon size, which follows the font size.
- `lvgl.uiSpacing`: optional, default spacing of the widgets in percent, from `0` (compact) to `100` (regular). Users can change it in the Appearance app. Defaults to `100`.
- `lvgl.preferExternalRam`: optional boolean. Set it to `true` to allocate LVGL's draw buffers from external RAM (PSRAM) instead of DMA-capable internal RAM, which frees a lot of internal RAM. Only set it when the display driver accepts a buffer in external RAM: it must either copy from it, or DMA from it directly on a chip that supports that. Direct DMA needs cache line alignment, so also set `sdkconfig.CONFIG_LV_DRAW_BUF_ALIGN` (for example `64` for the Espressif Mosaico). Without PSRAM the buffers fall back to internal RAM. Defaults to `false`.
- `lvgl.drawBufferLines`: optional, the number of display lines in an LVGL draw buffer. It's `0` by default, which uses a tenth of the vertical resolution. A smaller buffer uses less memory and needs more flushes. Displays that don't draw into external RAM keep this buffer in internal RAM, so lowering it helps devices that run short of it. Values above the vertical resolution are capped to it. On a panel that is taller than it is wide, the buffer always holds at least enough lines for one row of the rotated screen, so values below that are raised to it.
- `lvgl.uiSize`: optional, default size of the widgets in percent, from `0` (compact) to `100` (regular). Users can change it in the Appearance app. Defaults to `100`.

## launcher

Settings for the launcher's icon grid. Both are optional and default to `1`. They take decimal values (e.g. `0.8`), and a value of `1` keeps the default. They're applied by `device.py`, so they have no effect in the simulator.

- `launcher.iconSizeScale`: scale of the launcher icons, between `0.25` and `4`. The default icon size is 2.5 × the default font size, so it already follows the display's dpi.
- `launcher.iconSpacingScale`: scale of the minimum spacing between the launcher icons, and between the icons and the edges of the grid, between `0` and `4`. The default spacing is `LV_DPX(2)` to `LV_DPX(16)`, depending on `lvgl.uiSpacing`.

```properties
launcher.iconSizeScale=0.8
launcher.iconSpacingScale=1.25
```

## touch

- `touch.calibrationSupported`: optional boolean that enables touch calibration, for touch screens that need it (e.g. resistive ones). Defaults to `false`.
- `touch.calibrationRequired`: optional boolean that makes the setup process start with the touch calibration. Only works together with `touch.calibrationSupported`. Defaults to `false`.

## cdn

- `cdn.warningMessage`: optional warning message for the device in the CDN (App Hub) metadata.
- `cdn.infoMessage`: optional info message for the device in the CDN (App Hub) metadata.

## sdkconfig

Any property that starts with `sdkconfig.` is copied directly into the `sdkconfig` file by `device.py`. What follows the prefix is written as it is, so it must be the full option name, starting with `CONFIG_` (for example `sdkconfig.CONFIG_LWIP_MAX_SOCKETS=4`). An option without that prefix is ignored by ESP-IDF.

For example, this `device.properties`:

```properties
sdkconfig.CONFIG_ESP_HOSTED_USE_MEMPOOL=n
```

becomes the following `sdkconfig`:

```properties
CONFIG_ESP_HOSTED_USE_MEMPOOL=n
```

### Disabling the languages

Tactility has French, Dutch, Spanish and German translations built in, which take about 90 KiB of flash. A device with a small app partition can leave them out:

```properties
sdkconfig.CONFIG_TT_LANGUAGE_SELECTION=n
```

The firmware is then English only: no translations are embedded, the Language settings app isn't available, the setup has no language page and the language setting is not applied, so apps with translations of their own also stay English.
