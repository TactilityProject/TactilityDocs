# Mesh Backends

The mesh stack has three layers:

```
Apps                        <mesh/mesh.h> (app SDK)
mesh-module                 service, store, radio management, settings
  mesh-meshcore-module      MeshCore backend (Apache-2.0)
  mesh-meshtastic-module    Meshtastic backend (GPL-3.0)
TactilityKernel radio.h     radio drivers (SX1262, CC1101, mock)
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
- **The radio.** The service claims the first started radio that can send and receive LoRa with `radio_acquire(device, "mesh")`. It applies the active backend's radio profile, and turns on listen-before-talk. A radio that starts later (e.g. after a hotplug probe) is picked up by the service tick.
- **The region.** The radio stays off while no region is set (`MESH_STATE_NO_REGION`). Tactility persists the region in `settings/radio.properties`, and applies it with `radio_set_region()` before the service starts. The kernel then rejects frequencies and power outside the region.
- **The airtime budget.** Transmissions are limited to the duty cycle of the region over a sliding hour.
- **The store.** See below.

Only one backend is active, because the protocols use different sync words and radio settings. Switching backends turns the radio off, applies the new profile and turns it on again. Outgoing messages of the previous backend that weren't sent become `MESH_DELIVERY_BLOCKED`, and resume when that backend is active again.

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
| `get_radio_profile(backend, region, preset, profile)` | The modulation, frequency, bandwidth, spreading factor, coding rate, sync word, preamble and power for a region. `ERROR_NOT_SUPPORTED` for an unsupported region |
| `on_start(backend)` | The radio is on with the backend's profile, e.g. to send an advert |
| `on_receive(backend, data, length, rssi, snr)` | A frame was received. Return `false` when it couldn't be read, so apps see it as `MESH_FRAME_UNREADABLE` |
| `on_tick(backend)` | Called about once per second, for timers like adverts and acknowledgement timeouts |
| `send_text(backend, seq, to, channel, text)` | Encode a message and transmit it with `mesh_host_transmit()`, passing `seq` along |
| `get_channels`, `set_channel` | Optional channel support |

The host functions report back to the service:

| Function | Purpose |
|---|---|
| `mesh_host_transmit(host, data, length, seq)` | Queue a frame. The message `seq` becomes `SENT` once the frame is out. Pass 0 for frames that don't belong to a message |
| `mesh_host_receive_text(host, from, channel, name, text, rssi, snr, sender_time)` | Store an incoming message |
| `mesh_host_set_delivery(host, seq, delivery)` | Update an outgoing message, e.g. `DELIVERED` when acknowledged, `FAILED` when an acknowledgement times out |
| `mesh_host_node_heard(...)`, `mesh_host_advert_heard(...)` | Update the node list. An advert also shows up as an event in apps |
| `mesh_host_get_data_path(host, child, path, size)` | A path in the backend's own data folder, e.g. for its identity and channels |
| `mesh_host_get_node_name(host, name, size)` | The name this node announces |

Guidelines:
- Allocate the backend state and its containers in PSRAM: `tt::newObject()` and the `tt::std` containers (`TactilityCpp/`).
- Every outgoing direct message that waits for an acknowledgement should end as `DELIVERED` or `FAILED`.
- Add the module to `Tactility/CMakeLists.txt`, start it in `InitServices.cpp` under `TT_FEATURE_MESH`, and give it a test target in `Tests/CMakeLists.txt`.

## The store

Messages are stored in `mesh-module`'s data folder as an append-only log:

- Records are buffered in RAM (PSRAM when available, 8 kB) and flushed every 30 seconds, or when the buffer is mostly full.
- The log is split into segments of 32 kB. The oldest segment is deleted when there are more than 16.
- A message is one record, and a delivery change is a small record that refers to it. The index is rebuilt at boot by scanning the segments.
- After a power loss during a flush, the last segment can end with a partial record. The scan stops there, and new records go to a new segment, so they aren't lost.

Records are stored as plain text, and the node list isn't stored.

## Build inclusion

Mesh is only built into firmware for devices that set `hardware.mesh=true` in `device.properties` (see [Device Properties](device-development/device-properties.md)). The build then defines `TT_FEATURE_MESH=1`, and every use of the mesh API in `Tactility` is inside `#if TT_FEATURE_MESH`. On other devices, nothing references the mesh modules, and the linker leaves them out.

The simulator always builds mesh, with a `mock,radio` device that loops transmissions back to other mock radios.

## Testing

The service, store and protocols have doctest suites in each module's `tests/` folder. The service tests use a loopback backend and two mock radios: one for the service and one that plays the remote node.
