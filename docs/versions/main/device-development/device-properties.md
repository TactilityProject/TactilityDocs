# Device Properties

This page describes how the file format for a `device.properties` file.

It uses the [properties file format](https://en.wikipedia.org/wiki/.properties) and contains sections named like `[section]`

Below you will find the documentation for the various sections.

If a property value is a boolean, then it must be the string literal `true` or `false`. This is case-sensitive. 

## [general]

- `vendor`: required text value representing the vendor of the device. If there is no company name, then it can be left empty or set to the same name as the device name (e.g. "LilyGO", "", "unPhone")
- `name`: required text value representing the device name (e.g. "T-Deck")
- `incubating`: optional boolean used for marking devices as in-development and/or having issues in their implementation (defaults to `false`)

## [hardware]

- `target`: required text value representing hardware target. Currently supporting `ESP32` and `ESP32S3`.
- `flashSize`: required text value representing flash ROM size (e.g. `16MB`)
- `spiRam`: required text value representing SPIRAM availability setting (boolean)
- `spiRamMode`: required text value representing SPIRAM mode (e.g. `OCT`, `QUAD`)
- `spiRamSpeed`: required text value representing SPIRAM frequency in Hz (e.g. `80M`, `120M` - don't add spaces and always use upper-case `M`)
- `tinyUsb`: optional boolean representing tinyUSB feature setting boolean (only works on ESP32 S2, S3, P4 and H4)
- `esptoolFlashFreq`: optional text value representing flash frequency for esptool (e.g. `120M`) - this fixes some compile errors on devices
- `fixRgbDisplayGlitch`: optional boolean to enable a performance boost by setting `CONFIG_ESP32S3_DATA_CACHE_LINE_64B=y`

## [display]

- `size`: required text value representing physical display size e.g. `1.47"` (must include `"`)
- `shape`: required text value representing physical display shape (e.g. `rectangle` or `circle`)
- `dpi`: required integer value representing dots-per-inch (e.g. `247`)

## [lvgl]

- `colorDepth`: required integer value representing the amount of bits per pixel (e.g. `16`)
- `theme`: optional text value representing the theme name (e.g. `Mono`, `DefaultDark`, `DefaultLight`)

## [sdkconfig]

Any property that is put here is copied directly into the `sdkconfig` file by `device.py`.
