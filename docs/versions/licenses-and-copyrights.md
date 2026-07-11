# Licenses & Copyrights

## Overview

Tactility mixes licenses per subproject. A license file inside a folder applies to all files and folders it contains, down to the next folder that has its own license file.

| Project              | License                    |
|-----------------------|-----------------------------|
| Tactility             | GNU General Public License v3.0 |
| TactilityKernel       | Apache License v2.0        |
| TactilityFreeRtos     | Apache License v2.0        |
| TactilityC            | Apache License v2.0        |
| Tests                 | GNU General Public License v3.0 |
| Devices/*             | GNU General Public License v3.0 |
| Drivers/*             | (varies per driver)        |
| Platforms/*           | Apache License v2.0        |
| DevicetreeCompiler    | Apache License v2.0        |

Historically, internal subprojects used GPL v3.0 while subprojects meant to be linked into external apps used Apache License v2.0. Going forward, new internal subprojects use Apache License v2.0 too; existing GPL-licensed projects keep that license, since it can't be relicensed to something more permissive.

See [LICENSE.md](https://github.com/TactilityProject/Tactility/blob/main/LICENSE.md) in the main repository for the authoritative overview, and [THIRD-PARTY-NOTICES.md](https://github.com/TactilityProject/Tactility/blob/main/THIRD-PARTY-NOTICES.md) for third-party licenses and copyrights bundled with Tactility.

## TactilitySDK

The TactilitySDK (used to build external `.app` apps) is distributed under the Apache License v2.0, matching TactilityKernel/TactilityC/TactilityFreeRtos/Platforms, the subprojects it's built from.

## Logo

The Tactility logo copyrights are owned by Ken Van Hoeylandt.

Logo usage is permitted for:
- News, blog posts, articles and documentation that write about the official Tactility project.
- Firmwares built with unmodified source code from [the official repository](https://github.com/TactilityProject/Tactility), which can be redistributed with the Tactility logo.
- Personal use for local builds that contain Tactility source code (original or modified) and aren't redistributed online.

Logo usage is forbidden in all other scenarios unless an exception was granted by the author. For other usages or exceptions, [contact me](https://kenvanhoeylandt.net).

## FAQ

- Q: Can I build closed source and/or for-profit applications?
- A: Yes, but only if you build them as external apps with the TactilitySDK. Internal apps are part of the OS and remain licensed under GPL v3.
