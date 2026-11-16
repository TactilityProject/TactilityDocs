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

The catalog uses [HATEOAS](https://en.wikipedia.org/wiki/HATEOAS): a client starts at one URL and follows links, instead of building the URLs of other files itself.

1. The device downloads `list-<platform>-1.json`. The list has a small entry for each app: just enough to show it in a list.
2. When a list has a `next` link, the device downloads that page too, until a page has no `next`.
3. When the user opens an app, the device downloads the app's details file, and its icon.
4. When the user installs an app, the details file names the package to download.

Lists are small on purpose: a page has at most 20 apps, so a device with little memory can read one page at a time.

All links are relative to the folder of the file that contains them, and must stay inside the folder. A link that is absolute, starts with `/`, or contains `..` or `:` is rejected.
