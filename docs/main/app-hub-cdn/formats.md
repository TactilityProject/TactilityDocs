# App Hub CDN - Files and Formats

All files are UTF-8 JSON, except for the icons (SVG) and the packages (`.app`).

## List pages

`index.json` and `list_<number>.json` list all apps. `list-<platform>-<number>.json` lists the apps that support one platform, where `<platform>` is a name from the packages' `target.platforms` (e.g. `esp32s3`). An app without target platforms supports every platform and is in every platform list.

The simulator reports `linux-` or `macos-` followed by the CPU architecture. Lists for `linux-x86_64`, `linux-aarch64`, `macos-arm64` and `macos-x86_64` are always published, also when no app targets them. A device that finds no list for its platform finds no apps.

Apps are sorted by name. A page holds 20 apps. Page numbers start at 1: `index.json` is the first page of all apps and `list-esp32s3-1.json` is the first page for `esp32s3`.

```json
{
  "sdkVersion": "0.8.0",
  "created": "2026-11-16T07:02:25Z",
  "gitCommit": "199a81f371eb9c60edb113729637384e8e1727ee",
  "arch": "esp32s3",
  "page": 1,
  "pageCount": 2,
  "appCount": 33,
  "apps": [
    {
      "id": "tactility.clock",
      "name": "Clock",
      "version": 25,
      "description": "Digital and analog clock"
    }
  ]
}
```

- `arch` is only in the lists of a platform.
- `page` is the number of this page and `pageCount` the number of the last one. A page has no links: the next page is the file with the next number, so `list-esp32s3-1.json` is followed by `list-esp32s3-2.json`, up to `pageCount`.
- `description` is the short description, at most 32 characters. The details have the full one.
- `icon` is optional. It is `false` when the app has no icon, and is left out otherwise, so a client assumes that an app has an icon unless the list says it hasn't.
- `version` is the version code, an integer. The list has no version name, the details have it. A device offers an update when the catalog's code is higher than the installed one.
- Lists have no links at all, to keep them small. The names of an app's files follow from its id: `<id>.json` for the details and `<id>-<version>-icon.svg` and `<id>-<version>-icon-mono.svg` for the icons, where `<version>` is the version code from the list.

A client must read `id`, `name`, `version` and `description` of every app, and `icon` when it's there, and the `pageCount` of the list. It ignores everything else.

## Details

`<appId>.json` has everything about one app that a list leaves out:

```json
{
  "appId": "tactility.clock",
  "appVersionName": "0.25.0",
  "appVersionCode": 25,
  "appName": "Clock",
  "appDescription": "Digital and analog clock.\n\nSwitch between the two faces...",
  "shortDescription": "Digital and analog clock",
  "targetSdk": "0.8.0-dev",
  "targetPlatforms": ["esp32", "esp32s3"],
  "requiresDeviceId": [],
  "requiresRam": 0,
  "file": "tactility.clock-25.app"
}
```

- `appDescription`: the full description. `\n` is a line break.
- `targetSdk`: the SDK version the package was built for. The device checks it like it does for a package that's installed from a file.
- `targetPlatforms`: the platforms the package has binaries for. An empty list means every platform.
- `requiresDeviceId`: device ids the app is restricted to. An empty list or an absent key means no restriction.
- `requiresRam`: megabytes of RAM that the app needs. 0 or absent means no requirement.
- `file`: the package, relative to the folder.

The device checks `targetSdk`, `targetPlatforms`, `requiresDeviceId` and `requiresRam` against itself before it installs, and marks the app as not compatible when one doesn't match.

## Icons

`<appId>-<version code>-icon.svg` is the colour icon and `<appId>-<version code>-icon-mono.svg` the monochrome one. The version code is in the name, so an icon never changes after it's published, and a cache can't keep the icon of an older version. They are the `icon.svg` and `icon_mono.svg` files from the package. See [Icons](../app-development/icons.md) for what they should look like.

Both are optional. A device downloads the variant that suits its theme and uses the other one when that is missing. Devices without enough memory, and devices with a very compact layout, don't download icons at all.

## Package

`<appId>-<version code>.app` is the package that `tt app build` makes. The version code is in the name, so a new version never replaces a file that a device might still be downloading.

## apps.json

`apps.json` is the format that older firmware reads: one file with every app, and without paging.

```json
{
  "sdkVersion": "0.8.0",
  "created": "2026-11-16T07:02:25Z",
  "gitCommit": "199a81f...",
  "apps": [
    {
      "appId": "tactility.clock",
      "appVersionName": "0.25.0",
      "appVersionCode": 25,
      "appName": "Clock",
      "appDescription": "Digital and analog clock",
      "targetSdk": "0.8.0-dev",
      "targetPlatforms": ["esp32", "esp32s3"],
      "requiresDeviceId": [],
      "requiresRam": 0,
      "file": "tactility.clock-25.app"
    }
  ]
}
```

Its `appDescription` is the short description. Current firmware doesn't read this file. Publish it for as long as older firmware needs to find apps.
