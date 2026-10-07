# App Development - Storage and Settings

## Where files live

Tactility mounts its storage under a few paths:

| Path | Contents |
|---|---|
| `/system` | Read-only system files (fonts, built-in assets). Part of the firmware. |
| `/data` | The internal data partition, on devices without an SD card |
| `/sdcard` | The SD card, when the device has one |

Each device stores its user data either on the SD card or in the internal data partition (its `storage.userDataLocation` setting). Don't hardcode `/sdcard` or `/data`: use the path functions below, which pick the right one.

User data (settings, installed apps, app data) is kept in a `tactility/` folder on that storage, so it survives firmware updates.

## Your app's folders

`<app/paths.h>` gives each app two folders, based on its app id:

- **Assets:** the read-only files from your package's `assets/` folder. Don't write here: the folder is replaced when the app is updated.
  ```c
  app_paths_get_assets_path(APP_ID, "logo.png", path, sizeof(path));
  ```
- **User data:** a folder for anything your app writes: settings, save files, caches. It survives app updates.
  ```c
  app_paths_get_user_data_path(APP_ID, "save.dat", path, sizeof(path));
  ```

Both have a `_directory` variant that returns the folder itself. The user data folder isn't created automatically: create it (and any missing parent folders) with `mkdir()` before writing, or use preferences, which create it for you.

Both functions return an `error_t`, e.g. `ERROR_NOT_FOUND` when the storage isn't available (an SD card that isn't inserted), or `ERROR_BUFFER_OVERFLOW` when the path doesn't fit in the buffer.

## Settings

For settings, use preferences (`<tactility/preferences.h>`): a key-value store that is saved as a `.properties` file.

```c
#include <tactility/preferences.h>

char path[256];
if (app_paths_get_user_data_path(APP_ID, "settings.properties", path, sizeof(path)) == ERROR_NONE) {
    Preferences* prefs = preferences_open(path);
    if (prefs != NULL) {
        bool sound = true;
        preferences_opt_bool(prefs, "sound", &sound); // keeps the default when the key is missing
        preferences_put_int32(prefs, "high_score", 1200);
        preferences_close(prefs); // writes the changes
    }
}
```

- `preferences_open()` reads the file into memory, and creates the folder when needed.
- `preferences_opt_*()` read a value: they return `false` and leave the output unchanged when the key doesn't exist, so initialize it with a default first. `preferences_has_*()` checks whether a key exists.
- `preferences_put_*()` change values in memory. **They're only written to the file by `preferences_close()`.**
- Types: `bool`, `int32`, `int64` and strings.

For your own key-value files, `<tactility/properties_file.h>` reads and writes plain `.properties` files with string values.

## Files

Apps can use the regular C and POSIX file functions: `fopen()`, `fread()`, `fwrite()`, `stat()`, `opendir()`, `readdir()`, `mkdir()`, `rename()`, `remove()`, `rmdir()`, etc. Each app instance has its own current directory (`chdir()`, `getcwd()`), so relative paths work like on a computer.

Keep in mind that:
- The internal partition and SD cards use FAT: file names aren't case-sensitive, and there are no symbolic links or file permissions.
- Writing to flash is slow, and wears it out. Don't write files in a tight loop.
- An SD card can be removed at any time. Handle failing file operations gracefully.

See [Filesystems](kernel-concepts/filesystems.md) for how storage is mounted.
