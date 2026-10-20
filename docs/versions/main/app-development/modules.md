# Modules in a Package

A package can contain [kernel modules](kernel-concepts/module.md) next to its apps, or instead of them. A module has no window. It runs in the background and can export functions to apps, like the modules in the firmware do (see [Symbols](app-development/symbols.md)). The web server of the [TactilityApps](https://github.com/TactilityProject/TactilityApps) project is an example: its module serves the pages and its app changes the settings.

## Manifest

Each module has a `module.<index>.binary` property in `manifest.properties`, numbered from `0` without gaps, like the apps:

```properties
manifest.version=0.3
target.sdk=0.8.0
target.platforms=esp32,esp32s3,esp32c6,esp32p4
id=example.server
version.name=0.1.0
version.code=1
app.0.id=example.server
app.0.name=Server
app.0.binary=server
module.0.binary=server-module
```

- `module.<index>.binary`: the name of the module's binary, without extension. It's installed as `bin/<platform>/<binary>.elf`, like the binary of an app.
- A package needs at least one app or one module. A package with only modules has no `app.0.*` block.
- When the package has more than one binary in total, apps and modules together, each one is built from its own subdirectory, named after its `binary`.

`tt app run` needs an app, so it stops with an error for a package that only has modules. `tt app bir` installs it and skips the run step.

## Entry point

The binary of a module has a `main()` like an app, but it returns the `struct Module` instead of an exit code. It gets no arguments. The loader calls it once, to get the module, and then constructs, adds and starts the module. So `main()` must only return the pointer and must not use app functions.

A C compiler won't accept a `main()` that doesn't return `int`, and the ESP32 build renames `main` to `app_main`. An assembler label gives the function the right symbol name for both:

```c
#include <tactility/error.h>
#include <tactility/module.h>

#include <stdio.h>

static error_t start(void) {
    printf("Module started\n");
    return ERROR_NONE;
}

static error_t stop(void) {
    printf("Module stopped\n");
    return ERROR_NONE;
}

// Not const, because the kernel keeps its state in the module
static struct Module module = {
    .name = "example-module",
    .start = start,
    .stop = stop,
    .drivers = NULL,
    .symbols = NULL,
    .internal = NULL,
};

// The label goes through a macro, because the build renames main to app_main
#define ENTRY_NAME_INNER(name) #name
#define ENTRY_NAME(name) ENTRY_NAME_INNER(name)
struct Module* module_main(int argc, char* argv[]) __asm__(ENTRY_NAME(main));

struct Module* module_main(int argc, char* argv[]) {
    return &module;
}
```

[Start a new project](app-development/tt.md?id=starting-a-new-app) and choose `module` to get this template.

To let apps call into the module, list its functions in `.symbols`, like the [firmware modules do](app-development/symbols.md?id=how-symbols-are-exported).

## When modules are loaded

The modules of a package are loaded:
- at boot, for the packages that are installed on a mounted filesystem, and
- when the package is installed with `app_install()` or `tt app install`.

A package that isn't compatible with the device (`requires.device.id`, `requires.ram`) is installed, but its modules aren't loaded.

The binaries are loaded all at once. When a module fails to load or to start, the modules of the package that started before it are stopped and unloaded again, and an install is undone. At boot, that package is left out.

The modules load before LVGL starts. A module can't use the functions of `lvgl-module` and `lvgl-window-manager-module`, because the loader can't find them yet. Put the user interface in an app instead.

Modules that came from a package are marked as external: `module_is_external()` returns true for them.

## Stopping and uninstalling

A module can't be stopped, or uninstalled, while something uses it:
- An app or another module that uses its exported functions holds a reference on it for as long as the app or module is loaded.
- A driver of the module is bound to a device.

`module_stop()` then returns `ERROR_RESOURCE_BUSY` and the module keeps running. The same goes for `app_uninstall()` and for installing a package over an installed one: nothing is changed or deleted. The module's binary is only unloaded after the module stopped.

If an app needs the module but might run without it, look the functions up when the app starts instead of linking them. An app that is linked against a function of a module that isn't running fails to load, so it can't tell the user. A lookup with `module_resolve_symbol_global_get()` also takes the reference. Release it with `module_put()` when the app closes:

```c
#include <tactility/module.h>

static bool acquire(struct Module** out_module, uintptr_t* out_function) {
    return module_resolve_symbol_global_get("example_function", out_function, out_module);
}

static void release(struct Module* module) {
    module_put(module);
}
```

## Listing the modules

`app_module_for_each()` (`app/install.h`) calls a function for every module that was loaded from a package. It passes the id of the package, its install directory and the module. The package id is what `app_uninstall()` takes. Modules of the firmware aren't listed.

The visitor runs with a lock held. Don't call `app_install()`, `app_uninstall()` or other loader functions from inside it. Copy what you need and use it after the call returns. The module pointer is only valid during the call, because an uninstall unloads the module's binary.

To start or stop a listed module, pass the package id and the module's name to `app_module_set_started()`. It looks the module up and starts or stops it with the loader locked, so an uninstall can't unload the module meanwhile. It returns `ERROR_NOT_FOUND` when the package was uninstalled in the meantime.

The Kernel settings app (Settings → Kernel) lists these modules. A button starts or stops each one, and a failed start or stop shows in the status under its name.

## Limits

An external module can only use the symbols the firmware exports (see [Symbols](app-development/symbols.md)), and it can't count on the C++ standard library being complete:
- No streams (`<iostream>`, `<fstream>`, `<sstream>`). Use `stdio` and `std::string`.
- No static or global objects with a destructor, not even a function-local `static const std::string`. The destructor needs `__dso_handle`, and the build fails. Use a local variable or `new` and `delete`.
- No `std::from_chars` or `std::to_chars` on RISC-V targets, which need a function of the compiler runtime that isn't exported. Use `strtol()`.
- Call `vSemaphoreDelete()` on a kernel `Mutex`'s `handle`, instead of `mutex_destruct()`.

To find what is missing, list the undefined symbols of the built `.elf` and compare them with the symbol tables, or load the module on a device and read the log (see [Symbols](app-development/symbols.md?id=testing)).

On a device with PSRAM, the code and data of a module are loaded into PSRAM. A task that a module creates still gets its stack from internal RAM, so keep the stack sizes small.
