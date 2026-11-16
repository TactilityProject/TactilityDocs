# App Hub CDN - Publishing

The catalog is generated from `.app` packages. [TactilityApps](https://github.com/TactilityProject/TactilityApps) has the scripts that the official catalog uses. They're a good starting point for your own.

## Manifest properties

The catalog takes everything from each package's `manifest.properties` (see [Fundamentals](../app-development/fundamentals.md#package-properties)):

| Manifest property | Catalog |
|-------------------|---------|
| `id` | `id` in the lists, `appId` in the details, and the names of the details, icon and package files |
| `name` | `name` in the lists, `appName` in the details |
| `version.name` | `appVersionName` of the details file |
| `version.code` | `version` in the lists, `appVersionCode` in the details |
| `description` | `appDescription` of the details file |
| `description.short` | `description` in the lists, `shortDescription` in the details: required, at most 32 characters |
| `target.sdk` | `targetSdk` |
| `target.platforms` | `targetPlatforms`, and which platform lists the app is in |
| `requires.device.id`, `requires.ram` | `requiresDeviceId`, `requiresRam` |

The package's `icon.svg` and `icon_mono.svg` are copied to the catalog.

## Generating the files

`Scripts/release.py <folder>` generates the files in a folder with `.app` packages:

1. Reads the manifest and the icons from every package.
2. Checks that all packages target the same SDK version. That version names the CDN folder (`sdk_version.txt` has it).
3. Renames each package to `<id>-<version code>.app`.
4. Writes the details file and the icons of each app.
5. Writes `apps.json`, the lists of all apps (`index.json`, `list_2.json`, ...) and the list of every platform that an app targets and of every simulator platform (`list-<platform>-<number>.json`). The simulator platforms are in `SIMULATOR_PLATFORMS` of the script.

It fails when `description.short` is missing or too long.

## Uploading

`Scripts/upload-app-files.py <folder> <sdkVersion> <account> <token name> <token value>` uploads the folder to the `apps/<sdkVersion>/` path of the official storage bucket. It uploads the packages, details and icons first and the `apps.json` and list files last, so a list never links to a file that isn't online yet.

For your own CDN, change the target of the uploader to your own storage or web server. The only requirement is that the files are reachable by URL, in the layout of the [overview](overview.md).

## Checklist for your own CDN

- Serve the files over HTTPS with a certificate that the device can verify (see [Device Behaviour](device-behaviour.md)).
- Serve `.json` files as `application/json` and `.svg` as `image/svg+xml`.
- Publish a new version's files before you publish the lists that link to them.
- Keep the old versions' packages online: a device that has an older list cached can still install from it.
- Don't change a file after you published it, except for the lists. Raise the version code instead.
