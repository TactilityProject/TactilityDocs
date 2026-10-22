# Services

A service is a long-running part of the system that works in the background, independent of apps. For example:

| Service | Purpose |
|---|---|
| `tactility.statusbar` | Updates the statusbar icons (Wi-Fi, battery, SD card, etc.) |
| `development-server` | The development server (`development-module`): remote shell, file transfer, and installing and running apps over the network (see [Remote Access](user-guide/remote-access.md)) |
| `tactility.audio` | Audio input and output, volume and mute |
| `tactility.rtctime` | Keeps the system time in sync with a real-time clock |
| `tactility.displayidle`, `tactility.keyboardidle` | Turn off the display and keyboard backlight after a period without activity |
| `tactility.memorychecker` | Warns in the statusbar when memory gets low |

The services of the firmware are in `Tactility/Source/service/`.

## Services and apps

Apps and services both run code, but they're different:
- An **app** is started by the user (or by another app), usually has a window, and runs on its own task until it returns from `main()`.
- A **service** is started by the system, usually at boot, has no window, and keeps running in the background. It has **no task of its own**: it reacts to events, timers or requests from apps.

## Defining a service

A service is described by a `ServiceManifest` (`<service/manifest.h>` in `service-module`):

```c
struct ServiceManifest {
    const char* id;                  // unique id, e.g. "tactility.audio"
    ServiceCreate create_service;    // allocates the service's data
    ServiceDestroy destroy_service;  // frees that data
    ServiceOnStart on_start;         // optional: starts the service's work
    ServiceOnStop on_stop;           // optional: stops it
};
```

- `create_service` allocates the service's own data, and `destroy_service` frees it. The data is passed to `on_start` and `on_stop`, and can be retrieved later with `service_instance_get_data()`.
- `on_start` starts the actual work: subscribing to events, creating a timer or a task, opening a server socket, etc. It returns `ERROR_NONE` when the service started.
- `on_stop` undoes everything `on_start` did.

Within the firmware, services are usually written in C++: a class derived from `tt::service::Service` with `onStart()` and `onStop()`, and a `ServiceManifest` with a `createService` function (`Tactility/Include/Tactility/service/`).

## Lifecycle

Services are managed by the service manager (`<service/manager.h>`):

```c
service_manager_add(&my_service_manifest, true);  // register, and start it right away
service_manager_stop("my.service");
service_manager_start("my.service");
service_manager_remove("my.service");
```

- `service_manager_add()` registers the manifest. With `auto_start`, the service is also started.
- `service_manager_start()` creates the service's data and calls `on_start`. `service_manager_stop()` calls `on_stop` and destroys the data.
- `service_manager_find_instance()` finds a running service, e.g. to call its functions.

The firmware registers its services at startup (`Tactility/Source/InitServices.cpp`).

## Doing work in a service

As a service has no task of its own, `on_start` must return quickly. For the actual work:
- **Events:** create a task that waits on a `TaskEventGroup` with your subscriptions, as described in [Event Design](kernel-concepts/events.md).
- **Periodic work:** use a timer (`<tactility/concurrent/timer.h>`). Keep the timer callback short: it runs on the shared timer task, with a small stack.
- **Requests from apps:** offer functions that apps call. They run on the calling app's task, so protect the service's data with a mutex.

`on_stop` must stop all of it, and wait until any task of the service has finished, before the service's data is destroyed.

## Storage

Like apps, services get their own folders, in `<service/paths.h>`: `service_paths_get_user_data_path()` for files the service writes, and `service_paths_get_assets_path()` for read-only files.
