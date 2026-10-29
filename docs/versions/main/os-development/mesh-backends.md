# Mesh Backends

The mesh stack has three layers:

```
Apps                        <mesh/mesh.h> (app SDK)
mesh-module                 service, store, radio management, settings
  mesh-meshcore-module      MeshCore backend (Apache-2.0)
  mesh-meshtastic-module    Meshtastic backend (GPL-3.0)
TactilityKernel radio.h     radio drivers (SX1262, CC1101, ESP-NOW, mock)
```

See [Mesh](app-development/mesh.md) for the app API, and [Radio](driver-development/radio.md) for the driver layer.

## Licensing

`mesh-module` and `mesh-meshcore-module` are Apache-2.0. `mesh-meshtastic-module` is GPL-3.0, because it follows the Meshtastic protocol implementation closely.

To keep GPL code out of the app SDK:
- Only `<mesh/mesh.h>` is exported to apps. Its symbols are in `mesh-module`'s symbol table.
- `<mesh/backend.h>` is internal. Backend types and headers never cross into the SDK, and payloads cross as encoded bytes.
- Backends register at runtime, so `mesh-module` doesn't depend on any of them.

## The service

`mesh-module` runs the `tactility.mesh` service. It starts when the user enables mesh (`mesh_set_enabled()`), and owns:

- **One thread.** Every backend function runs on it, and backends call the `mesh_host_*()` functions only from those calls, so backends need no locking. API calls from apps that need backend state (e.g. `mesh_get_channels()`) are posted to the thread and waited for.
- **The radio.** The service claims a started radio that can send and receive LoRa or ESP-NOW with `radio_acquire(device, "mesh")`. The default is the first radio that isn't ESP-NOW, or the user's choice by device name. It applies the active backend's radio profile, and turns on listen-before-talk. A radio that starts later (e.g. after a hotplug probe) is picked up by the service tick.
- **The region.** A LoRa radio stays off while no region is set (`MESH_STATE_NO_REGION`). ESP-NOW doesn't need one. Tactility persists the region in `settings/radio.properties`, and applies it with `radio_set_region()` before the service starts. The kernel then rejects frequencies and power outside the region.
- **The airtime budget.** Transmissions are limited to the duty cycle of the region over a sliding hour.
- **The store.** See below.

Only one backend is active, because the protocols use different sync words and radio settings. Switching backends or radios turns the radio off, applies the new profile and turns it on again. Presets only apply while a LoRa radio is in use.

The radio profile that the service applies is the one of the backend's preset, with the user's radio settings on top (frequency, bandwidth, spreading factor, coding rate and power). The service limits the power to the limit of the region band that holds the channel, because the kernel rejects more. It validates user choices before it saves them: a setting or a preset whose channel isn't in one band of the region is refused (`ERROR_OUT_OF_RANGE` and `ERROR_NOT_SUPPORTED`), so the radio never ends in `MESH_STATE_ERROR` because of a choice that the service accepted. Outgoing messages of the previous backend that weren't sent become `MESH_DELIVERY_BLOCKED`, and resume when that backend is active again.

## Writing a backend

A backend is a kernel module that registers a `MeshBackendApi` in its module's `start()`:

```c
static const MeshBackendApi api = {
    .id = "example",
    .create = create,
    .destroy = destroy,
    .presets = NULL,
    .get_radio_profile = get_radio_profile,
    .on_start = on_start,
    .on_receive = on_receive,
    .on_tick = on_tick,
    .send_text = send_text,
    .get_channels = NULL,
    .set_channel = NULL,
};

static error_t start(void) {
    return mesh_backend_register(&api);
}
```

| Function | Purpose |
|---|---|
| `create(host)` | Create the backend state when the backend becomes active. `host` is valid until `destroy()` |
| `destroy(backend)` | Free the state, when another backend becomes active or the service stops |
| `presets` | Optional `NULL`-terminated list of preset names. Index 0 is the default |
| `get_preset_region(preset, current, region)` | Optional. The region that a preset needs when it sets its own frequency, like the MeshCore country presets. Return `current` when it fits or the preset doesn't depend on the region, and `ERROR_NOT_SUPPORTED` when no region allows it. It can be called from any thread, so don't use the backend state |
| `get_preset_network(preset, network)` | Optional. The network parameters of a preset: the path hash size and the name of the region scope (empty for none). Same thread rule as `get_preset_region()` |
| `get_radio_profile(backend, region, modulation, preset, profile)` | The parameters for a region and modulation: frequency, bandwidth, spreading factor, coding rate, sync word, preamble and power for LoRa, or the `channel` and power for ESP-NOW. `ERROR_NOT_SUPPORTED` for an unsupported region, modulation or preset, including a preset whose channel doesn't fit the region. Return it for `RADIO_MODULATION_ESPNOW` only when the protocol has an ESP-NOW transport. `backend` is `NULL` when the service only asks what a backend that isn't active would run with, so it has to work without state. A backend that needs its state to choose the frequency can only give its defaults then |
| `on_start(backend)` | The radio is on with the backend's profile, e.g. to send an advert |
| `on_receive(backend, data, length, rssi, snr)` | A frame was received. Return `false` when it couldn't be read, so apps see it as `MESH_FRAME_UNREADABLE` |
| `on_tick(backend)` | Called about once per second, for timers like adverts and acknowledgement timeouts |
| `send_text(backend, seq, to, channel, text)` | Encode a message and transmit it with `mesh_host_transmit()`, passing `seq` along |
| `get_channels`, `set_channel`, `remove_channel` | Optional channel support. `remove_channel` returns `ERROR_INVALID_ARGUMENT` for a channel that the backend can't do without, e.g. Meshtastic's primary channel |
| `get_contact_uri(backend, contact, name, uri, size)` | Optional. A URI for a QR code of a contact, or of this node when `contact` is `NULL` |
| `is_valid_contact_address(backend, address)` | Optional. Whether an address can belong to a contact, e.g. a public key of the right length |
| `on_node_name_changed(backend)` | Optional. Announce the new name |

