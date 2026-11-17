# Localisation

Apps can show their text in the language that the user picked in **Settings → Language**. It works for every kind of app: GUI, terminal and headless. The localisation API doesn't depend on LVGL.

Texts are keyed by their English text, like gettext. A text without a translation shows as written, so an app works without any translation files.

## Workflow overview

1. **Mark texts.** The developer wraps English texts in `tr()` and `trc()`.
2. **Extract.** The developer runs `./tt app translations` to create `translations/messages.pot`, the template with all texts.
3. **Create a language file.** Copy `messages.pot` to `translations/<locale>.po` (such as `nl-NL.po`), or let your editor create it from the template.
4. **Translate.** Fill in the `msgstr` value of each entry. Keep placeholders, and use the context lines to pick the right meaning.
5. **Validate.** Check the file with your editor or a command line tool. Resolve fuzzy entries and placeholder mismatches.
6. **Submit.** Send the `.po` file to the developer, or open a pull request. With an online platform, the platform exports it.
7. **Build.** `tt app build` compiles each `.po` file into `assets/lang/<locale>.tlc` in the app package.
8. **Test.** Select the language in **Settings → Language** and check the app for text that is cut off or reads wrong.
9. **Update.** When the code changes, the developer runs `./tt app translations` again. Merge the new template into each `.po` file (for example with Poedit or `msgmerge`) and translate the new entries.

## Internal and external apps

Where the translations live depends on the kind of app (see [Fundamentals](fundamentals.md)):

| | External app | Internal app |
|---|---|---|
| Location | `translations/<locale>.po` in the app project | `Translations/<domain>/<locale>.po` in the Tactility repository |
| Domain | Opened by the app with `localisation_domain_open()` | A subproject named after the app, e.g. `Translations/setup/` |
| Template | `./tt app translations` | `python Buildscripts/TactilitySDK/Tools/extract_texts.py <source-folder>... > messages.pot` |
| Compiled by | `tt app build`, into `assets/lang/<locale>.tlc` in the `.app` package | The firmware build (`Buildscripts/l10n/generate-catalogs.py`), embedded in the firmware |

An internal app needs its own domain folder in `Translations/`, with one `.po` file per language. In the app's source, define the folder name and include the domain header before anything that includes `<localisation/tr.h>`:

```cpp
#define L10N_APP "display"
#include <Tactility/i18n/AppDomain.h>
```

The domain is opened on first use. Use `tr_noop("text")` for texts in constant tables and `tr(table[i])` where they are shown.

Texts that several internal apps share ("Brightness", "Never", colour names) belong in the `tactility` domain. An app's domain falls back to it, as an external app's domain does. Tactility's own texts are in `Translations/tactility/<locale>.po`.

## Translating text

Include `<localisation/tr.h>` and wrap each English text in `tr()`:

```c
#include <localisation/tr.h>

printf("%s\n", tr("Hello"));
lv_label_set_text(label, tr("Delete"));
```

Rules for texts that are translated:

- Pass a string literal, so the text can be found by the extraction tool.
- Don't build sentences from pieces. Put `{}` or `%s` placeholders in the text, so a translation can change the word order:
  ```c
  snprintf(buffer, sizeof(buffer), tr("Delete %s?"), name);
  ```
- Use `trc("context", "text")` when one English word has more than one meaning, such as `trc("verb", "Open")` and `trc("adjective", "Open")`.

Common words like "OK", "Yes", "No", "Cancel" and "Close" are translated by Tactility itself, so you only need to translate your own texts.

## Opening your translations

Translations are a *domain* that belongs to your app. Open it once, in your app's own task (it reads a file), before the UI is created:

```c
static struct L10nDomain* app_domain;
#define L10N_DOMAIN app_domain   // before including tr.h
#include <localisation/tr.h>

char directory[256];
if (app_paths_get_assets_path("com.example.myapp", "lang", directory, sizeof(directory)) == ERROR_NONE) {
    localisation_domain_open(directory, &app_domain);
}

// ...

localisation_domain_close(app_domain);
```

Without `L10N_DOMAIN`, `tr()` only uses Tactility's own translations. `tr()` looks in your domain first and then in Tactility's.

`localisation_domain_open()` doesn't fail when there are no translations for the current language.

## Translation files

Put one standard PO file per language in `translations/` in your project root:

```
MyApp/
├── manifest.properties
├── translations/
│   ├── nl-NL.po
│   └── fr-FR.po
└── ...
```

The file name is the locale, e.g. `nl-NL.po`. A language file such as `nl.po` is used for every region of that language when there is no exact match.

