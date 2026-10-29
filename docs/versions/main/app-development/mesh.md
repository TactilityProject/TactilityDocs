# App Development - Mesh

Apps can send and receive text messages over the mesh network with `<mesh/mesh.h>`. The API is the same for every mesh protocol (MeshCore, Meshtastic): the mesh service runs the protocol, stores the messages and reports events.

See [Mesh Networking](user-guide/mesh.md) for what the user sets up, and which devices support it.

## Availability

The mesh API only exists in firmware for devices with mesh support. Check `MESH_API_VERSION` when your app depends on newer functions. Version 2 added contacts, conversations, channel removal, contact URIs, the node name and radio selection. The preset functions take the id of a backend, and radio settings, network settings and `mesh_get_preset_region()` were added after that. Rebuild apps that use them.

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

Settings like the enabled state, the protocol and the preset belong to the user. Apps can read them (`mesh_is_enabled()`, `mesh_get_backend()`, `mesh_get_preset()`), but should leave changing them to the Mesh settings. See [Presets and radio settings](#presets-and-radio-settings).

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
            case MESH_EVENT_CONTACT:  // a contact was added or removed
            case MESH_EVENT_CHANNEL:  // a channel was added, replaced or removed
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

## Conversations

`mesh_conversation_get(peer, channel, before_seq, messages, max_count, &count)` reads one conversation, newest first. Pass a `MeshAddress` as `peer` for a direct conversation, or `NULL` and a channel index for a channel. It waits for the mesh service, like the history does.

## Contacts

Contacts are saved per backend and persisted. A node that sends a direct message is added automatically.

```c
MeshContact contacts[16];
size_t count = 0;
mesh_get_contacts(contacts, 16, &count);

mesh_add_contact(&address, "Alice");  // NULL name: taken from the nodes that were heard
mesh_remove_contact(&address);        // The stored messages remain
```

- `mesh_add_contact()` returns `ERROR_INVALID_ARGUMENT` when the backend doesn't accept the address, e.g. a public key of the wrong length. It also renames an existing contact.
- `MESH_EVENT_CONTACT` is posted when a contact is added or removed.
- `mesh_get_contact_uri(contact, uri, size)` returns a URI that other mesh apps scan as a QR code. Pass `NULL` for this node. It returns `ERROR_NOT_SUPPORTED` for a backend without one. Show it with the `lvgl_qr` widget (`<lvgl/widgets/qr.h>`), or start the QR Code app.

## Node name

`mesh_set_node_name()` and `mesh_get_node_name()` set and read the name this node announces. The default is `TactilityUser-` and 8 random lower case hexadecimal characters, generated once. A rename is announced again right away.

## Radios

`mesh_get_radio_count()` and `mesh_get_radio_name()` list the started radios that mesh can use: LoRa radios and ESP-NOW radios. `mesh_get_radio()` returns the radio in use and `mesh_set_radio()` selects one by name. The choice is persisted. A `NULL` or empty name selects the default: the first radio that isn't ESP-NOW, or the ESP-NOW radio when there is no other.

Presets only apply to LoRa. `mesh_get_preset_count()` reports 0 presets while an ESP-NOW radio is in use. A backend that doesn't support the radio (Meshtastic on ESP-NOW) leaves the state at `MESH_STATE_ERROR`.

## Presets and radio settings

Presets and settings are kept per backend, so a backend can be configured before it is selected. The functions take the id of a backend (`"meshcore"`, `"meshtastic"`), or `NULL` for the selected backend.

```c
char name[MESH_NAME_MAX_LENGTH + 1];
size_t count = mesh_get_preset_count("meshcore");
for (size_t i = 0; i < count; i++) {
    mesh_get_preset_name("meshcore", i, name, sizeof(name));
}
mesh_get_preset("meshcore", name, sizeof(name));  // The selected preset
```

**Selecting a preset**

`mesh_set_preset(backend, name)` selects a preset, persists it, and clears the radio and network settings of that backend. It returns:

- `ERROR_NOT_FOUND` when the backend has no such preset
- `ERROR_NOT_SUPPORTED` when the region of the radio doesn't allow the preset, e.g. a bandwidth that is wider than its band. Nothing changes then

A preset can need another region, e.g. the MeshCore preset "Netherlands" needs EU 868. `mesh_get_preset_region(backend, name, &region)` returns the region that the preset needs, or the current region when it fits already. Set the region first (`radio_settings_save_region()` or `settings::radio::saveRegion()`), and only then the preset, and stop when saving the region fails. `ERROR_NOT_SUPPORTED` means that no region allows the preset.

**Radio settings**

`struct MeshRadioSettings` has a frequency (Hz), bandwidth (Hz), spreading factor, coding rate (the denominator, 5 to 8) and power (dBm). A value of 0 uses the value of the preset.

- `mesh_set_radio_settings(backend, &settings)` persists settings, and reconfigures the radio when the backend is selected and the service is running. It returns `ERROR_OUT_OF_RANGE` when the region doesn't allow the channel or the power. The channel (frequency and bandwidth) must lie in one band of the region, and the power can't be above the limit of that band. Nothing is stored then.
- `mesh_get_radio_settings(backend, &settings)` returns what was set.
- `mesh_get_radio_parameters(backend, &parameters)` returns what the radio runs with or would run with: the values of the preset with the settings applied. For a backend that is running it returns the values of the radio. For other backends the values come from the preset alone, which can differ when the backend's state selects the frequency, like the primary channel of Meshtastic. It returns `ERROR_INVALID_STATE` when the radio doesn't use LoRa or has no region.

**Network settings**

`struct MeshNetworkSettings` has a path hash size (bytes per hop in a path, 1 to `MESH_PATH_HASH_SIZE_MAX`) and the name of a region scope. A backend ignores the ones it doesn't have.

- `mesh_set_network_settings(backend, &settings)` returns `ERROR_INVALID_ARGUMENT` for a path hash size outside the range. A path hash size of 0 and an empty scope use the value of the preset. `MESH_REGION_SCOPE_NONE` (`"*"`) turns the scope off.
- `mesh_get_network_settings()` returns what was set, and `mesh_get_network_parameters()` returns what the backend runs with: the preset's values with the settings applied. The scope is empty for none.

Settings are persisted before they are used, so a setter that fails to save leaves the radio and the network as they were.
## Nodes and channels

- `mesh_get_nodes()` returns the nodes heard since the protocol started, with their name, last signal and when they were last heard.
- `mesh_get_channels()` returns the channels of the active protocol. A message's `channel` field is the channel's `index`.
- `MESH_EVENT_CHANNEL` is posted when `mesh_set_channel()` or `mesh_remove_channel()` succeeds, from any app. Reload your channel list on it.
- `mesh_remove_channel(index)` leaves a channel. The stored messages remain. A backend can refuse to remove a channel it can't do without: Meshtastic's primary channel (0) returns `ERROR_INVALID_ARGUMENT`. MeshCore's "Public" channel can be removed. Add it again with `mesh_set_channel()`, the name `Public` and `key_length` 0.
- `mesh_set_channel()` adds or replaces a channel. How the name and key combine depends on the protocol. For a MeshCore hashtag channel, pass a name like `#test` with `key_length` 0: the key is derived from the name. For a private channel, pass a 16 byte key.

## Raw frames

To use protocol features that the API doesn't cover, `mesh_raw_send(backend, data, length)` sends a protocol-specific frame, when that protocol is active. Received frames are available as raw radio packets through `radio_rx_event_subscribe()` on the radio device (see the [Radio](driver-development/radio.md) driver page).
