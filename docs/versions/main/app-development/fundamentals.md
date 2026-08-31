# App Development - Fundamentals

Tactility has 2 types of apps: internal ones and external ones. The main logic is the same, but internal apps have access to more functionality and external ones can either be a plain binary (`.elf` or `.so` file) or they can be packaged together with assets into an `.app` archive.

Functions and variables in an app's `.elf` file are referred to as "symbols". When you build an app, it contains all the symbols
of that app itself, but you're likely also using external dependencies such as libc or a kernel module (e.g. `lvgl-module`, `app-module`).

The app refers to these symbols, but they don't actually exist inside its binary. When the app is loaded onto a device, a Tactility subsystem maps these symbols from the main firmware into the app. This mechanism is comparable to attaching a dynamically linked library where Tactility is the one facilitating the "library" functions.

## Device Firmware

The device firmware contains the main operating system, including symbol mappings for apps:

It exposes a limited set of functions to the apps. It stores a map that ties a function pointer to a function name. Function names are stripped by the ESP-IDF build system, so we have to manually map them. Each kernel module declares its own symbol table (a `ModuleSymbol` array built with `DEFINE_MODULE_SYMBOL`), which is hard-wired into the firmware - see [Symbols](app-development/symbols.md) for how to add one.

## TactilitySDK

TactilitySDK exposes symbol interfaces/names to the apps:

It includes headers for `app-module`, `lvgl-module`, TactilityKernel and more. It exposes this functionality to apps. Linking with the app happens dynamically, so its symbols are not embedded statically into the app.

## App Packages

Some apps are packaged into a file with an `.app` extension. This is a tar file that contains:
- The application manifest (`manifest.properties`): metadata such as the app id and version
- One or more ELF binaries, one per target platform, under `elf/<platform>.elf` (e.g. `elf/esp32s3.elf`)
- An optional `assets/` folder

App executables only contain the symbols defined by its own source files. All other symbols must be present in the main firmware **and** exposed explicitly by a kernel module's symbol table.

Some notable behaviours:
- Every app instance gets its own dedicated task for its entire lifetime; starting an app never asks another app to give up its task, so multiple instances (of the same or different apps) can run at once.
- Apps are started with `app_manager_start()` or other `app_manager_start_*()` functions, and close themselves by simply returning from their `main()` function.
- An app can start another app as a modal child and receive its result back (`app_manager_start_for_result()`).
- An app can be started with parameters (`argc`/`argv`, passed to its `main()`).

## Apps starting apps

Let's look at a scenario where an app launches another app for a result:

1. `first` app calls `app_manager_start_for_result()`: `second` app starts, `first`'s window is buried.
2. `second` app returns from `main()`: its task exits.
3. `first` app receives an `APP_EVENT_RESULT` event with `second`'s return value, and calls `app_manager_stop()` on `second`'s instance id to fully reap it.

## Writing a Hello World app

An app is a C (or C++) program with a `main(int argc, char* argv[])` entry point, modelled on a regular C program's `main()`.
A very basic one has a `main()` that prints and returns:

```c
#include <stdio.h>

static const char* TAG = "HelloWorld";

int main(int argc, char* argv[]) {
    printf("Hello, world!\n");
    return 0;
}
```

There should also be a `CMakeLists.txt`:

```cmake
file(GLOB_RECURSE SOURCE_FILES Source/*.c)

idf_component_register(
    SRCS ${SOURCE_FILES}
    REQUIRES TactilitySDK
        app-module
)
```

And a `manifest.properties` (see [Manifest.properties](#manifestproperties) below for details):

```properties
manifest.version=0.2
target.sdk=0.8.0
target.platforms=esp32,esp32s3,esp32c6,esp32p4
app.id=one.tactility.helloworld
app.version.name=0.1.0
app.version.code=1
app.name=Hello World
```

This app returns immediately after printing, so it starts and closes itself right away. It never blocks or reacts to events. See [Apps with events](#apps-with-events) below for a long-running app that stays open.

## Apps with events

A long-running app blocks on a `TaskEventGroup` instead of returning immediately. This is a caller-owned event group (no heap allocation) that lets a task wait on several independent event sources and. It doesn't only wait for events about its own lifecycle, but also from other systems such as `wifi_event`. It waits with a single blocking call, instead of a separate wait per source. Each event source claims its own bit in the group when you subscribe to it (`app_event_subscribe()`, `wifi_event_subscribe()`, etc.), and `task_event_group_wait_any()` wakes as soon as any claimed bit is signalled. After waking, drain each source you subscribed to with its own poll function (`app_event_poll()`, `wifi_event_poll()`, etc.). A single wake can mean multiple sources have events waiting.

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

## Manifest.properties

The `manifest.properties` file contains metadata. It uses flat dot-notation. Example:

```properties
manifest.version=0.2
target.sdk=0.8.0
target.platforms=esp32,esp32s3,esp32c6,esp32p4
app.id=one.tactility.helloworld
app.version.name=0.1.0
app.version.code=1
app.name=Hello World
```

Optional fields:
- `requires.device.id`: comma-separated list of device ids (matching folder names under `Devices/`) this app is restricted to
- `app.stack.depth`: stack depth in words for the app's task (defaults to the scheduler's default, which is conservative - set this if your app needs more)

## Starting app with parameters

`app-module` has the following functions via `app/manager.h`:
- `error_t app_manager_start(const char* id, AppInstanceId* out_app_instance_id)`
- `error_t app_manager_start_with_parameters(const char* id, int argc, const char* const argv[], AppInstanceId* out_app_instance_id)`

`argv`/its strings only need to stay alive for the duration of the call - app-module makes its own deep copy before returning.

## App results

An app can be started as a modal child that reports back to its parent:

```c
error_t app_manager_start_for_result(const char* id, AppInstanceId parent_instance_id, int argc, const char* const argv[], AppInstanceId* out_app_instance_id);
```

When the child's `main()` returns, its parent receives an `APP_EVENT_RESULT` event carrying the child's return value. By convention: `0` = Ok, `1` = Cancelled, `2` = Error.

## Receive a result from an app

The app that called `app_manager_start_for_result()` receives an `APP_EVENT_RESULT` event through its own `app_event_poll()` loop (the same one draining `APP_EVENT_CLOSE`):

```c
struct AppEvent event;
while (app_event_poll(&sub, &event) == ERROR_NONE) {
    if (event.type == APP_EVENT_RESULT) {
        int32_t result = event.result.result;
        // ...
    }
}
```

After handling the result, call `app_manager_stop()` on the child's instance id to fully reap it.

### Receiving more than an `int32_t`

`event.result.result` only carries a single `int32_t`. If the child needs to hand back more - picked text, a file path - use `app_manager_start_for_result_with_streams()` instead of `app_manager_start_for_result()`. It takes one or more `struct AppStreamBinding`s that redirect the child's own `stdout` (or another fd) into an `AppStream` you own, for the whole lifetime of the child's task:

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
};

AppInstanceId child_instance_id = 0;
app_manager_start_for_result_with_streams(child_id, app_instance_id, 0, NULL, &binding, 1, &child_instance_id);
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

You can access it via `app/paths.h`, passing your own app id (the same one as `app.id` in your `manifest.properties`):

```c
#define APP_ID "one.tactility.helloworld"

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
