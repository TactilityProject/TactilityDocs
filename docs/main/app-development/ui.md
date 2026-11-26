# App Development - UI

Tactility uses [LVGL](https://lvgl.io/) (version 9) for its user interface. Apps create their UI in a window from the window manager (`lvgl-window-manager-module`). This page is about windows, threading, layout and the theme. See [UI Widgets](ui-widgets.md) for the widgets that you build the UI with.

## Windows

An app gets a window with `window_manager_create()` (see [Writing an app with a window](fundamentals.md#writing-an-app-with-a-window)):

```c
WindowId window = window_manager_create(app_instance_id, create_widgets, ctx);
// ...
window_manager_remove(window);
```

The window manager keeps a stack of windows, one per app instance. **Only the topmost window has widgets.** When another app opens on top of yours, your window's widgets are deleted. When that app closes, your `create_widgets` function is called again to rebuild them.

This has a few consequences for `create_widgets(lv_obj_t* parent, void* user_data)`:
- It can be called many times, so it must rebuild the UI from your app's current state, which you keep in your own context (passed as `user_data`), not in the widgets.
- It must only rebuild what's already decided. Decisions (e.g. what to do with the result of a dialog or a child app) belong in your app's `main()` loop.
- It can run on another app's task: the one whose window was removed. Don't use thread-local state, and don't call window manager functions from it, as that would deadlock.
- Anything that refers to the widgets, like an `lv_timer` or stored `lv_obj_t*` pointers, must stop or be cleared when the widgets are deleted. Use an `LV_EVENT_DELETE` callback on one of the widgets, or `window_manager_create_ext()` with a `destroy_widgets` callback.

```c
static void on_widgets_deleted(lv_event_t* event) {
    struct Context* ctx = lv_event_get_user_data(event);
    lv_timer_delete(ctx->timer);
    ctx->timer = NULL;
    ctx->label = NULL;
}

static void create_widgets(lv_obj_t* parent, void* user_data) {
    struct Context* ctx = user_data;
    ctx->label = lv_label_create(parent);
    ctx->timer = lv_timer_create(on_tick, 100, ctx);
    lv_obj_add_event_cb(ctx->label, on_widgets_deleted, LV_EVENT_DELETE, ctx);
}
```

## The LVGL lock

LVGL isn't thread-safe. `create_widgets` and LVGL event callbacks run with the LVGL lock already held. When your app's own task (e.g. its `main()` loop) changes widgets, it must hold the lock:

```c
#include <lvgl/lvgl.h>

lvgl_lock();
lv_label_set_text(ctx->label, "Connected");
lvgl_unlock();
```

Use `lvgl_try_lock(timeout)` when you'd rather skip an update than wait. Keep the lock short: the whole UI stops updating while you hold it.

Remember that the widgets might not exist at that moment (see [Windows](#windows)), so check your stored pointers inside the lock.

## No file operations on the LVGL thread

Code that runs on the LVGL thread must not do file operations: `create_widgets`, LVGL event callbacks, timers, and anything that runs while you hold the LVGL lock. That includes reading or writing settings, and calls that do it for you.

- A file read can block for a long time, especially on an SD card, and the whole UI freezes meanwhile.
- `create_widgets` can run on another app's thread, when that app's window closes. Those threads can have small stacks, or stacks in external RAM that can't access flash.

Do the file work in your app's own task, keep the result in your context, and make the widgets only show what's there. In a callback, signal your task with an event group bit and let it do the work. The same goes for other calls that wait on a service.

## Layout and screen sizes

Tactility runs on displays from 135×240 to 1280×720 pixels, in portrait and landscape. Make your layout adapt to the screen instead of using fixed positions and sizes:
- Prefer a flat structure that positions widgets with `lv_obj_align_to()` over nested containers with flex or grid layouts (see below). Use percentages (`LV_PCT(100)`) for sizes.
- Use flex layouts for what they're good at: a collection of items of the same kind, such as a wrapping row of chips, or a list.
- Size things relative to the font size (e.g. `lvgl_get_text_font_height(FONT_SIZE_DEFAULT)`) instead of in pixels.
- Use `lvgl_theme_get_spacing()` and `lvgl_theme_get_size()` (`<lvgl/theme.h>`) for custom paddings and sizes. They range from 0 (compact) to 100 (regular), and users set them in the Appearance app. `lvgl_theme_lerp(compact, regular, percent)` interpolates between the two values.
- On round or rounded displays, use the [Insets](insets.md) API for content near the edges.

### Prefer `lv_obj_align_to()` over hierarchical layouts

Put the widgets of a screen directly in the window's parent, and position each one relative to the parent or to another widget with `lv_obj_align()` and `lv_obj_align_to()`, instead of wrapping groups of widgets in containers with a flex layout:

- **Easier to read:** the code says where each widget goes ("the label is below the icon"), and the screen has fewer widgets, because you don't need containers just to group and arrange things.
- **Faster to render:** a flatter tree means fewer objects for LVGL to lay out, style and draw, which matters on devices without much memory or processing power.
- **Easier to change for different screens:** moving a widget is a matter of changing one alignment. The same widgets can be arranged next to each other on a wide display and on top of each other on a narrow one, without rebuilding the tree.

```c
static void arrange_widgets(struct Context* ctx) {
    const int32_t gap = lvgl_theme_lerp(LV_DPX(4), LV_DPX(16), lvgl_theme_get_spacing());
    lv_obj_align(ctx->toolbar, LV_ALIGN_TOP_MID, 0, 0);
    lv_obj_align_to(ctx->icon, ctx->toolbar, LV_ALIGN_OUT_BOTTOM_LEFT, gap, gap);
    if (lv_obj_get_width(ctx->parent) > lv_obj_get_height(ctx->parent)) {
        // Wide display: the text is next to the icon
        lv_obj_align_to(ctx->text, ctx->icon, LV_ALIGN_OUT_RIGHT_MID, gap, 0);
    } else {
        // Narrow display: the text is below the icon
        lv_obj_align_to(ctx->text, ctx->icon, LV_ALIGN_OUT_BOTTOM_LEFT, 0, gap);
    }
}
```

Unlike a flex layout, an alignment is applied when you call it, and isn't updated when the widgets change. Call your arrange function again when something that it depends on changes, such as the size of the parent (`LV_EVENT_SIZE_CHANGED`, which also happens when the display rotates) or the text of a label that other widgets are aligned to. When widgets have `LV_SIZE_CONTENT` as a size, call `lv_obj_update_layout()` first, so the sizes that you align to are up to date.

Keep using a flex layout for a group of items that you add and remove, such as list items or chips. There, the layout does the work that you'd otherwise do yourself.

## System bars

The window manager shows the statusbar and a page bar around your window (`<lvgl_window_manager/system_bars.h>`). On wide displays the statusbar is a strip on the left and the page bar is at the bottom of that strip. Otherwise the statusbar is on top and the page bar is below your window. The user can align the system bars to the left (the default) or to the right in the Appearance settings. On the right, the strip is on the right and the page bar's buttons are mirrored. You don't have to handle any of this: the page bar follows the layout and the alignment by itself. `system_bars_get_layout()` and `system_bars_get_alignment()` tell you what is shown, e.g. to place a widget next to the strip. On displays with rounded corners the bars are made thicker, so that the app area stays clear of the corners (see [Insets](insets.md)).

The page bar can show two things for your app, and it only shows up while it has a button to show:

- **Page buttons:** a previous and a next button, for apps that have pages (a paged grid, for example). You show or hide both at once, and set what they do:

```c
static void on_previous(void* user_data) { /* go to the previous page */ }
static void on_next(void* user_data) { /* go to the next page */ }

static void create_widgets(lv_obj_t* parent, void* user_data) {
    // ...
    system_bars_set_page_button_callbacks(on_previous, on_next, user_data);
    system_bars_set_page_buttons_visible(page_count > 1);
}
```

Call `system_bars_set_page_buttons_visible()` again when the number of pages changes.

- **Main action:** one icon button for the action that your app wants within reach, such as the launcher's button that switches between apps and settings. It's hidden until you set it. Call it again to change the icon, or pass `NULL` as the icon to hide it:

```c
system_bars_set_main_action(LVGL_ICON_SHARED_SETTINGS, on_main_action_pressed, user_data);
```

The page bar also has a **notifications button** that belongs to the system, not to your app. It stays across apps and windows. See [Notifications](notifications.md) to post notifications. The owner of the system bars shows it with `system_bars_set_notification_visible()`, switches it to its unread icon with `system_bars_set_notification_unread()`, and receives the press through `SystemBarsConfig.show_notifications`.

The callbacks run on the LVGL task, with the LVGL lock held. The window manager resets the page buttons and the main action when your window's widgets are deleted, so set them in `create_widgets` every time. `system_bars_set_statusbar_visible()` hides the statusbar for a full screen app. Show it again when your widgets are destroyed.

## Dialogs

`<lvgl_window_manager/dialog.h>` shows a dialog over your own window, without starting another app. The dialog is a card on a dimmed backdrop. While it is shown it has its own focus group, so the keyboard and encoder can't reach your widgets, and a pointer can't reach them through the backdrop. Your window isn't buried, so your widgets and their pointers stay valid.

```c
static void on_result(int32_t button_index, void* user_data) {
    // Runs on the dialog's own task. WINDOW_DIALOG_DISMISSED when no button was pressed.
    Context* ctx = user_data;
    ctx->deleteConfirmed = button_index == 0;
    task_event_group_signal(ctx->event_group, ctx->dialog_bit);
}

const char* const buttons[] = { "Delete", "Cancel" };
window_manager_alert_dialog(app_instance_id, "Delete file", "This can't be undone.", buttons, 2, on_result, ctx);
```

- `window_manager_file_dialog()` picks files or folders, see [File dialog](#file-dialog).
- `window_manager_alert_dialog()` shows a title, a message and buttons. `window_manager_input_dialog()` adds a text field and the buttons OK and Cancel. The result function gets `confirmed` and the text. Enter in the text field acts as OK. `window_manager_selection_dialog()` shows a list of items and gives the index of the selected one. With one item, nothing is shown and the result is that item.
- The calls don't block, so you can call them from any task and from LVGL callbacks. The texts are copied.
- Only one dialog is shown at a time, and your app needs a window that is topmost. Otherwise the call fails with `ERROR_RESOURCE_BUSY` or `ERROR_INVALID_STATE`.
- A dialog closes when a button is pressed, when the backdrop is clicked, when Escape is pressed, or when your window stops being topmost. The last three give `WINDOW_DIALOG_DISMISSED` (-1). `window_manager_dialog_dismiss()` closes it from code.
- Every dialog runs on a task of its own, and the result function runs on that task after the dialog is gone and the focus is back with your app. The LVGL lock isn't held, so the function can show another dialog or do slow work. It is usually simplest to store the result and signal your own event group, so your event loop continues.
- When your app removes its window while a dialog is shown, the dialog is closed without calling the result function, so it never sees your freed state.

The built-in dialog apps ([System dialogs](fundamentals.md#system-dialogs)) are deprecated. They still work for apps that start them by id.

### File dialog

`window_manager_file_dialog()` lets the user pick files or folders, or name a new file:

```c
static void on_file_picked(const char* const* paths, uint32_t path_count, void* user_data) {
    // Runs on the dialog's own task. path_count is 0 when the dialog was dismissed.
    // The paths are only valid during this call, so copy what you need.
    struct Context* ctx = user_data;
    snprintf(ctx->picked_path, sizeof(ctx->picked_path), "%s", path_count > 0 ? paths[0] : "");
    task_event_group_signal(ctx->event_group, ctx->file_bit);
}

static const char* const extensions[] = { "txt", "md" };
const struct WindowFileDialogOptions options = {
    .flags = WINDOW_FILE_DIALOG_NEW_FILE,
    .path = directory,
    .name = "notes.txt",
    .extensions = extensions,
    .extension_count = 2,
};
window_manager_file_dialog(app_instance_id, &options, on_file_picked, ctx);
```

Pass `NULL` as the options to pick one existing file, starting at the root of the data. The options and their strings are copied.

| Field | Meaning |
|---|---|
| `flags` | A combination of the flags below, or 0 to pick one existing file. |
| `path` | The folder that is shown first, or `NULL` for the root of the data. |
| `name` | The text that the name field starts with, or `NULL`. Only used with `WINDOW_FILE_DIALOG_NEW_FILE`. |
| `extensions`, `extension_count` | Only allow files with these extensions. The leading dot is optional and the match ignores case. 0 allows every file. Folders are always shown, so the user can navigate. A name that the user types needs one of the extensions too. |

| Flag | Effect |
|---|---|
| `WINDOW_FILE_DIALOG_NEW_FILE` | Adds a name field, to pick a path that doesn't exist yet (for "save as"). |
| `WINDOW_FILE_DIALOG_FOLDER` | Allows picking the folder that is shown. With a name field, leave it empty to pick the folder. |
| `WINDOW_FILE_DIALOG_NO_FILES` | Doesn't allow picking files. With `WINDOW_FILE_DIALOG_FOLDER` this makes a folder picker. |
| `WINDOW_FILE_DIALOG_MULTIPLE` | Allows picking more than one file. The selection is kept while navigating between folders. |

- The dialog doesn't ask before an existing file is picked with `WINDOW_FILE_DIALOG_NEW_FILE`. Ask the user yourself before you overwrite it.
- A selection that isn't allowed, e.g. a file that doesn't exist, is shown as an error in the dialog, which stays open.
- On small displays the dialog fills the area of your app. While it is shown, it uses the page buttons of the [system bars](#system-bars), and hides the main action. Yours are restored when it closes.
- Your result function runs after the dialog is gone, and another dialog can be shown before your task handled the result. When your app keeps state that belongs to a request, such as whether it is opening or saving, don't start another request until the result was used.

## Fonts and icons

Tactility has three text sizes and several icon fonts, all scaled from the device's default font size (`<lvgl/fonts.h>`):

```c
lv_obj_set_style_text_font(label, lvgl_get_text_font(FONT_SIZE_LARGE), LV_STATE_DEFAULT);
```

- Text: `FONT_SIZE_SMALL`, `FONT_SIZE_DEFAULT` and `FONT_SIZE_LARGE`.
- Icons: [Material Symbols](https://fonts.google.com/icons), with defines in `<lvgl/icons/shared.h>` (e.g. `LVGL_ICON_SHARED_SETTINGS`). Use them as label text with `lvgl_get_shared_icon_default_font()` or `lvgl_get_shared_icon_large_font()`.

Only the icons that Tactility uses are included. See [Icons and Fonts](../os-development/icons-and-fonts.md) for how to add one.

## Theme

The theme styles all widgets. Users can switch between light and dark mode and choose the colors in the Appearance settings, and monochrome displays use a monochrome theme.

To look right in all of them:
- Don't hardcode colors. Use the theme's styling, or take colors from the theme with `lv_theme_get_color_primary(obj)` and `lv_theme_get_color_secondary(obj)`.
- Check `lvgl_theme_is_mono()` (`<lvgl/theme.h>`) before using colors that only make sense on a color display.
- The theme draws the selection outline of everything that can be selected, with one width: 2 dp, or 1 dp when the UI size is below 40. Let the theme do it, for example by using a card or an icon button for something that can be selected.

## Input

Not every device has a touchscreen: some have a keyboard, a trackball, an encoder wheel or a few buttons. See [Input and Focus](input.md) to make your app work with all of them.
