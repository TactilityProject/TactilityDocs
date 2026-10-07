# Filesystems

The kernel keeps a list of filesystems (`<tactility/filesystem/file_system.h>`): every storage that can hold files, like the internal flash partitions and SD cards. Drivers register them, and the rest of the system finds them by name or owner, and asks for their mount path.

## Registered filesystems

| Name | Path | Registered by |
|---|---|---|
| `system` | `/system` | The ESP32 platform: the read-only system partition |
| `data` | `/data` | The ESP32 platform: the internal data partition |
| `sdcard` | `/sdcard` | SD card drivers (`esp32_sdspi`, `esp32_sdmmc`), when a card is mounted |

On the simulator, the POSIX platform registers folders on your computer instead: `system` and `data` (the `Data/system` and `Data/data` folders of the repository), and `root` for your computer's `/`.

The internal partitions and SD cards use FAT. Files are accessed with the regular C and POSIX functions (`fopen()`, `stat()`, `opendir()`, etc.), through ESP-IDF's virtual filesystem.

## The data root

User data (settings, installed apps, app data) is stored on the device's data root: the SD card or the internal data partition, depending on the device's `storage.userDataLocation` property. Use `<tactility/paths.h>` to find it instead of hardcoding a path:

- `paths_get_data_root_path()`: the root of the storage (e.g. `/sdcard`)
- `paths_get_data_path()`: Tactility's folder on it (`<root>/tactility`), which survives OS updates
- `paths_get_temp_path()`: a folder for temporary files

They return `ERROR_NOT_FOUND` when the storage isn't available, e.g. when the SD card isn't inserted.

Apps use `<app/paths.h>` instead, which gives each app its own folders (see [Storage and Settings](app-development/storage.md)).

## Adding a filesystem

A driver that provides storage registers it with an API for mounting:

```c
static const struct FileSystemApi my_fs_api = {
    .mount = my_mount,
    .unmount = my_unmount,
    .is_mounted = my_is_mounted,
    .get_path = my_get_path,
};

struct FileSystem* fs = file_system_add("sdcard", &my_fs_api, my_data);
file_system_set_owner(fs, device);
```

- `file_system_set_owner()` links the filesystem to the device that provides it, so others can find the storage of a specific device.
- Call `file_system_remove()` when the device stops, e.g. when an SD card is removed.

## Finding filesystems

- `file_system_find_by_name("sdcard")` finds a filesystem by name.
- `file_system_for_each()` and `file_system_for_each_mounted()` visit all filesystems.
- `file_system_get_path()` returns the mount path, and `file_system_is_mounted()` whether it's mounted.

## File helpers

`<tactility/filesystem/fs.h>` has helpers for firmware code that works with absolute paths: `path_exists()`, `directory_exists()`, `file_read_binary()`, `directory_list()`, `directory_make()` (with parent folders), `file_copy()`, `file_move()`, `file_remove()`, `directory_remove()`, `directory_remove_tree()`, `file_touch()` and `path_tree_size()`.
