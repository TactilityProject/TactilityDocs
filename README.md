This project contains the documentation website at [docs.tactilityproject.org](https://docs.tactilityproject.org).

The pages are markdown files in `docs/`. [Eleventy](https://www.11ty.dev) turns them into static HTML. The setup and the theme are the same as those of the [Tactility website](https://github.com/TactilityProject/TactilityWebsite).

Install the dependencies (Node.js 20 or newer):

```sh
npm install
```

Develop with a local server that reloads on changes:

```sh
npm start
```

Build the site into `_site/`:

```sh
npm run build
```

## Where things are

- `docs/<version>/`: the documentation of one Tactility version, e.g. `docs/main/` and `docs/v0.7.0/`. A page at `docs/main/app-development/ui.md` gets the URL `/main/app-development/ui/`.
- `docs/<version>/index.md`: the start page of a version.
- `docs/<version>/_sidebar.md`: the menu of a version, as a list of links with optional group titles.
- `docs/index.md`: the landing page with the list of versions.
- `docs/*.md`: pages that are shared by all versions (support, licenses).
- `docs/_data/`: site name, community links and navigation.
- `docs/_includes/`: page layouts.
- `docs/assets/`: the stylesheet and the script (menus, copy buttons, search).

## Versions

Every folder in `docs/` that has a `_sidebar.md` is a version. `main` is the development version. The other folders are releases, and the one with the highest number is shown as the latest release.

To add a release, copy `docs/main/` to a folder with the name of the release tag (e.g. `docs/v0.8.0/`). The landing page, the version menu and the search pick it up.

## Writing pages

- A page starts with a `# Title` heading.
- Link to other pages with a path relative to the current file, e.g. `[Simulator](../os-development/simulator.md)` or `[Assets](fundamentals.md#assets)`.
- `{{versionLabel}}` is replaced with the name of the version folder, which is useful for links to a branch or tag on GitHub.
- Alerts: `> [!NOTE]` and `> [!WARNING]` blocks.
- Tabbed card: wrap `::: tab <Title>` blocks in `:::: tabs` ... `::::`.
- Diagrams: a `plantuml` code block is shown as an image, rendered by the PlantUML server.

Pushing to `main` builds and publishes the site with GitHub Actions (`.github/workflows/deploy.yml`). For this, the repository's Pages settings must use "GitHub Actions" as the source.
