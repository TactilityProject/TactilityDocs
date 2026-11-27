# Firmware

`tactility/firmware/firmware.h` (TactilityKernel) is a generic interface to read the version of a firmware and to write a new one. It is used for the firmware that the device runs, and for the firmware of co-processors.

## Registry

A platform or device makes a firmware available under an id:

```c
error_t firmware_register(const char* id, const struct FirmwareOps* ops, void* ctx);
error_t firmware_unregister(const char* id);
error_t firmware_get(const char* id, const struct FirmwareOps** ops, void** ctx);
void firmware_for_each(FirmwareVisitorFn visitor, void* user_data);
```

- `FIRMWARE_ID_SYSTEM` (`"system"`) is the firmware that the device runs. On ESP32, `platform-esp32` registers it at startup when the partition table has OTA app partitions. Without them, `firmware_get(FIRMWARE_ID_SYSTEM, ...)` returns `ERROR_NOT_FOUND`.
- The id, the operations and the context must stay valid until the firmware is unregistered.
- The visitor of `firmware_for_each()` runs with the registry's lock held: it must not call any `firmware_*()` function.

The firmware of the ESP-Hosted co-processor (ESP32-P4 with an ESP32-C6) is also available through `wifi_get_firmware_ops()` of the Wi-Fi device.

## Operations

```c
struct FirmwareOps {
    bool (*wait_ready)(void* ctx, uint32_t timeout_ms);
    error_t (*get_info)(void* ctx, struct FirmwareInfo* info);
    error_t (*begin)(void* ctx, const struct FirmwareUpdateRequest* req, struct FirmwareUpdateHandle** handle);
    error_t (*write)(struct FirmwareUpdateHandle* handle, const void* data, size_t len);
    error_t (*finish)(struct FirmwareUpdateHandle* handle);
    error_t (*abort)(struct FirmwareUpdateHandle* handle);
    error_t (*activate)(void* ctx);
    error_t (*get_layout)(void* ctx, struct FirmwareLayout* layout); // optional, may be NULL
};
```

An update is written in this order:

1. `begin()` with the size of the image. One update runs at a time: a second `begin()` returns `ERROR_RESOURCE_BUSY`.
2. `write()` for each part of the image. Call `abort()` when a write fails.
3. `finish()` checks the image.
4. `activate()` makes the device start the new firmware at the next restart.

`get_info()` returns the name, hardware id and version. `get_layout()` returns where an image is installed:
- `max_image_size`: the largest image that `begin()` accepts, 0 when unknown
- `layout_id`: identifies the storage layout, for the system firmware of an ESP32 the MD5 that the partition table stores of itself. An image that was built for another layout can't be installed with these operations.

`get_layout` was added after the other operations, so code that was built before it never calls it. Check for `NULL` before calling it.

## System firmware on ESP32

The system firmware writes an update to the next OTA app partition with `esp_ota_*`, and `activate()` sets it as the boot partition.

Devices with OTA app partitions are built with app rollback (`CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE`). After an update, the new firmware runs on trial: it marks itself as valid when the boot completes (`KERNEL_EVENT_BOOT_COMPLETED`). When it resets before that, the bootloader starts the previous firmware again. The bootloader isn't part of an update, so a device only gets rollback after it was flashed once with a firmware that has it.

The update service (`tactility.firmwareupdate`) uses these operations to install updates from the CDN, see [Software Updates](../user-guide/software-updates.md) and [Releases](../os-development/releases.md#firmware-updates).
