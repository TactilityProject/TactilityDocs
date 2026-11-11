# Event Design

Tactility's components tell each other about changes with events: an app is asked to close, Wi-Fi connects, a GPS fix arrives, the time changes. This page explains how events are delivered, and why Tactility prefers **subscriptions that you poll** over **callbacks**.

## The problem with callbacks

With a callback, the component that has news calls your function directly. That's simple, but your code then runs at the wrong place and time:

- **On someone else's task, with someone else's stack.** The callback runs on the task that emitted the event: a driver task, a timer task, the LVGL task or the system event task. Their stacks are small (for example 3 KB for ESP-IDF's system event task, and 5 KB for the FreeRTOS timer task) and shared by everything that runs there. A callback that uses a bit too much stack, e.g. a buffer on the stack, a `printf()` or a few nested calls, overflows it. That crashes the system in a place that has nothing to do with the cause, which is hard to debug.
- **Sometimes in an interrupt.** Then almost nothing is allowed: no blocking, no allocations, no logging.
- **It blocks the emitter.** While your callback runs, the emitting task can't do anything else. A slow callback delays other subscribers, input handling or rendering.
- **Deadlocks.** The emitter often holds a lock while calling you. If your callback takes a lock that another task holds while it waits for the emitter's lock, both tasks wait forever.
- **Lifetime.** A callback can still be running, or be about to run, while your object is being destroyed. Making that safe takes careful synchronization in every subscriber.

## Subscriptions

Instead, Tactility's event sources queue events for each subscriber, and wake the subscriber's own task. The subscriber handles them on its own task, with its own stack, whenever it's ready:

1. Create a `TaskEventGroup` for your task (`<tactility/concurrent/task_event_group.h>`).
2. Subscribe to one or more event sources with it. Each subscription claims its own bit in the group.
3. Wait for any bit with `task_event_group_wait_any()`.
4. Poll every subscription until it's empty, and handle the events.

```c
struct TaskEventGroup event_group = {0};
task_event_group_construct(&event_group);

struct AppEventSubscription app_sub = {0};
check(app_event_subscribe(&app_sub, &event_group) == ERROR_NONE);

struct WifiEventSubscription wifi_sub = {0};
check(wifi_event_subscribe(wifi_device, &wifi_sub, &event_group) == ERROR_NONE);

bool should_close = false;
while (!should_close) {
    task_event_group_wait_any(&event_group, NULL, portMAX_DELAY);

    struct AppEvent app_event;
    while (app_event_poll(&app_sub, &app_event) == ERROR_NONE) {
        if (app_event.type == APP_EVENT_CLOSE) {
            should_close = true;
        }
    }

    struct WifiEvent wifi_event;
    while (wifi_event_poll(&wifi_sub, &wifi_event) == ERROR_NONE) {
        // Handle the Wi-Fi event on our own task
    }
}

wifi_event_unsubscribe(wifi_device, &wifi_sub);
check(app_event_unsubscribe(&app_sub) == ERROR_NONE);
task_event_group_destruct(&event_group);
```

This way:
- One task waits for many sources with a single blocking call.
- The emitter only queues the event and sets a bit, so it never waits for subscribers.
- Your code runs on your task, with the stack size you chose, and can block, allocate, log and take locks.
- Unsubscribing removes the queue: no event arrives afterwards.

The subscription structs are owned by the caller, and need no heap allocation. They must stay alive, at the same address, until they're unsubscribed.

### Event sources

| Events | Subscribe | Poll |
|---|---|---|
| App lifecycle and results | `app_event_subscribe()` | `app_event_poll()` |
| System events (e.g. time changed) | `system_event_subscribe()` | `system_event_poll()` |
| Wi-Fi | `wifi_event_subscribe()` | `wifi_event_poll()` |
| Bluetooth | `bluetooth_event_subscribe()` | `bluetooth_event_poll()` |
| App streams (another app's output) | `app_stream_subscribe()` | `app_stream_read()` |

### Queue sizes

Each subscription has a small queue (e.g. 4 events for Wi-Fi and app events). When a subscriber doesn't keep up, new events for it are dropped. So:
- Drain every subscription completely after each wake-up: one wake-up can mean several events.
- Don't do slow work between waking up and polling. Poll first, then process.
- Don't rely on getting every intermediate state: read the current state from the source when you need it to be accurate.

## When callbacks are still used

Some APIs still take a callback, where nothing else is practical: LVGL's widget events (which run on the LVGL task, with the LVGL lock held), interrupt handlers, timers and some legacy APIs (e.g. `system_event_callback_add()`). When you write one:
- Keep it short, and use little stack.
- Don't block, and don't take locks that might be held while the emitter waits for you.
- Hand the actual work over to your own task: set a bit in a `TaskEventGroup` (`task_event_group_signal()` is interrupt-safe) or queue a message, and let the task do the rest.

## When you emit events

When you write a component that others need to hear from (a driver, a service), offer a subscription instead of a callback:
- Queue events per subscriber by value, and signal the subscriber's bit with `task_event_group_signal()`.
- Never wait for a subscriber: when its queue is full, drop the event for that subscriber.
- Protect the subscriber list with a mutex, but never call into subscriber code while holding it.

`wifi_event_*()` in `TactilityKernel` is a complete example.
