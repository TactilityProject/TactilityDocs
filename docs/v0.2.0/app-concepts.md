# Apps

Here are some notable behaviours:
- Apps can be started and stopped: this is similar to create and destroy
- Apps can be shown and hidden: when they are ready to render their UI, or when their UI is hidden
- Apps can start other apps. An app can return a result to the app that started it.
- Apps can be started with parameters.

## Internal or external

There are 2 distinct types of apps:

**Internal apps** ([example](https://github.com/ByteWelder/Tactility/blob/{{versionLabel}}/App/Source/HelloWorld/HelloWorld.cpp))

These are inside the Tactility project and use a C++ API. They have full access to the internal Tactility APIs.
Internal apps can run on the simulator and on ESP32.

**External apps** ([example](https://github.com/ByteWelder/Tactility/blob/{{versionLabel}}/ExternalApps/HelloWorld/main/Source/main.c))

These apps have their own _elf_ binary and can be stored and launched from a filesystem.
External apps are built on top of TactilitySDK. TactilitySDK only exposes a limited set of
functionality and is an API written in C.

External apps currently only run on ESP32 and are not yet supported by the simulator.

## Lifecycle

An app goes through these states:

```plantuml
@startuml
[*] --> onStart : app is created
onStart --> onShow : app becomes visible
onShow --> onHide : app is no longer visible
onHide --> onStop : app is preparing to be destroyed
onStop --> [*] : app is destroyed
skinparam ranksep 25
skinparam padding 2
@enduml
```

Let's look at a scenario where an app launches another app:

1. `first` app starts: `first.onStart()` -> `first.onShow()`
2. `second` app starts: `first.onHide()` -> `second.onStart()` -> `second.onShow()`
3. `second` app stops: `second.onHide()` -> `second.onStop()` -> `first.onShow()`
4. `first` app stops: `first.onHide()` -> `first.onStop()`

## Registering new apps

Apps must declare a manifest. The manifest specifies the app identifier, the human-readable name,
where the class or functions of the app are and more.
The app manifest is then registered, so the apps can be launched (e.g. from the Launcher app or other apps)

:::: tabs
::: tab Tactility

Internal apps are specified in the `tt::Configuration` such as [here](https://github.com/ByteWelder/Tactility/blob/{{versionLabel}}/App/Source/Main.cpp).

They are automatically added to the internal app registry.

:::
::: tab TactilitySDK

External apps must manually register their manifest:

```c
ExternalAppManifest manifest = {
    .name = "Hello World",
    .onShow = onShow
};

int main(int argc, char* argv[]) {
    tt_app_register(&manifest);
    return 0;
}
```

:::
::::

## Showing a user interface

Interfaces are created with [lvgl](https://github.com/lvgl/lvgl) which has lots of [widgets](https://docs.lvgl.io/9.0/widgets/index.html)!
Creating a touch-capable UI is [easy](https://docs.lvgl.io/9.0/get-started/quick-overview.html).

When the application's `onStart()` function is called, you get access to `lv_obj_t* parent`.
This parent is the root widget that is used to attach other widgets too.
It's the root of the application's window.

:::: tabs
::: tab Tactility

```cpp
void onShow(AppContext& context, lv_obj_t* parent) override {
    lv_obj_t* toolbar = tt::lvgl::toolbar_create(parent, context);
    lv_obj_align(toolbar, LV_ALIGN_TOP_MID, 0, 0);

    lv_obj_t* label = lv_label_create(parent);
    lv_label_set_text(label, "Hello, world!");
    lv_obj_align(label, LV_ALIGN_CENTER, 0, 0);
}
```

:::
::: tab TactilitySDK

```c
static void onShow(AppHandle app, void* data, lv_obj_t* parent) {
    lv_obj_t* toolbar = tt_lvgl_toolbar_create(parent, app);
    lv_obj_align(toolbar, LV_ALIGN_TOP_MID, 0, 0);

    lv_obj_t* label = lv_label_create(parent);
    lv_label_set_text(label, "Hello, world!");
    lv_obj_align(label, LV_ALIGN_CENTER, 0, 0);
}
```

:::
::::

## Starting app with parameters

:::: tabs
::: tab Tactility

There are generally 2 ways to start an app with parameters:
- By calling `void tt::app::start(string appId, Bundle parameters)`
- By calling an app-specific function, like `void tt::app::textviewer::start(string filepath)`

When apps require parameters, it's desirable to have an app-specific function that takes care of calling `tt::app::start()`.
This way, the caller doesn't have to know about the internal formatting of the `Bundle`.

:::
::: tab TactilitySDK

TactilitySDK has the following functions via `tt_app.h`:
- `void tt_app_start(const char* appId)`
- `void tt_app_start_with_bundle(string id, BundleHandle parameters)`

:::
::::

## App results

Some applications report back with a success/failure result, and some might even return data.

When an application is expected to do an operation, it might want to report that back.

Let's take the `SelectionDialog` app as example: it is started with a list of items to select, and when it finishes
it can report back which item was selected by setting the item index in the result bundle.

## Receive a result from an app

The application that launched the result-setting application is the one that receives the result.

:::: tabs
::: tab Tactility

The launching application will have `App::onResult()` called right after `App::onShow()` when it resumes operation.

:::
::: tab TactilitySDK

The launching application will have `ExternalAppManifest::onResult` called right after `ExternalAppManifest::onShow` when it resumes operation.

:::
::::

## Return a result to an app

:::: tabs
::: tab Tactility

The `App` class has these methods:
- `void setResult(Result, std::unique_ptr<Bundle>)`
- `bool hasResult()`

They can be called at any time, but after `App::onStop()` is called, any calls to `setResult()` won't have an effect.

:::
::: tab TactilitySDK

TactilityC has these functions related to `AppHandle`:
- `void tt_app_set_result(AppHandle, Result, BundleHandle)`
- `bool tt_app_has_result(AppHandle)`

They can be called at any time, but after `ExternalManifest::onStop` is called, any calls to `tt_app_context_set_result()` won't have an effect.

:::
::::

