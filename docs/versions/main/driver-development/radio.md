# Radio

A radio driver controls a packet radio transceiver, such as a Semtech SX1262 (LoRa, FSK), a TI CC1101 (FSK, OOK) or the ESP-NOW transport of the Wi-Fi radio. Consumers like the mesh service use the same API for every radio: they pick a modulation, set its parameters, turn the radio on, and then send and receive packets.

Read the [Kernel Concepts](kernel-concepts/driver.md) first for how [drivers](kernel-concepts/driver.md), [devices](kernel-concepts/device.md) and [modules](kernel-concepts/module.md) work in general.

Existing drivers to use as a reference:
- `Drivers/sx126x-module`: SX1262 (LoRa, FSK, LR-FHSS transmit only), built on RadioLib
- `Drivers/cc1101-module`: CC1101 (FSK, 4-FSK, OOK), built on RadioLib
- `Tactility/Source/service/espnow/EspNowRadio.cpp`: ESP-NOW (`RADIO_MODULATION_ESPNOW`) on top of the ESP-NOW service
- `Drivers/mock-drivers-module` (`mock,radio`): an in-process radio for the simulator and tests

## The driver

A radio driver is a `Driver` with `device_type = &RADIO_TYPE` and an `api` that points to a `RadioApi` (`tactility/drivers/radio.h`):

| Function | Purpose |
|---|---|
| `get_radio_state(device, state)` | The current `RadioState` |
| `set_enabled(device, enabled)` | Turn the radio on or off. Asynchronous: report progress through state events |
| `set_modulation(device, modulation)` / `get_modulation` | The modulation. Only allowed while the radio is off |
| `can_transmit(device, modulation)` / `can_receive` | Which modulations the hardware supports, per direction |
| `set_parameter(device, parameter, value)` / `get_parameter` | Tunable parameters, see below |
| `transmit(device, data, length, id)` | Queue a packet. The data is copied |
| `get_rssi(device, rssi)` | Optional: the instantaneous RSSI (the noise floor when idle) |
| `is_receiving(device, receiving)` | Optional: whether a preamble or sync word is being received right now |

Leave the optional functions `NULL` when the hardware can't support them. The kernel wrappers (`radio_get_rssi()`, `radio_is_receiving()`) then return `ERROR_NOT_SUPPORTED`.

## State

The radio goes through these states:

```
OFF -> ON_PENDING -> ON -> OFF_PENDING -> OFF
                \-> ERROR
```

- `set_enabled(true)` returns right away and moves to `RADIO_STATE_ON_PENDING`. The modem is initialized in the background, after which the state becomes `RADIO_STATE_ON`, or `RADIO_STATE_ERROR` when it failed.
- `set_enabled(true)` returns `ERROR_INVALID_STATE` when no modulation was set.
- Emit every change with `radio_state_event_emit(device, state)`.

## Modulation and parameters

`set_modulation()` returns `ERROR_NOT_SUPPORTED` for a modulation that the hardware can neither send nor receive. A modulation can be one-directional: the SX1262 transmits LR-FHSS but can't receive it, so `can_transmit()` and `can_receive()` are reported separately.

Parameters are `int32_t` values in base SI units (Hz, bit/s, dBm), so a frequency like 906.875 MHz is stored exactly. Which parameters apply depends on the modulation:

| Parameter | Unit | Applies to |
|---|---|---|
| `RADIO_PARAMETER_FREQUENCY` | Hz | All |
| `RADIO_PARAMETER_POWER` | dBm | All |
| `RADIO_PARAMETER_BANDWIDTH` | Hz | LoRa, FSK family |
| `RADIO_PARAMETER_SPREADING_FACTOR` | 7-12 | LoRa |
| `RADIO_PARAMETER_CODING_RATE` | 5-8 (4/5 to 4/8) | LoRa |
| `RADIO_PARAMETER_SYNC_WORD` | 8 bits for LoRa, up to 32 bits otherwise | All |
| `RADIO_PARAMETER_PREAMBLE_LENGTH` | Symbols (LoRa) or bits | All |
| `RADIO_PARAMETER_FREQUENCY_DEVIATION` | Hz | FSK, 4-FSK, MSK |
| `RADIO_PARAMETER_DATA_RATE` | bit/s | FSK, 4-FSK, MSK, OOK |
| `RADIO_PARAMETER_CHANNEL` | Channel number | ESP-NOW (Wi-Fi channel 1-14). Radios tuned by channel, not frequency, as 2.4 GHz doesn't fit the 32-bit frequency in Hz |
| `RADIO_PARAMETER_BOOSTED_GAIN` | 0 or 1 | Driver-specific |
| `RADIO_PARAMETER_NARROW_GRID` | 0 or 1 | LR-FHSS |
| `RADIO_PARAMETER_CURRENT_LIMIT` | mA | PA over-current protection |
| `RADIO_PARAMETER_LBT` | 0 or 1 | Listen-before-talk, see below |
| `RADIO_PARAMETER_LBT_RSSI_THRESHOLD` | dBm | Listen-before-talk for non-LoRa modulations |

