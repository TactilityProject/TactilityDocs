# Creating An Internal App

When it comes to internal applications, there are 2 variants:
- System applications: these are built into the Tactility library
- User applications: these are specified in the configuration that is supplied by the user in `Main.c` of the main `App/` project.

## The Application Class

A minimal app would only implement `onShow()` to create widgets and add them to the `parent` widget.
`onShow()` is called whenever the app becomes visible. That includes becoming visible again when it is temporarily hidden by another app.

```cpp
class HelloWorld final : public tt::App {
public:
    void onShow(AppContext& context, lv_obj_t* parent) final {
        lv_obj_t* toolbar = tt::lvgl::toolbar_create(parent, context);
        lv_obj_align(toolbar, LV_ALIGN_TOP_MID, 0, 0);

        lv_obj_t* label = lv_label_create(parent);
        lv_label_set_text(label, "Hello, world!");
        lv_obj_align(label, LV_ALIGN_CENTER, 0, 0);
    }
};
```

You don't need to de-allocate the widgets. When `onHide()` happens, the widgets in the window are automatically removed and destroyed.

## The Application Manifest

Now that we have a basic application, we have to register it to the system.
This registration happens with an _application manifest_:

```cpp
extern const AppManifest hello_world_app = {
    .id = "HelloWorld",
    .name = "Hello World",
    .createApp = create<HelloWorldApp>
};
```

The `id` needs to be unique across all applications. The `id` is used to find an application in the _application registry_
so that the manifest can be found and an instance can be created.

The `name` of the application is a display name. It can be used in toolbars, launchers, etc.

The `createApp` function is the factory for creating an instance. `tt::app::create<Type>()` helps us with that.

## Application Configuration

Now that we have an app and a manifest, we can register it!

Registration is done in the Tactility `Configuration` object, which is usually found in the main source file of your project:

```cpp
static const tt::Configuration config = {
    // ...
    .apps = {
        &hello_world_app,
    }
};
```

Your app will automatically show up in the launcher, so you can find it and run it.
