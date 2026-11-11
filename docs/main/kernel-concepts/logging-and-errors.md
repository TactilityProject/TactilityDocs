# Logging and Errors

## Logging

`<tactility/log.h>` has a macro per log level. Each takes a tag (usually the name of the file, component or app) and a `printf`-style format:

```c
#include <tactility/log.h>

#define TAG "my_driver"

LOG_E(TAG, "Failed to read register 0x%02X", reg);  // error
LOG_W(TAG, "Retrying after timeout");               // warning
LOG_I(TAG, "Started %s", device->name);              // info
LOG_D(TAG, "Read %d bytes", count);                  // debug
LOG_V(TAG, "Raw value: %u", value);                  // verbose
```

On ESP32, these map to ESP-IDF's logging (`ESP_LOGE`, etc.), so they appear on the serial monitor (`idf.py monitor`) with the time and tag. On the simulator, they're printed to the terminal.

Guidelines:
- Use **error** for things that failed and need attention, **warning** for unexpected but recoverable situations, and **info** for important lifecycle events (e.g. a device started). Use debug and verbose for details that are only useful while developing.
- Don't log in tight loops or interrupt handlers: logging is slow and floods the output.
- Don't add a trailing `\n`: the logger adds it.

## Errors

Functions that can fail return an `error_t` (`<tactility/error.h>`). `ERROR_NONE` (0) means success:

```c
error_t error = i2c_controller_read(device, address, buffer, size, timeout);
if (error != ERROR_NONE) {
    LOG_E(TAG, "Read failed: %s", error_to_string(error));
    return error;
}
```

Common values:

| Error | Meaning |
|---|---|
| `ERROR_INVALID_ARGUMENT` | A parameter isn't valid |
| `ERROR_INVALID_STATE` | The operation isn't possible in the current state (e.g. a device that isn't started) |
| `ERROR_NOT_FOUND` | Something doesn't exist (e.g. a device, file or app) |
| `ERROR_NOT_SUPPORTED` | The driver or hardware doesn't support the operation |
| `ERROR_TIMEOUT` | The operation didn't finish in time |
| `ERROR_OUT_OF_MEMORY` | An allocation failed |
| `ERROR_BUFFER_OVERFLOW` | The output doesn't fit in the given buffer |
| `ERROR_RESOURCE` | A problem with a dependency or resource |
| `ERROR_RESOURCE_BUSY` | Still in use (e.g. a device with outstanding references) |

`error_to_string()` turns an error into readable text for logging.

Guidelines:
- Return the error to the caller, and let the caller decide what to do. Log where it's handled, not at every level.
- Return the most specific error. `ERROR_NOT_SUPPORTED` tells the caller that retrying won't help, `ERROR_TIMEOUT` that it might.
- Don't use exceptions in C++ code: use return values.

## Checks

`check()` (`<tactility/check.h>`) is for conditions that must always be true. When one isn't, the code has a bug: it logs the condition with the file and line, and stops the system with a crash:

```c
#include <tactility/check.h>

check(app_event_subscribe(&sub, &event_group) == ERROR_NONE);
check(index < count, "index out of range");
```

Use `check()` for programming errors, not for things that can fail at runtime, like a missing SD card, a full disk or a device that doesn't respond. Those must return an error instead.
