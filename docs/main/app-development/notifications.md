# App Development - Notifications

Apps and services can post notifications with `<notification/notification.h>`. The user sees them in the [system menu](../user-guide/notifications.md). The module has no UI of its own: it keeps the most recent notifications and tells subscribers about changes.

## Sending

A notification is built in a context, like an app is started with an `AppStartContext`, and then sent:

```c
#include <notification/notification.h>

struct NotificationContext context = notification_context_for_app("com.example.myapp", "Download finished");
notification_context_set_title(&context, "Downloads");
notification_context_set_severity(&context, NOTIFICATION_SEVERITY_INFO);

uint32_t id = 0;
error_t error = notification_send(&context, &id);
```

- Use `notification_context_for_service()` for a service. The id is the id of your app or service, and the user sees it as the sender.
- The message can't be empty. The title is optional.
- Text that is longer than its limit is cut at a character boundary of UTF-8 (`NOTIFICATION_TITLE_MAX_LENGTH`, `NOTIFICATION_MESSAGE_MAX_LENGTH` and `NOTIFICATION_SOURCE_ID_MAX_LENGTH`). Translate text with `tr()` before you pass it.
- On failure the context is unchanged and you still own it. `ERROR_NOT_ALLOWED` means that the user turned the notifications of your app off. Free a context that you don't send with `notification_context_destroy()`.
- The first notification of a sender adds it to the list in **Settings → Notifications**.

## Data

A notification can carry key/value data in a `Bundle` (`<tactility/bundle.h>`), for example what you need to open the right screen later. The module doesn't interpret it, and keys and values have no length limit. A notification without data costs nothing.

```c
Bundle* data = notification_context_get_data(&context);
bundle_put_string(data, "peer", "a1b2c3");
bundle_put_int32(data, "count", 3);
```

**Ownership:** the context owns the Bundle until you send the notification. A successful `notification_send()` or `notification_update()` transfers it to the notification system and clears the context's pointer. After that, don't use it, free it, or keep a pointer to it. If sending fails (or you never send), you still own it: free it with `notification_context_destroy()`. To read the data later, use `notification_get()`, which gives the reader its own clone that it frees with `notification_release()`.

## Actions

Set a function that runs when the user taps the notification:

```c
static void on_tapped(uint32_t notification_id, void* user_data) {
    // Forward to a task of your own and return
}

notification_context_set_action(&context, on_tapped, NULL);
```

The UI calls it on its own task with a small call stack, while it holds locks. The function must only forward the request, for example by signalling an event group or queueing it on a dispatcher, and return. It mustn't block, read files or take a lot of stack.

The function must stay valid for as long as the notification is listed. An app that is unloaded must dismiss its notifications first.

By default the UI removes a notification after its action returned. Call `notification_context_set_sticky(&context, true)` to keep it. You then decide when it goes with `notification_dismiss(id)`, for example when what it reports is resolved. The "Clear" button of the system menu leaves it alone. A sticky notification is also what you need when the task that you forward to reads the notification, as a non sticky one is already gone by then.

## Updating

Change a notification later with `notification_update()`:

```c
struct NotificationContext update = notification_context_for_app("com.example.myapp", "2 downloads finished");
bundle_put_int32(notification_context_get_data(&update), "count", 2);
error_t error = notification_update(id, &update, true);
```

- The notification keeps its id. Ownership of the Bundle of the context transfers to it on success (the Bundle that it had before is freed), and subscribers get `NOTIFICATION_EVENT_UPDATED`, with `event.bumped` set when the update was made with `bump`. The system bar treats a bumped update like a new notification for its unread icon.
- `bump` decides where it ends up. `true` moves it to the newest position and refreshes its timestamps, like a new notification. `false` keeps its place and timestamps, so a notification that changes often doesn't jump around the list.
- `ERROR_NOT_FOUND` means it was dismissed or removed. You still own the context, and can send it as a new notification.

To change only a part of it, start from what is stored:

```c
struct NotificationContext update;
if (notification_context_for_notification(id, &update) == ERROR_NONE) {
    notification_context_set_title(&update, "Downloads (paused)");
    notification_update(id, &update, false);
}
```

`notification_context_for_notification()` fills the context with the title, message, severity, action, sticky flag and a clone of the data. Free it with `notification_context_destroy()` if you don't send it.

## Reading and dismissing

```c
struct Notification notifications[NOTIFICATION_HISTORY_CAPACITY];
size_t count = 0;
notification_get_all(notifications, NOTIFICATION_HISTORY_CAPACITY, &count); // newest first
// ...
for (size_t i = 0; i < count; i++) {
    notification_release(&notifications[i]);
}
```

- `notification_get(id, &notification)` reads one. Release every notification that you read.
- `notification_get_count()` is cheaper than reading them.
- `notification_dismiss(id)` and `notification_dismiss_all()` remove notifications. They wait for an action of the notification that runs on another task, so the sender can free what the action uses once they return. Don't call them from something that such an action waits for. `notification_dismiss_unless_sticky(id)` and `notification_dismiss_non_sticky()` leave sticky ones alone, checking the flag under the module's lock. A UI that clears or dismisses after a tap should use them, so a sender that made a notification sticky in the meantime is respected. `notification_invoke_action(id)` runs the action, for a UI that lists them.
- The last 16 notifications are kept in memory. The oldest goes when a new one doesn't fit. They aren't stored across restarts.

## Subscribing

Subscribe like you do for mesh and radio events: wait on an event group and drain with a non-blocking poll.

```c
struct TaskEventGroup group;
task_event_group_construct(&group);

struct NotificationSubscription subscription;
notification_subscribe(&subscription, &group);

// Wait for the group's bit, then:
struct NotificationEvent event;
while (notification_poll(&subscription, &event) == ERROR_NONE) {
    // event.type is NOTIFICATION_EVENT_POSTED, _DISMISSED, _CLEARED or _UPDATED
    // event.id is the notification, 0 for _CLEARED
}

notification_unsubscribe(&subscription);
```

- Events have an `order` that increases with every event, and `notification_get_event_order()` gives the order of the latest one. Comparing them tells what happened before what, which timestamps can't when they are equal.
- Events carry only the id. Read the content with `notification_get()`, which can return `ERROR_NOT_FOUND` when it is gone already.
- A notification that is removed because the history is full emits `NOTIFICATION_EVENT_DISMISSED`.
- The queue holds `NOTIFICATION_EVENT_QUEUE_CAPACITY` events. When it is full the newest events are dropped. A subscriber that suspects it missed some rebuilds from `notification_get_all()`.

## Senders

`notification_get_sources()` lists the apps and services that sent a notification at least once, with whether they are enabled. `notification_set_source_enabled()` turns one on or off and removes its pending notifications when it is turned off. That is what **Settings → Notifications** uses. Don't call `notification_get_sources()` on the LVGL thread, as it can read from storage.
