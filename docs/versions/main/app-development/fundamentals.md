# App Development - Fundamentals

Tactility has 2 types of apps: internal ones and external ones. The main logic is the same, but internal apps have access to more functionality. External apps can either be a plain binary (an `.elf` file, or an `.so` file on the simulator), or they can be packaged together with assets into an `.app` archive.

Functions and variables in an app's binary are referred to as "symbols". When you build an app, it contains all the symbols
of that app itself, but you're likely also using external dependencies such as libc or a kernel module (e.g. `lvgl-module`, `app-module`).

The app refers to these symbols, but they don't actually exist inside its binary. When the app is loaded onto a device, a Tactility subsystem maps these symbols from the main firmware into the app. This mechanism is comparable to attaching a dynamically linked library where Tactility is the one facilitating the "library" functions.

## Device Firmware

The device firmware contains the main operating system, including symbol mappings for apps:

It exposes a limited set of functions to the apps. It stores a map that ties a function pointer to a function name. Function names are stripped by the ESP-IDF build system, so we have to manually map them. Each [kernel module](kernel-concepts/module.md) declares its own symbol table (a `ModuleSymbol` array built with `DEFINE_MODULE_SYMBOL`), which is hard-wired into the firmware - see [Symbols](app-development/symbols.md) for how to add one.

## TactilitySDK

TactilitySDK exposes symbol interfaces/names to the apps:

It includes headers for `app-module`, `lvgl-module`, TactilityKernel and more. It exposes this functionality to apps. Linking with the app happens dynamically, so its symbols are not embedded statically into the app.

## App Packages

