## Making apps is easy!

The app manifest provides basic information like the application name.
It also describes the [app lifecycle](application-lifecycle.md):
It tells Tactility which functions need to be called when the app is started/shown/etc.

UI is created with [lvgl](https://github.com/lvgl/lvgl) which has lots of [widgets](https://docs.lvgl.io/9.0/widgets/index.html)!
Creating a touch-capable UI is [easy](https://docs.lvgl.io/9.0/get-started/quick-overview.html) and doesn't require your own render loop!

```cpp
static void onShow(tt::app::AppContext context, lv_obj_t* parent) {
    // Default toolbar with app name and close button
    lv_obj_t* toolbar = tt::lvgl::toolbar_create(parent, context);
    lv_obj_align(toolbar, LV_ALIGN_TOP_MID, 0, 0);
    
    // Label widget
    lv_obj_t* label = lv_label_create(parent);
    lv_label_set_text(label, "Hello, world!");
    lv_obj_align(label, LV_ALIGN_CENTER, 0, 0);
    // Widgets are auto-removed from the parent when the app is closed
}

extern const tt::app::AppManifest manifest = {
    .id = "HelloWorld",    // Used to identify and start an app
    .name = "Hello World", // Shown on the desktop and app's toolbar
    .onShow = onShow  // A minimal setup sets the onShow() function
};
```

![hello world app screenshot](images/screenshot-HelloWorld.png)

