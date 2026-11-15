# Localisation

Apps can show their text in the language that the user picked in **Settings → Language**. It works for every kind of app: GUI, terminal and headless. The localisation API doesn't depend on LVGL.

Texts are keyed by their English text, like gettext. A text without a translation shows as written, so an app works without any translation files.

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

Tactility's own texts are in `Translations/tactility/<locale>.po` and are compiled into the firmware. See `Translations/README.md` in the Tactility repository for adding a language.
