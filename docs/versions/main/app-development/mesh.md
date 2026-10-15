# App Development - Mesh

Apps can send and receive text messages over the mesh network with `<mesh/mesh.h>`. The API is the same for every mesh protocol (MeshCore, Meshtastic): the mesh service runs the protocol, stores the messages and reports events.

See [Mesh Networking](user-guide/mesh.md) for what the user sets up, and which devices support it.

## Availability

The mesh API only exists in firmware for devices with mesh support. Check `MESH_API_VERSION` when your app depends on newer functions.

Check the state before you send:

```c
#include <mesh/mesh.h>

if (mesh_get_state() != MESH_STATE_ON) {
    // Show mesh_state_to_string(mesh_get_state()) to the user
}
```

| State | Meaning |
|---|---|
| `MESH_STATE_ON` | Running and connected |
| `MESH_STATE_OFF` | Turned off by the user |
| `MESH_STATE_NO_RADIO` | No radio is available |
| `MESH_STATE_RADIO_BUSY` | Another part of the system owns the radio |
| `MESH_STATE_NO_REGION` | The user hasn't set a region yet |
| `MESH_STATE_NO_BACKEND` | No mesh network is selected |
| `MESH_STATE_ERROR` | The radio or the protocol failed to start |

Settings like the enabled state, the protocol and the preset belong to the user. Apps can read them (`mesh_is_enabled()`, `mesh_get_backend()`, `mesh_get_preset()`), but should leave changing them to the Mesh settings.

## Sending

```c
uint32_t seq = 0;
// To a channel: pass NULL as the recipient
error_t error = mesh_send_text(NULL, 0, "Hello mesh", &seq);
```

- Pass a `MeshAddress` as the recipient for a direct message, e.g. the address of a node from `mesh_get_nodes()`.
- Text is limited to `MESH_TEXT_MAX_LENGTH` bytes (`ERROR_OUT_OF_RANGE` otherwise).
- The message is stored right away, and `seq` identifies it from then on. The radio sends it later.
- `mesh_cancel(seq)` cancels a message that wasn't sent yet.

## Delivery state

Each stored message has a `MeshDeliveryState`:

| State | Meaning |
|---|---|
| `MESH_DELIVERY_RECEIVED` | An incoming message |
| `MESH_DELIVERY_QUEUED` | Waiting for the radio |
| `MESH_DELIVERY_BLOCKED` | Sent with a protocol that isn't active anymore. It's sent when that protocol becomes active again |
| `MESH_DELIVERY_SENT` | Transmitted |
| `MESH_DELIVERY_DELIVERED` | Acknowledged by the recipient (direct messages) |
| `MESH_DELIVERY_FAILED` | Not delivered, e.g. no acknowledgement in time |
| `MESH_DELIVERY_CANCELLED` | Cancelled with `mesh_cancel()` |

Channel messages are never acknowledged, so they stay `SENT`.

## Reading messages

Messages are stored durably, so your app can show the history when it starts:

```c
MeshMessage messages[20];
size_t count = 0;
// Newest first. Pass the seq of the oldest message you have to page further back.
if (mesh_history_get(0, messages, 20, &count) == ERROR_NONE) {
    for (size_t i = 0; i < count; i++) {
        // messages[i].text, .sender_name, .channel, .outgoing, .delivery, .wall_time, ...
    }
}
```

`mesh_message_get(seq, &message)` reads a single message.

- `peer` is the sender of an incoming direct message, or the recipient of an outgoing one. It's empty for channel messages.
- `wall_time` is in seconds since the Unix epoch. `time_source` says where it came from, and is `MESH_TIME_SOURCE_NONE` when the time is unknown. `uptime_ms` is always set.
- `snr` is `NAN` when the radio doesn't report it.

Reading the history waits for the mesh service. Call it from your app's task, not while holding the LVGL lock, and for a long history, consider loading it in a background thread.

## Events

Events use the same subscribe and poll pattern as the rest of Tactility: subscribe with your app's event group, wait on it, then drain the queue.

```c
TaskEventGroup event_group;
task_event_group_construct(&event_group);
MeshEventSubscription mesh_events = {};
mesh_event_subscribe(&mesh_events, &event_group);

while (running) {
    task_event_group_wait_any(&event_group, NULL, portMAX_DELAY);
    MeshEvent event;
    while (mesh_event_poll(&mesh_events, &event) == ERROR_NONE) {
        switch (event.type) {
            case MESH_EVENT_MESSAGE:  // event.seq: read it with mesh_message_get()
            case MESH_EVENT_DELIVERY: // event.seq changed to event.delivery
            case MESH_EVENT_STATE:    // event.state
            case MESH_EVENT_NODE:     // the node list changed
            case MESH_EVENT_FRAME:    // event.frame: an advert or an unreadable frame
                break;
        }
    }
}

mesh_event_unsubscribe(&mesh_events);
task_event_group_destruct(&event_group);
```

- The queue holds `MESH_EVENT_QUEUE_CAPACITY` (8) events. Drain it promptly.
- `MESH_EVENT_FRAME` reports frames that aren't messages, and aren't stored: adverts (`MESH_FRAME_ADVERT`, with `frame.from` and `frame.name`) and frames that the protocol couldn't read (`MESH_FRAME_UNREADABLE`).
- Subscribe before reading the history, so no message falls between the two. A message can then appear in both: skip duplicates by `seq`.

## Nodes and channels

- `mesh_get_nodes()` returns the nodes heard since the protocol started, with their name, last signal and when they were last heard.
- `mesh_get_channels()` returns the channels of the active protocol. A message's `channel` field is the channel's `index`.
- `mesh_set_channel()` adds or replaces a channel. How the name and key combine depends on the protocol. For a MeshCore hashtag channel, pass a name like `#test` with `key_length` 0: the key is derived from the name.

## Raw frames

To use protocol features that the API doesn't cover, `mesh_raw_send(backend, data, length)` sends a protocol-specific frame, when that protocol is active. Received frames are available as raw radio packets through `radio_rx_event_subscribe()` on the radio device (see the [Radio](driver-development/radio.md) driver page).
