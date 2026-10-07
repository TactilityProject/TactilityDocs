# Licenses & Copyrights

## Overview

Tactility mixes licenses per subproject. A license file inside a folder applies to all files and folders it contains, down to the next folder that has its own license file.

The intentions behind the licenses:
1. Forks of the whole Tactility firmware must stay open source: the main firmware project (`Tactility/`) is licensed under the GPL v3.0.
2. External apps built with the TactilitySDK can be closed source: the SDK only contains subprojects without a GPL license.
3. Closed-source forks that only contain TactilityKernel, the platforms and (most of) the devices and drivers are possible.

| Project | License |
|---|---|
| `Tactility/` | GNU General Public License v3.0 |
| `TactilityKernel/` | Apache License v2.0 |
| `TactilityKernelCpp/` | Apache License v2.0 |
| `TactilityFreeRtos/` | Apache License v2.0 |
| `Platforms/` | Apache License v2.0 |
| `Modules/*` | Apache License v2.0 |
| `Devices/*` | Apache License v2.0, except `lilygo-thmi` (GPL v3.0) |
| `Drivers/*` | Apache License v2.0, except `gps-meshtastic-module` (GPL v3.0) |
| `Buildscripts/DevicetreeCompiler/` | Apache License v2.0 |
| `Translations/` | Apache License v2.0 |
| `Tests/` | (varies) |
| `Libraries/*` | Third-party: each library has its own license |

Historically, internal subprojects used the GPL v3.0, while subprojects meant to be linked into external apps used the Apache License v2.0. New subprojects use the Apache License v2.0. Existing GPL subprojects keep their license, unless all their authors agree to a change, or the code is rewritten from scratch.

**Make sure you double-check the license of each subproject** if you intend to make a derived project that isn't offered under the GPL. See [LICENSE.md](https://github.com/TactilityProject/Tactility/blob/main/LICENSE.md) in the main repository for the authoritative overview, and [THIRD-PARTY-NOTICES.md](https://github.com/TactilityProject/Tactility/blob/main/THIRD-PARTY-NOTICES.md) for the third-party licenses and copyrights bundled with Tactility.

## TactilitySDK

The TactilitySDK (used to build external apps) contains TactilityKernel, TactilityFreeRtos and a selection of `Modules/` (e.g. `app-module`, `lvgl-module` and `service-module`), all under the Apache License v2.0. It also includes third-party libraries, like LVGL (MIT), with their own licenses.

## Third-party software

Tactility includes third-party software, each under its own license. For example:

| Software | Used for |
|---|---|
| [LVGL](https://lvgl.io) | The user interface library |
| [FreeRTOS](https://www.freertos.org) | The real-time operating system kernel |
| [ESP-IDF](https://github.com/espressif/esp-idf) | The ESP32 platform |
| [Mbed TLS](https://github.com/Mbed-TLS/mbedtls) | Cryptography and TLS |
| [cJSON](https://github.com/DaveGamble/cJSON), [minmea](https://github.com/kosma/minmea), [QRCode](https://github.com/ricmoo/QRCode) | JSON, GPS and QR code parsing and generation |
| [SDL](https://www.libsdl.org) | The simulator's display and input |
| [Adwaita fonts](https://gitlab.gnome.org/GNOME/adwaita-fonts) | The text fonts |
| [Material Symbols](https://fonts.google.com/icons) | The icons |

See [THIRD-PARTY-NOTICES.md](https://github.com/TactilityProject/Tactility/blob/main/THIRD-PARTY-NOTICES.md) and the license files in `Libraries/` for the full list.

## Logo

The Tactility logo copyrights are owned by Ken Van Hoeylandt.

Logo usage is permitted for:
- News, blog posts, articles and documentation that write about the official Tactility project.
- Software that is built with unmodified source code from [the official repository](https://github.com/TactilityProject/Tactility), which can be redistributed with the Tactility logo.
- Personal use for local builds that contain Tactility source code (original or modified) and aren't redistributed online.

Logo usage is forbidden in all other scenarios unless an exception was granted by the author. For other usages or exceptions, [contact me](https://kenvanhoeylandt.net).

Practical examples:
- A blog post about Tactility can use screenshots and the logo itself.
- A developer who forked Tactility to contribute features or fixes to the official repository may make builds with the logo, as long as these builds aren't redistributed to end-users.

## FAQ

- Q: Can I build closed-source and/or for-profit applications?
- A: Yes, if you build them as external apps with the TactilitySDK. Apps that are part of the Tactility firmware (internal apps) are licensed under the GPL v3.0.