`tt app build` compiles each file into the package as `assets/lang/<locale>.tlc`, which is the folder the code above opens. Entries that are marked fuzzy or have an empty translation are skipped.

PO files can be edited with a text editor or with a tool like Poedit. To list the texts of your code as a template for a new language, run:

```
./tt app translations
```

It writes `translations/messages.pot` with every `tr()` and `trc()` text of the project (the `build` folders are skipped). Copy it to `translations/<locale>.po` and fill in the `msgstr` values, or let a tool like Poedit create the `.po` file from it and update it later.

## For translators

Translators don't need to build an app or write code. A translation is a `.po` file, so any tool that edits PO files works. The tools below are common choices.

### Desktop editors

| Tool | Platforms | Notes |
|---|---|---|
| [Poedit](https://poedit.net) | Windows, macOS, Linux | Most popular PO editor. Creates a `.po` file from a `.pot` template and updates it when the template changes. |
| [Lokalize](https://apps.kde.org/lokalize/) | Linux (KDE), Windows | Translation memory, glossary and spell checking. |
| [Gtranslator](https://wiki.gnome.org/Apps/Gtranslator) | Linux (GNOME) | Simple editor with translation memory. |
| [OmegaT](https://omegat.org) | Windows, macOS, Linux | Java-based CAT tool, useful for large projects and shared glossaries. |
| [VS Code](https://code.visualstudio.com) with a gettext/PO extension | Windows, macOS, Linux | For translators who already use a code editor. |
| Any text editor | All | A PO file is plain UTF-8 text. Edit the `msgstr` lines by hand. |

### Online platforms

These run in a browser, so they work on every platform, including phones and tablets, and ChromeOS. They import and export PO files.

| Tool | Notes |
|---|---|
| [Weblate](https://weblate.org) | Open source. Hosted, or self-hosted. Connects to a Git repository. |
| [Crowdin](https://crowdin.com) | Free for open source projects. |
| [Transifex](https://www.transifex.com) | Hosted platform with translation memory. |
| [POEditor](https://poeditor.com) | Simple hosted editor. |

### Command line tools

| Tool | Platforms | Notes |
|---|---|---|
| [GNU gettext](https://www.gnu.org/software/gettext/) (`msgmerge`, `msgfmt`, `msgcat`) | Linux, macOS (Homebrew), Windows (MSYS2 or WSL) | Update a `.po` file from a new `.pot` and validate it with `msgfmt --check`. |
| [Translate Toolkit](https://toolkit.translatehouse.org) (`pofilter`, `pocount`) | Windows, macOS, Linux (Python) | Checks for mistakes and counts untranslated texts. |

Every platform has at least one editor above. Poedit covers Windows, macOS and Linux, and a browser-based platform covers the rest.

### Tips

- Keep placeholders such as `{}`, `%s` and `%d` exactly as in the English text. You can move them to fit the word order of your language.
- Save the file as UTF-8, and name it after the locale, such as `nl-NL.po`.
- Don't leave entries fuzzy. Fuzzy entries and empty translations are skipped when the app is built, so the English text is shown instead.
- Use the `msgctxt` line to see which meaning an English word has.

## Changing the language

The language is a system setting. An app that is already running keeps the text it has shown. Open a new window to get the new language.

To follow the language while running, register a listener. It is called on the task that changed the language, so signal your own task from it, and don't update LVGL from it:

```c
void on_locale_changed(void* context);
localisation_add_locale_listener(on_locale_changed, context);
localisation_remove_locale_listener(on_locale_changed, context);
```

The text that `tr()` returns is valid until the language changes twice or the domain is closed. Use it right away, e.g. LVGL labels copy it.

## API

| Function | Description |
|---|---|
| `localisation_domain_open(directory, &domain)` | Opens the translations of an app. Reads a file. |
| `localisation_domain_close(domain)` | Closes the domain. |
| `localisation_get(domain, text)` / `tr(text)` | The translation, or `text` when there is none. |
| `localisation_get_ctx(domain, context, text)` / `trc(context, text)` | The same, for a text with a context. |
| `localisation_get_locale(buffer, size)` | The current locale, such as `nl-NL`. |
| `localisation_add_locale_listener()` / `localisation_remove_locale_listener()` | Get a call when the language changes. |

The module is `localisation-module`, so apps need an SDK that includes it. An app that uses it doesn't run on firmware without it.

## Translating Tactility

To add a language to Tactility itself, or to translate an internal app, see `Translations/README.md` in the Tactility repository. A new language needs a `.po` file in each domain folder and an entry in the language table of the Language settings app.
