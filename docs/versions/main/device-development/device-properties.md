# Device Properties

This page describes how the file format for a `device.properties` file.

It uses the [properties file format](https://en.wikipedia.org/wiki/.properties) and contains sections named like `[section]`

Below you will find the documentation for the various sections.

If a property value is a boolean, then it must be the string literal `true` or `false`. This is case-sensitive. 

## general

- `general.vendor`: required text value representing the vendor of the device. If there is no company name, then it can be left empty or set to the same name as the device name (e.g. "LilyGO", "", "unPhone")
- `general.name`: required text value representing the device name (e.g. "T-Deck")
- `general.incubating`: optional boolean used for marking devices as in-development and/or having issues in their implementation (defaults to `false`)

## hardware

- `hardware.target`: required text value representing hardware target. Currently supporting `ESP32`, `ESP32S3`, `ESP32C6` and `ESP32P4`.
- `hardware.flashSize`: required text value representing flash ROM size (e.g. `16MB`)
- `hardware.spiRam`: required text value representing SPIRAM availability setting (boolean)
- `hardware.spiRamMode`: required text value representing SPIRAM mode (e.g. `OCT`, `QUAD`)
- `hardware.spiRamSpeed`: required text value representing SPIRAM frequency in Hz (e.g. `80M`, `120M` - don't add spaces and always use upper-case `M`)
- `hardware.tinyUsb`: optional boolean representing tinyUSB feature setting boolean (only works on ESP32 S2, S3, P4 and H4)
- `hardware.esptoolFlashFreq`: optional text value representing flash frequency for esptool (e.g. `120M`) - this fixes some compile errors on devices
- `hardware.fixRgbDisplayGlitch`: optional boolean to enable a performance boost by setting `CONFIG_ESP32S3_DATA_CACHE_LINE_64B=y`
- `hardware.bluetooth`: optional boolean to enable Bluetooth (NimBLE) support (`CONFIG_BT_ENABLED`, `CONFIG_BT_NIMBLE_ENABLED`)
- `hardware.usbHostEnabled`: optional boolean to enable USB host support (hubs, mass storage, etc.)

## storage

- `storage.userDataLocation`: set to either "SD" or "Internal"

## display

- `display.size`: required text value representing physical display size e.g. `1.47"` (must include `"`)
- `display.shape`: required text value representing physical display shape (e.g. `rectangle` or `circle`)
- `display.dpi`: required integer value representing dots-per-inch (e.g. `247`)

## lvgl

- `lvgl.colorDepth`: required integer value representing the amount of bits per pixel (e.g. `16`)
- `lvgl.theme`: optional text value representing the theme name (e.g. `Mono`, `DefaultDark`, `DefaultLight`)
- `lvgl.fontSize`: optional size value (defaults to `14`)
- `lvgl.dpi`: optional override for `[display]`'s `dpi` setting. This changes the way LVGL scales its widgets.
- `lvgl.uiDensity`: optional, decides how closely the widgets are put together. Set to `default` or `compact`. Defaults to `default`.

## cdn
- `cdn.warningMessage`: optional, adds warning message to CDN (App Hub) metadata
- `cdn.infoMessage`: optional, adds info message to CDN (App Hub) metadata

## sdkconfig

Any property that is prefixed with `sdkconfig.` is copied directly into the `sdkconfig` file by `device.py`.

For example, this `device.properties`:

```properties
sdkconfig.CONFIG_ESP_HOSTED_USE_MEMPOOL=n
```

becomes the following `sdkconfig`:

```properties
CONFIG_ESP_HOSTED_USE_MEMPOOL=n
```

