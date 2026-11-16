# App Hub CDN - Overview

The App Hub app finds, installs and updates apps from an online catalog. The catalog is a set of static files on a CDN (any web server that serves files over HTTPS). There is no server-side logic: a script generates the files from the app packages, and an uploader puts them online.

This section describes the files, so you can host a catalog of your own.

- [Files and Formats](formats.md): every file in the catalog and what's in it
- [Publishing](publishing.md): generating and uploading the files
- [Device Behaviour](device-behaviour.md): how the firmware reads the catalog

## Folder layout

All files of one Tactility version sit in one folder. The folder is named after the firmware version without its postfix (firmware `0.8.0-dev` uses `0.8.0`). A device only reads the folder of its own version, so a new Tactility version can start with a new catalog.

```
<base url>/<version>/
├── apps.json                       list of all apps, old format
├── index.json                      first page of the list of all apps
├── list_2.json, list_3.json, ...   next pages of the list of all apps
├── list-esp32s3-1.json             first page of the list for one platform
├── list-esp32s3-2.json, ...        next pages for that platform
├── tactility.clock.json            details of one app
├── tactility.clock-icon.svg        colour icon of one app
├── tactility.clock-icon-mono.svg   monochrome icon of one app
└── tactility.clock-12.app          the package, named <id>-<version code>.app
```

The official catalog is at `https://cdn.tactilityproject.org/apps/<version>/`.

## How the files link together

The files don't link to each other, to keep them small. A client works out the names of the files it needs: the pages of a list are numbered up to the `pageCount` in the list, and the files of an app are named after its id.

1. The device downloads `list-<platform>-1.json`. The list has a small entry for each app: just enough to show it in a list.
2. The first page has the `pageCount`. The device downloads the pages `2` up to `pageCount` as well.
3. When the user opens an app, the device downloads the app's details file, named after its id. Its icons are named after its id as well.
4. When the user installs an app, the details file names the package to download.

Lists are small on purpose: a page has at most 20 apps, so a device with little memory can read one page at a time.