- Return `ERROR_NOT_SUPPORTED` for a parameter that doesn't apply, and `ERROR_OUT_OF_RANGE` for an invalid value.
- Parameters take effect the next time the radio turns on. Consumers turn the radio off, change parameters and turn it on again.
- Keep a conservative default for `RADIO_PARAMETER_CURRENT_LIMIT`. A low limit protects the PA from a bad or disconnected antenna. A consumer that knows the board can raise it.

## Transmitting

`transmit()` copies the packet into a queue, assigns a `RadioTxId` and returns. Report the progress of each transmission with `radio_tx_event_emit(device, id, state)`:

| State | Meaning |
|---|---|
| `RADIO_TRANSMISSION_STATE_QUEUED` | Accepted into the queue |
| `RADIO_TRANSMISSION_STATE_TRANSMIT_PENDING` | Handed to the modem |
| `RADIO_TRANSMISSION_STATE_TRANSMITTED` | The modem confirmed TX-done |
| `RADIO_TRANSMISSION_STATE_TIMEOUT` | No TX-done in time |
| `RADIO_TRANSMISSION_STATE_ERROR` | The modem rejected the packet |
| `RADIO_TRANSMISSION_STATE_CHANNEL_BUSY` | Listen-before-talk found the channel busy on every attempt |

Every transmission ends in exactly one of the last four states. Base the TX-done timeout on the packet's time on air plus a margin, so slow configurations (a high spreading factor, a narrow bandwidth) don't time out early.

### Listen-before-talk

When `RADIO_PARAMETER_LBT` is on, check the channel before each transmission:
- LoRa: channel activity detection (CAD).
- Other modulations: the channel is busy when the RSSI is at or above `RADIO_PARAMETER_LBT_RSSI_THRESHOLD`.

Back off for a random time while the channel is busy, and report `RADIO_TRANSMISSION_STATE_CHANNEL_BUSY` after a fixed number of attempts.

## Receiving

While the radio is on and not transmitting, it listens. Report every received packet with `radio_rx_event_emit(device, data, length, rssi, snr)`. Pass `NAN` as the SNR when the modem doesn't report it. Packets longer than `RADIO_RX_MAX_PACKET_LENGTH` are truncated.

When a packet finishes while a transmission is queued, receive the packet first. A transmission switches the modem out of receive mode, which loses a packet that wasn't read yet.

## Threading

RadioLib and most modem libraries are not thread-safe. Use one radio thread per device that owns the modem:
- The thread waits on an event group for the DIO interrupt, queued transmissions and requests from other tasks.
- API calls from other tasks (`get_rssi()`, `is_receiving()`, a presence check) post a request to the radio thread and wait for its answer. They never touch the modem themselves.
- Interrupt handlers only set event bits.
- Clear only the event bits that a wait returned. Clearing all of them can erase an event that arrived in the meantime.

## SPI bus

Radios usually share an SPI bus with a display or an SD card. Lock the bus for each logical operation, as described in [SPI Controller](driver-development/spi-controller.md). A modem library that drives the chip-select line itself spreads one command over several transfers, so each command needs the bus lock for its whole duration.

## What the kernel handles

A driver doesn't need to implement these, as the kernel wrappers in `radio.cpp` take care of them:
- **Regulatory region:** ESP-NOW is exempt, as the Wi-Fi stack enforces the limits of its country. For other radios, `radio_set_region()` makes `radio_set_parameter()` reject frequencies and power outside the region, and `radio_set_enabled()` reject a configuration that doesn't fit a band. Both return `ERROR_OUT_OF_RANGE`.
- **Ownership:** `radio_acquire()`, `radio_release()` and `radio_get_owner()` let consumers claim a radio. The claim is advisory, and doesn't affect RX subscriptions.
- **Event subscriptions:** consumers subscribe with `radio_state_event_subscribe()`, `radio_rx_event_subscribe()` and `radio_tx_event_subscribe()`. The driver only emits.

## Hotplug and add-on modules

A radio on an add-on board, or one that only some variants of a device have, should implement the driver's `probe` function:
- Before the device starts, `probe` powers the module and checks for the chip, e.g. by reading a version register over SPI.
- Once started, it checks that the chip still responds, through the radio thread.

The kernel only probes devices whose devicetree status is "okay". It calls `probe` serialized with `start_device` and `stop_device`, so a probe never sees half-created or half-destroyed driver data.

Several variants of an add-on can share a slot, each as its own devicetree node on the same chip-select line. Skip the probe when another started device already uses that chip-select line, so that only one variant is active.

## Memory

Radio drivers often allocate kilobytes for the modem library, queues and buffers. On devices with PSRAM, keep those out of internal RAM with `tt::newObject()` (`TactilityCpp/Memory.h`) and the `tt::std` containers (`TactilityCpp/std/`).

## Checklist

- `device_type` is `&RADIO_TYPE`.
- `can_transmit()` and `can_receive()` report each direction separately.
- `set_enabled()` is asynchronous and every state change is emitted.
- Every transmission gets a terminal TX event.
- Received packets are handled before queued transmissions.
- Only the radio thread calls the modem library.
- Bus access is locked per logical operation.
- Add-on radios implement `probe`.
