# Wi-Fi

A Wi-Fi driver implements `struct WifiApi` (`tactility/drivers/wifi.h`) and has the device type `WIFI_TYPE`. Code outside the driver calls the `wifi_*` functions, which pass the call on to the driver. A `WifiApi` member that the driver doesn't have is `NULL`, and the matching function returns `ERROR_NOT_SUPPORTED`.

The drivers in the project are:
- `esp32_wifi` (`Platforms/platform-esp32`): the Wi-Fi of the chip, or of the co-processor on boards with ESP-Hosted.
- `esp32_wifi_pinned`: wraps `esp32_wifi` and runs the calls that change the Wi-Fi state on the core that ESP-IDF needs. It passes everything else on.
- `mock_wifi` (`Drivers/mock-drivers-module`): a fake radio for the simulator.

## Radio and station

| Function | Purpose |
|---|---|
| `wifi_set_radio_on()`, `wifi_set_radio_off()`, `wifi_get_radio_state()` | Turn the station radio on or off |
| `wifi_scan()`, `wifi_is_scanning()`, `wifi_get_scan_results()` | Scan for access points |
| `wifi_station_connect()`, `wifi_station_disconnect()` | Connect to an access point |
| `wifi_get_station_state()`, `wifi_station_get_ipv4_address()`, `wifi_station_get_target_ssid()`, `wifi_station_get_rssi()` | Read the state of the connection |
| `wifi_event_subscribe()`, `wifi_event_unsubscribe()`, `wifi_event_poll()` | Receive `WifiEvent`s |

## Access point

The device can be a Wi-Fi network itself. The access point works independently of the station: the radio and the station can be on or off, and both can run at the same time.

```c
struct WifiAccessPointConfig config = { .channel = 6 };
strcpy(config.ssid, "Tactility-1234");
strcpy(config.password, "secret-password");   // empty makes an open network

check(wifi_access_point_start(wifi_device, &config) == ERROR_NONE);

char ipv4[16];
wifi_access_point_get_ipv4_address(wifi_device, ipv4);   // "192.168.4.1"

wifi_access_point_stop(wifi_device);
```

| Function | Purpose |
|---|---|
| `wifi_access_point_start()` | Start the access point |
| `wifi_access_point_stop()` | Stop it. Does nothing when it is stopped already |
| `wifi_access_point_get_ipv4_address()` | The address of the device on the access point network. Fails with `ERROR_INVALID_STATE` when it is stopped |
| `wifi_get_access_point_state()` | `WIFI_ACCESS_POINT_STATE_STARTED` or `_STOPPED` |

The settings are in `struct WifiAccessPointConfig`:
- `ssid`: required, 1 to 32 bytes.
- `password`: empty for an open network. Otherwise 8 to 63 characters (WPA2-PSK).
- `channel`: 1 to 13. 0 means the default, channel 1.
- `max_connections`: 0 means the default, 4. The limit depends on the platform: 15 on the ESP32 family, 4 on the ESP32-C2.

`wifi_access_point_start()` returns `ERROR_INVALID_ARGUMENT` for a configuration that doesn't fit (including too many connections), `ERROR_INVALID_STATE` when the access point is started already (stop it first) and `ERROR_RESOURCE` when it can't start. Starting and stopping fire `WIFI_EVENT_TYPE_ACCESS_POINT_STATE_CHANGED`. The address is `192.168.4.1` with a DHCP server for the clients.

The access point shares the radio with the station, ESP-NOW and other users through `esp32_wifi_radio_acquire()` and `esp32_wifi_radio_release()` (`tactility/drivers/esp32_wifi_radio.h`). Code outside the driver doesn't call those: use the functions above.

## Implementing the API

A new driver sets the members of `struct WifiApi` it supports and leaves the optional ones out: `get_firmware_ops` and the three `access_point_*` members. Queue every `WifiEvent` for each subscriber, like `esp32_wifi` and `mock_wifi` do, so that `wifi_event_poll()` sees the events.