The host functions report back to the service:

| Function | Purpose |
|---|---|
| `mesh_host_transmit(host, data, length, seq)` | Queue a frame. The message `seq` becomes `SENT` once the frame is out. Pass 0 for frames that don't belong to a message |
| `mesh_host_receive_text(host, from, channel, name, text, rssi, snr, sender_time)` | Store an incoming message |
| `mesh_host_set_delivery(host, seq, delivery)` | Update an outgoing message, e.g. `DELIVERED` when acknowledged, `FAILED` when an acknowledgement times out |
| `mesh_host_node_heard(...)`, `mesh_host_advert_heard(...)` | Update the node list. An advert also shows up as an event in apps |
| `mesh_host_get_data_path(host, child, path, size)` | A path in the backend's own data folder, e.g. for its identity and channels |
| `mesh_host_get_node_name(host, name, size)` | The name this node announces |
| `mesh_host_get_network(host, network)` | The network parameters that the backend runs with: the preset's values with the user's settings applied. The scope is empty for none |

Guidelines:
- Allocate the backend state and its containers in PSRAM: `tt::newObject()` and the `tt::std` containers (`TactilityCpp/`).
- Every outgoing direct message that waits for an acknowledgement should end as `DELIVERED` or `FAILED`.
- Add the module to `Tactility/CMakeLists.txt`, start it in `InitServices.cpp`, and give it a test target in `Tests/CMakeLists.txt`.

## Settings

The settings of the service are in `settings.properties` in its user data folder. The enabled state, the selected backend, the node name and the radio are global. The preset and the radio and network settings are stored per backend, with the backend id as a prefix (e.g. `meshcore.preset`, `meshcore.frequency`, `meshcore.regionScope`). A backend that isn't selected keeps its settings.

- Selecting a preset clears the radio and network settings of that backend.
- Settings written before they were stored per backend have no prefix. They are moved once to the backend that was selected when they are first read, and no other backend reads the unprefixed keys.
- A setter saves first, and only then updates its cache and reconfigures the radio. A failed save returns an error and leaves things as they were.
- Each backend has an update mutex that a setter holds from reading the settings to committing them, so two updates of one backend can't overwrite each other. It is taken before the global lock, and the global lock isn't held during the file save. Saves of the file are serialized with a file lock, because saving rewrites the whole file.
- A settings file that can't be read isn't cached, so the next read tries again.

## Contacts and conversations

The service keeps the contacts per backend in `contacts.bin` and adds a node when it sends a direct message. Backends only validate addresses and build URIs. The store tags each record with its channel and peer hash, so `mesh_conversation_get()` reads one conversation without scanning the text.

## ESP-NOW

The ESP-NOW radio device is a driver of `platform-esp32` (`Platforms/platform-esp32/source/drivers/espnow/`). It uses the native ESP-NOW API, or the esp_hosted bridge on boards with a Wi-Fi co-processor, and shares the Wi-Fi radio with the other Wi-Fi users. It supports `RADIO_MODULATION_ESPNOW`, broadcasts unencrypted frames, and selects the Wi-Fi channel with `RADIO_PARAMETER_CHANNEL`. A MeshCore frame travels as one ESP-NOW packet, up to the 250 byte limit of ESP-NOW v1.

Transmissions count as sent once the Wi-Fi stack accepts them, as it reports no completion. Mesh doesn't apply a duty cycle to ESP-NOW. It estimates its airtime from the frame size.

## The store

Messages are stored in `mesh-module`'s data folder as an append-only log:

- Records are buffered in RAM (PSRAM when available, 8 kB) and flushed every 30 seconds, or when the buffer is mostly full.
- The log is split into segments of 32 kB. The oldest segment is deleted when there are more than 16.
- A message is one record, and a delivery change is a small record that refers to it. The index is rebuilt at boot by scanning the segments.
- After a power loss during a flush, the last segment can end with a partial record. The scan stops there, and new records go to a new segment, so they aren't lost.

Records are stored as plain text, and the node list isn't stored.

## Build inclusion

The mesh stack is built into the firmware of every device. It only starts when the user turns mesh on, and `mesh_is_available()` reports whether a radio exists. The simulator has a `mock,radio` device that delivers transmissions to other mock radios in the process.

## Testing

The service, store and protocols have doctest suites in each module's `tests/` folder. The service tests use a loopback backend and two mock radios: one for the service and one that plays the remote node. Besides messaging they cover the validation of presets and settings against the region, the per-backend settings and the migration of older settings.

The backend suites check that every preset can be used in a region that it selects (MeshCore) or is refused (Meshtastic), and that the transport code of a MeshCore region scope matches an independent calculation of the algorithm in the MeshCore firmware.
