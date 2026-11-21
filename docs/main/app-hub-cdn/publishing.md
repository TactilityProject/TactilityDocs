# App Hub CDN - Publishing

[TactilityAppPublisher](https://github.com/TactilityProject/TactilityAppPublisher) is a reusable GitHub workflow with a command line tool. A project only needs a small workflow of its own.

## Requirements

- An `Apps/` folder with one folder per app, each with a `manifest.properties` (see [Fundamentals](../app-development/fundamentals.md#package-properties)).
- A `tt.py` in the root of the project.
- Every app has `description.short` (at most 32 characters) in its manifest.
- All apps target the same SDK version.

## Add it to a project

Create `.github/workflows/main.yml`:

```yaml
name: Main
on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  apps:
    uses: TactilityProject/TactilityAppPublisher/.github/workflows/publish.yml@main
    with:
      target: both          # s3, pages or both
    permissions:
      contents: read
      pages: write          # GitHub needs these two, also when target is s3
      id-token: write
    secrets: inherit        # S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY, only for s3 or both
```

Pull requests build the apps and check their versions. Pushes to `main` also publish.

### Options

Set them under `with:`.

| Option | Default | |
|--------|---------|---|
| `target` | `s3` | `s3`, `pages` or `both` |
| `apps_dir` | `Apps` | The folder with the apps |
| `tt_path` | `tt.py` | The `tt.py` of the project, relative to its root |
| `esp_idf_version` | `v6.1` | The ESP-IDF version to build with |
| `publish_ref` | `refs/heads/main` | The ref that publishes. Other refs only build. |
| `warm_cache_app` | | An app that targets every ESP32 platform. It's built first to fill the compiler cache that the other builds use. |
| `bucket`, `prefix` | `tactility`, `apps` | The bucket and folder, and the folder in the GitHub Pages site |
| `endpoint_url`, `region` | empty, `auto` | The S3 service, see below |

### Publish to an S3 compatible bucket

The `s3` target uploads with `boto3`, so it works with services that have an S3 compatible API, such as AWS S3, Cloudflare R2, Backblaze B2, DigitalOcean Spaces, Wasabi, MinIO and Hetzner Object Storage.
**It has only been tested with Cloudflare R2.** Other services should work, but they have not been tried. Other storage APIs (Azure Blob, Bunny Storage and so on) are not supported.

Add these secrets to the repository:

- `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`: an access key with write access to the bucket

Set `endpoint_url` under `with:` to the endpoint of the service. Without it the upload goes to AWS S3. Set `region` when the service needs one (R2 uses `auto`, the default).

The secrets of the first version still work: `CDN_TOKEN_NAME` and `CDN_TOKEN_VALUE` are the access key, and when there is no endpoint, `CDN_ID` (the Cloudflare account id) gives the R2 endpoint `https://<CDN_ID>.r2.cloudflarestorage.com`.

The files go to `<prefix>/<sdk version>/` in the bucket. The packages, details and icons are uploaded first and the index files last, so a list never points at a file that isn't online yet. The bucket has to serve its files publicly, for example through a CDN or a public bucket URL.

### Publish to GitHub Pages

Set Settings > Pages > Source of the repository to "GitHub Actions". The site gets the files in `<prefix>/<sdk version>/`, the same layout as the bucket. A deployment replaces the whole site, so it only has the apps of the SDK version of the latest build.

### Versions of the publisher

The workflow and its actions are used at `@main`. A change of the publisher applies to every project that uses it. Fork the repository and change the `@main` of the workflow and its actions to pin a version.

## Run it locally

Use Python 3.11 or newer. Only the S3 upload needs `pip install boto3`. TactilityApps has the publisher as a git submodule, so run `git submodule update --init` there.

```
python apppublisher.py matrix [--apps-dir Apps]
python apppublisher.py check-versions [base-ref] [--apps-dir Apps]
python apppublisher.py bump major|minor|patch [--apps-dir Apps]
python apppublisher.py release <folder with .app files>
python apppublisher.py publish s3 <folder> --sdk <version> [--endpoint-url <url>] [--region <region>]
python apppublisher.py publish pages <folder> --sdk <version> --out <site folder>
```

| Command | |
|---------|---|
| `matrix` | Prints the GitHub Actions matrix with the apps of the project |
| `check-versions` | Fails when a changed app has no higher `version.code` or no other `version.name` than on the base ref |
| `bump` | Bumps `version.name` and raises `version.code` of every app |
| `release` | Renames the packages to `<id>-<version code>.app` and generates the catalog files next to them. It runs in a git repository, because it stores the commit hash. It writes the SDK version of the apps to `sdk_version.txt` (`--sdk-version-file` changes where). |
| `publish s3` | Uploads the folder to the bucket. It reads `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and optionally `S3_ENDPOINT_URL` from the environment. `--bucket`, `--prefix`, `--endpoint-url`, `--region` and `--index-only` are optional. |
| `publish pages` | Copies the folder to a site folder, ready for GitHub Pages |

To check the result by hand, release and publish to a site folder and serve it:

```
python apppublisher.py release release_files
python apppublisher.py publish pages release_files --sdk 0.8.0 --out site
python -m http.server --directory site
```

## Catalog data

The catalog takes everything from each package's `manifest.properties` and from the `icon.svg` and `icon_mono.svg` in the package. A package without icons is listed without one.

The publisher fails when `description.short` is missing or too long, when a package has no readable manifest, or when the apps target different SDK versions.

## Using another host

Any host works that serves the files over HTTPS with a certificate that the device accepts:

- Serve `.json` files as `application/json` and `.svg` as `image/svg+xml`.
- Keep the packages of old versions online: a device with an older cached list can still install from it.
- Don't change a published file except for the lists. Raise the version code instead.

The firmware has the catalog URL compiled in, so a device only uses another host after the firmware was changed.