Apps are usually distributed as a package: a file with an `.app` extension. This is a tar file that contains:
- The package manifest (`manifest.properties`): metadata such as the package id, its version and the apps it contains (see [Manifest.properties](#manifestproperties))
- The binaries, one per app and per target platform, under `bin/<platform>/<binary>.elf` (e.g. `bin/esp32s3/helloworld.elf`). Simulator builds use `.so` instead of `.elf`.
- An optional `assets/` folder

A package can contain more than one app. For example, a game and its settings app can be installed and updated together.

App executables only contain the symbols defined by its own source files. All other symbols must be present in the main firmware **and** exposed explicitly by a kernel module's symbol table.

Some notable behaviours:
- Every app instance gets its own dedicated task for its entire lifetime; starting an app never asks another app to give up its task, so multiple instances (of the same or different apps) can run at once.
- Apps are started with `app_start_with_context()` (see [Starting apps](#starting-apps)), and close themselves by simply returning from their `main()` function.
- An app can start another app as a modal child and receive its result back.
- An app can be started with parameters (`argc`/`argv`, passed to its `main()`).

## Apps starting apps

Let's look at a scenario where an app launches another app for a result:

1. `first` app starts `second` with itself as the parent (see [App results](#app-results)): `second` app starts, `first`'s window is buried.
2. `second` app returns from `main()`: its task exits.
3. `first` app receives an `APP_EVENT_RESULT` event with `second`'s return value, and calls `app_manager_stop()` on `second`'s instance id to fully reap it.

## Writing a Hello World app

An app is a C (or C++) program with a `main(int argc, char* argv[])` entry point, modelled on a regular C program's `main()`.
A very basic one has a `main()` that prints and returns:

```c
#include <stdio.h>

int main(int argc, char* argv[]) {
    printf("Hello, world!\n");
    return 0;
}
```

There should also be a `main/CMakeLists.txt`, which registers the app's sources with the SDK:

```cmake
include("$ENV{TACTILITY_SDK_PATH}/TactilitySDK.cmake")

file(GLOB_RECURSE SOURCE_FILES Source/*.c*)
tactility_component_register(SRCS ${SOURCE_FILES})
```

And a `manifest.properties` (see [Manifest.properties](#manifestproperties) below for details):

```properties
manifest.version=0.3
target.sdk=0.8.0
target.platforms=esp32,esp32s3,esp32c6,esp32p4
id=tactility.helloworld
version.name=0.1.0
version.code=1
name=Hello World
app.0.id=tactility.helloworld
app.0.name=Hello World
app.0.binary=helloworld
```

This app returns immediately after printing, so it starts and closes itself right away. It never blocks or reacts to events. See [Apps with events](#apps-with-events) below for a long-running app that stays open.

## Apps with events

A long-running app blocks on a `TaskEventGroup` instead of returning immediately. This is a caller-owned event group (no heap allocation) that lets a task wait on several independent event sources. It doesn't only wait for events about its own lifecycle, but also from other systems such as `wifi_event`. It waits with a single blocking call, instead of a separate wait per source. Each event source claims its own bit in the group when you subscribe to it (`app_event_subscribe()`, `wifi_event_subscribe()`, etc.), and `task_event_group_wait_any()` wakes as soon as any claimed bit is signalled. After waking, drain each source you subscribed to with its own poll function (`app_event_poll()`, `wifi_event_poll()`, etc.). A single wake can mean multiple sources have events waiting.

Below is the minimal shape - an app with no window at all (e.g. a background/headless app). See [Writing an app with a window](#writing-an-app-with-a-window) below for the common case of an app with a UI.

```c
#include <app/event.h>
#include <app/manager.h>
#include <app/scheduler.h>

int main(int argc, char* argv[]) {
    AppInstanceId app_instance_id = app_scheduler_current_app_id();

    struct TaskEventGroup event_group = {0};
    task_event_group_construct(&event_group);

    struct AppEventSubscription sub = {0};
    check(app_event_subscribe(&sub, &event_group) == ERROR_NONE);

    bool should_close = false;
    while (!should_close) {
        task_event_group_wait_any(&event_group, NULL, portMAX_DELAY);

        struct AppEvent event;
        while (app_event_poll(&sub, &event) == ERROR_NONE) {
            if (event.type == APP_EVENT_CLOSE) {
                should_close = true;
                break;
            }
        }
    }

    check(app_event_unsubscribe(&sub) == ERROR_NONE);
    task_event_group_destruct(&event_group);

    return 0;
}
```

## Writing an app with a window

Most apps show a UI, and follow the same shape as [Apps with events](#apps-with-events) above, with one addition: creating (and tearing down) a window.

1. Looks up its own instance id with `app_scheduler_current_app_id()`.
2. Subscribes to app-lifecycle events with `app_event_subscribe()`.
3. Creates its window with `window_manager_create()`.
4. Blocks in a loop on `task_event_group_wait_any()`, draining events with `app_event_poll()`, until it sees `APP_EVENT_CLOSE`.
5. Tears down (`window_manager_remove()`, `app_event_unsubscribe()`) and returns.

```c
#include <app/event.h>
#include <app/manager.h>
#include <app/scheduler.h>

#include <lvgl_window_manager/window_manager.h>

#include <tactility/check.h>

#include <lvgl.h>
#include <lvgl/widgets/toolbar.h>

static void create_widgets(lv_obj_t* parent, void* userData) {
    lv_obj_t* toolbar = lvgl_toolbar_create(parent, "Title");
    lv_obj_align(toolbar, LV_ALIGN_TOP_MID, 0, 0);

    lv_obj_t* label = lv_label_create(parent);
    lv_label_set_text(label, "Hello, world!");
    lv_obj_align(label, LV_ALIGN_CENTER, 0, 0);
}

int main(int argc, char* argv[]) {
    AppInstanceId app_instance_id = app_scheduler_current_app_id();

    struct TaskEventGroup event_group = {0};
    task_event_group_construct(&event_group);

    struct AppEventSubscription sub = {0};
    check(app_event_subscribe(&sub, &event_group) == ERROR_NONE);

    WindowId window = window_manager_create(app_instance_id, create_widgets, NULL);

    bool should_close = false;
    while (!should_close) {
        task_event_group_wait_any(&event_group, NULL, portMAX_DELAY);

        struct AppEvent event;
        while (app_event_poll(&sub, &event) == ERROR_NONE) {
            if (event.type == APP_EVENT_CLOSE) {
                should_close = true;
                break;
            }
        }
    }

    window_manager_remove(window);
    check(app_event_unsubscribe(&sub) == ERROR_NONE);
    task_event_group_destruct(&event_group);

    return 0;
}
```

The window manager deletes and recreates the window's widgets when another window covers it and when it comes back. Anything that uses the widgets, such as an `lv_timer`, must stop when they're deleted (e.g. from an `LV_EVENT_DELETE` callback on one of the widgets), not only when `main()` ends.

## Developing with the simulator

The [simulator](os-development/simulator.md) runs Tactility on your computer (Linux, or WSL on Windows). Building and testing an app there is much faster than flashing and testing on a device, and it's easier to debug.

1. Add `posix-x86_64` to the app's `target.platforms` in `manifest.properties`.
2. Start the simulator, and enable the Development service in its Settings app (Settings -> Development).
3. Build, install and run the app on the simulator, just like on a device, with `localhost` as the host:
   ```bash
   python tactility.py bir --host localhost --architecture posix-x86_64
   ```

Test on a real device before releasing your app, as some things only exist there or behave differently on hardware, such as a device's specific drivers, its memory limits and its display.

## Manifest.properties

The `manifest.properties` file describes the package and the apps in it. It uses flat dot-notation, with one `key=value` pair per line:

```properties
manifest.version=0.3
target.sdk=0.8.0
target.platforms=esp32,esp32s3,esp32c6,esp32p4
id=tactility.helloworld
version.name=0.1.0
version.code=1
name=Hello World
description=Shows a greeting
app.0.id=tactility.helloworld
app.0.name=Hello World
app.0.binary=helloworld
```

### Package properties

- `manifest.version`: required manifest format version: `0.3`
- `target.sdk`: required version of the Tactility SDK that the package is built for (e.g. `0.8.0`)
- `target.platforms`: required comma-separated list of the platforms to build for: `esp32`, `esp32s3`, `esp32c6`, `esp32p4` and `posix-x86_64` (the simulator)
- `id`: required package id (e.g. `tactility.helloworld`)
- `version.name`: required version text (e.g. `0.1.0`)
- `version.code`: required version number, which must increase with every release
- `name`, `description`: optional package name and description, for app stores
- `requires.device.id`: optional comma-separated list of device ids (matching folder names under `Devices/`) this package is restricted to
- `requires.ram`: optional minimum amount of RAM, in whole megabytes with an `M` suffix (e.g. `2M`)

### App properties

Each app in the package has an `app.<index>.` block, numbered from `0` without gaps:

- `app.<index>.id`: required app id. For a package with a single app, this is usually the same as the package id.
- `app.<index>.name`: required app name, as shown in the launcher
- `app.<index>.binary`: required name of the app's binary, without extension. It's installed as `bin/<platform>/<binary>.elf`.
- `app.<index>.stack.depth`: optional stack depth in words for the app's task (defaults to the scheduler's default, which is conservative - set this if your app needs more)
- `app.<index>.hidden`: optional boolean that hides the app from the launcher, e.g. for an app that's only started by another app. Defaults to `false`.
- `app.<index>.headless`: optional boolean for apps without a window. They can be started when no UI is available. Defaults to `false`.
- `app.<index>.cleanup`: optional boolean that makes Tactility release what the app leaked when its `main()` returns: its tasks (after a grace period), open files and directories, and memory. It doesn't cover sockets, `dup()` or LVGL objects. Don't use it when the app hands memory, files or tasks over to the system, as they would be released twice. Defaults to `false`.

In a package with more than one app, each app is built from its own subdirectory, named after its `app.<index>.binary`.

The older `0.2` manifest format, with a single app described by `app.id`, `app.name`, `app.version.name` and `app.version.code`, is still supported.

## Starting apps

`app-module` starts apps in two steps, via `app/start.h`:
1. Create an `AppStartContext`, e.g. with `app_start_context_from_id()` for an installed app.
2. Optionally configure it, then start it with `app_start_with_context()`.

```c
#include <app/start.h>

struct AppStartContext context;
if (app_start_context_from_id("tactility.helloworld", &context) == ERROR_NONE) {
    AppInstanceId instance_id = 0;
    app_start_with_context(&context, &instance_id);
}
```

The context can be configured before starting:
- `app_start_context_set_arguments_ext(&context, argc, argv)` or `app_start_context_set_arguments(&context, arguments)`: parameters for the app's `main()`. The strings only need to stay alive for the duration of `app_start_with_context()`, which makes its own copy.
- `app_start_context_set_parent(&context, parent_instance_id)`: start the app as a modal child that reports its result back (see [App results](#app-results)).
- `app_start_context_set_streams(&context, bindings, count)`: capture the app's output (see [Receiving more than an int32_t](#receiving-more-than-an-int32_t)).
- `app_start_context_set_environment(&context, environment)`: environment variables, as a `NULL`-terminated array of `KEY=VALUE` strings.
- `app_start_context_set_stack(&context, stack)`: override the task's stack configuration.

Plain binaries that aren't installed are started with `app_start_context_for_location()` instead.

The older `app_start()`, `app_start_for_result()`, `app_start_with_streams()` and `app_start_for_result_with_streams()` functions are deprecated.

## App results

An app can be started as a modal child that reports back to its parent, by setting the parent on its start context:

```c
struct AppStartContext context;
if (app_start_context_from_id(child_id, &context) == ERROR_NONE) {
    app_start_context_set_parent(&context, app_instance_id);
    AppInstanceId child_instance_id = 0;
    app_start_with_context(&context, &child_instance_id);
}
```

When the child's `main()` returns, its parent receives an `APP_EVENT_RESULT` event carrying the child's return value. By convention: `0` = Ok, `1` = Cancelled, `2` = Error.

## Receive a result from an app

The parent app receives an `APP_EVENT_RESULT` event through its own `app_event_poll()` loop (the same one draining `APP_EVENT_CLOSE`):

```c
struct AppEvent event;
while (app_event_poll(&sub, &event) == ERROR_NONE) {
    if (event.type == APP_EVENT_RESULT) {
        int32_t result = event.result.result;
        // ...
        app_manager_stop(event.result.launch_id);
    }
}
```

`event.result.launch_id` is the child's instance id. After handling the result, call `app_manager_stop()` on it to fully reap the child.

### Receiving more than an `int32_t`

`event.result.result` only carries a single `int32_t`. If the child needs to hand back more - picked text, a file path - bind one or more `struct AppStreamBinding`s to the start context. They redirect the child's own `stdout` (or another fd) into an `AppStream` you own, for the whole lifetime of the child's task:

```c
#include <app/stream.h>

AppStream stream = {0};
uint8_t buffer[256];
struct AppStreamBinding binding = {
    .producer_fd = STDOUT_FILENO,
    .stream = &stream,
    .buffer = buffer,
    .buffer_capacity = sizeof(buffer),
    .event_group = &event_group,
    .alias_fd = -1, // no second fd: must be set explicitly, as 0 is stdin
};

struct AppStartContext context;
if (app_start_context_from_id(child_id, &context) == ERROR_NONE) {
    app_start_context_set_parent(&context, app_instance_id);
    app_start_context_set_streams(&context, &binding, 1);
    AppInstanceId child_instance_id = 0;
    app_start_with_context(&context, &child_instance_id);
}
```

The binding is set up before the child starts, so anything the child `printf()`s (or `write()`s) to `stdout` during its run is captured into `stream` instead of reaching the console. Once `APP_EVENT_RESULT` arrives, read whatever was captured, then unsubscribe:

```c
if (event.type == APP_EVENT_RESULT) {
    if (event.result.result == 0) { // Ok
        char destination[sizeof(buffer)];
        size_t length = app_stream_read(&stream, destination, sizeof(destination));
        // destination[0..length) now holds whatever the child wrote to its own stdout
    }
    app_stream_unsubscribe(&stream);
}
```

Call `app_stream_unsubscribe()` exactly once, regardless of the result - on a non-`Ok` result there's nothing to read, but the stream still needs releasing.

## Assets

The application may have an optional `assets/` folder in its project root path. This folder gets packaged with the application.

You can access it via `app/paths.h`, passing your own app id (the same one as `app.<index>.id` in your `manifest.properties`):

```c
#define APP_ID "tactility.helloworld"

char path[256];
if (app_paths_get_assets_path(APP_ID, "file.txt", path, sizeof(path)) == ERROR_NONE) {
    FILE* file = fopen(path, "r");
    if (file != NULL) {
        // fread()
        fclose(file);
    }
}
```

There is also `app_paths_get_user_data_directory()`/`app_paths_get_user_data_path()` for a per-app directory that survives OS upgrades - use that instead of `assets/` for anything your app writes at runtime (settings, save files, caches).
