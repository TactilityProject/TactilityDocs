# App Hub CDN - Device Behaviour

How the App Hub service (`app-hub-module`) uses the catalog. This helps when you want to check that your CDN works.

## Refresh

A refresh downloads `list-<platform>-1.json`, reads its `pageCount` and downloads the pages up to it (`list-<platform>-2.json` and so on). The platform is `CONFIG_IDF_TARGET` on ESP32 (e.g. `esp32s3`) and `linux-<cpu>` or `macos-<cpu>` on the simulator (e.g. `linux-x86_64`). Every page's apps are appended to a catalog file in the service's user data folder, one line per app. The old catalog file is only replaced when all pages were downloaded and read, so a failed refresh keeps the previous catalog.

A refresh fails when:
- a page can't be downloaded or isn't valid JSON
- an app of a page lacks `id`, `version`, `name` or `description`
- a page has no valid `pageCount`, or the list has more than 100 pages
- an entry is too long to store (512 bytes in the catalog file)

There is no fallback: when a platform has no list, its devices find no apps.

The catalog file is available offline after the first refresh. The apps in it are shown in the App Hub list, merged with the installed apps.

## Details and icons

- The details file is downloaded when the user opens an app, and when it's installed. It's not cached.
- Icons are downloaded one at a time, in the background, when the list shows. They're cached in the service's user data folder, with the app's version code in the file name, so a new version gets a new icon. An app without an icon is not retried until the next refresh.
- Devices with an ESP32 and without PSRAM don't show or download icons. A theme with a very compact size doesn't either.

## Installing

An install downloads the details file, checks the app is compatible with the device, downloads `file` to the temporary folder, installs it like a package from the Files app, and removes the download.

## Certificate

The base URL is currently compiled into the firmware (`BASE_URL` in `Modules/app-hub-module/source/app_hub_catalog.cpp`). Connections are verified with the certificate set by `app_hub_configure_certificate()`.

To use another CDN you have to change the base URL, and if its certificate isn't signed by the same authority, the certificate.

## Testing a catalog

The `apphub` shell command uses the same service:

```
apphub refresh       download the catalog
apphub search [q]    list the apps
apphub info <id>     show an app and its description
apphub install <id>  install an app
```
