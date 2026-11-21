# App Hub CDN - Overview

The App Hub app finds, installs and updates apps from an online catalog. The catalog is a set of static files on a CDN or a web server. You don't write these files yourself: [TactilityAppPublisher](https://github.com/TactilityProject/TactilityAppPublisher) builds your apps, generates the catalog from the packages and publishes it.

It publishes to:

- an S3 compatible bucket, such as Cloudflare R2
- GitHub Pages
- or both

[TactilityApps](https://github.com/TactilityProject/TactilityApps) uses it for the official catalog. It's a good example of a project that uses it.

- [Publishing](publishing.md): add the publisher to your project, its options and its commands

## What it does

For a project with an `Apps/` folder (one folder per app, each with a `manifest.properties`) and a `tt.py`, the publisher:

1. Checks on pull requests that every changed app has a higher `version.code` and another `version.name`.
2. Builds every app with `tt app build`.
3. Bundles the packages and generates the catalog files. All apps must target the same SDK version.
4. Publishes the files when something is pushed to the main branch.

The catalog is published in a folder named after the SDK version without its postfix (SDK `0.8.0-dev` uses `0.8.0`), so a new Tactility version can start with a new catalog.
The official catalog is at `https://cdn.tactilityproject.org/apps/<version>/`.
