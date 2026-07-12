# Drivers

## Driver definition and lifecycle

Drivers are defined by `struct Driver` in `tactility/driver.h`:

```c
struct Driver {
    const char* name;
    const char**compatible;
    error_t (*start_device)(struct Device* dev);
    error_t (*stop_device)(struct Device* dev);
    const void* api;
    const struct DeviceType* device_type;
    const struct Module* owner;
    struct DriverInternal* internal;
};
```

When making a driver, all fields most be set. For example:

```c
Driver esp32_i2c_driver = {
    .name = "esp32_i2c",
    .compatible = (const char*[]) { "espressif,esp32-i2c", nullptr },
    .start_device = start,
    .stop_device = stop,
    .api = (void*)&esp32_i2c_api,
    .device_type = &I2C_CONTROLLER_TYPE,
    .owner = &platform_module,
    .internal = NULL
};
```

`name` makes is useful for logging or debugging.

`compatible` is used to match a driver to a device.

`start_device` and `stop_device` binds or unbinds a device to/from the driver.

`api` is an optional field that can be used internally by the driver.

`device_type` is used to find drivers of the same type (e.g. to find all I2C controllers or all Grove ports)

`owner` is the optional owner of the driver. If a driver doesn't have an owner, it can not be removed after adding it.

The lifecycle is as follows:

```plantuml
@startuml
[*] --> driver_construct : driver is created (fields initialized)
driver_construct --> driver_add : driver is added and becomes usable/discoverable
driver_add --> driver_remove : driver is removed and stops being usable/discoverable
driver_remove --> driver_destruct : driver memory is cleaned up
driver_destruct --> [*]
skinparam ranksep 25
skinparam padding 2
@enduml
```

## Device

A device generally relates to a specific piece of hardware.
There can also more abstract instances of devices that help facilitate other devices.

```c
/** Represents a piece of hardware */
struct Device {
    int32_t address;
    const char* name;
    const void* config;
    struct Device* parent;
    struct DeviceInternal* internal;
}
```

A device has a name for debugging/logging purposes.
It has an optional `config`, and an `address` that can represent an index, a memory address, or some other kind of offset.

For example:

```c
static struct Device i2c_internal = {
	.name = "i2c_internal",
	.config = &i2c_internal_config,
	.parent = &root,
	.internal = NULL
};
```

Devices are part of a devicetree. This tree starts with a root node and all devices are attached to it.
This means that all devices have a parent, except for the root node itself. More on that later in the Devicetree section of this document.

So its lifecycle is as follows:

```plantuml
@startuml
[*] --> device_construct : device is created (fields initialized)
device_construct --> device_add : device is added and becomes discoverable
device_add --> device_start : device is started and starts being usable
device_start --> device_stop : device is stopped and stops being usable
device_stop --> device_remove : device is removed and stops being discoverable
device_remove --> device_destruct : device memory is cleaned up
device_destruct --> [*]
skinparam ranksep 25
skinparam padding 2
@enduml
```

The code could look like this:

```c
// Find the driver
struct Driver* driver = driver_find_compatible("espressif,esp32-i2c");

check(device_construct(&i2c_internal) == ERROR_NONE);
device_set_driver(&i2c_internal, driver);
check(device_add(&i2c_internal) == ERROR_NONE);
check(device_start(&i2c_internal) == ERROR_NONE);

// The device is now usable

check(device_stop(&i2c_internal) == ERROR_NONE);
check(device_remove(&i2c_internal) == ERROR_NONE);
check(device_denstruct(&i2c_internal) == ERROR_NONE);
```

### Referencing a device safely

Looking up a device only returns a pointer - nothing stops another thread from calling `device_stop()` on it right after, freeing the driver's private data before you get a chance to use it.

For any lookup that isn't immediately followed by a single, same-thread use, take a reference instead of a bare pointer:

```c
Device* device;
if (device_get_by_name("i2c_internal", &device) == ERROR_NONE) {
    // device is guaranteed valid and started until device_put()
    some_api_call(device);
    device_put(device);
}
```

`device_get_by_name()` (and `device_get_first_by_type()`, `device_get_first_active_by_type()`, `device_get_first_by_compatible()`) look up and reference a device atomically, so a device that's concurrently torn down is either not found or safely referenced - never a dangling pointer. While any reference is outstanding, `device_stop()` fails fast with `ERROR_RESOURCE_BUSY` instead of tearing down the driver's data underneath you.

If you already hold a trusted `Device*` (e.g. a static devicetree pointer captured once at bind time) and just need to bracket a single operation, use the lower-level pair directly:

```c
if (device_get(device) == ERROR_NONE) {
    some_api_call(device);
    device_put(device);
}
```

The older `device_find_*()` functions (`device_find_by_name()`, `device_find_first_by_type()`, `device_find_first_active_by_type()`, `device_find_first_by_compatible()`) are deprecated in favor of the `device_get_*()` family above - they still work for a same-thread, no-yield-in-between lookup-and-use, but don't protect against the teardown race.

## Module

A module is a collection of drivers or other functionality that can be loaded and unloaded at runtime.

```c
struct Module {
    const char* name;
    error_t (*start)(void);
    error_t (*stop)(void);
    const struct ModuleSymbol* symbols;
    struct ModuleInternal* internal;
};
```

There are many types of modules:
- Platform modules: Found in `Platforms/`. These contain platform drivers and optionally initialization code for the platform.
- Device modules: Found in `Devices/`. These contain device-specific drivers and optionally initialization code for a device.
- Other modules: Modules that contain specific features are found in `Modules/` (e.g. LVGL)

For example:

```c
struct Module platform_module = {
    .name = "platform-esp32",
    .start = start, // register ESP32 drivers
    .stop = stop, // deregister ESP32 drivers
    .symbols = NULL,
    .internal = NULL
};
```

The lifecycle is as follows:

```plantuml
@startuml
[*] --> module_construct : module is created (internal fields initialized)
module_construct --> module_add : module is added and becomes discoverable
module_add --> module_start : module is started and becomes usable
module_start --> module_stop : module is stopped and is not usable anymore
module_stop --> module_remove : module is removed and stops being discoverable
module_remove --> module_destruct : module memory is cleaned up
module_destruct --> [*]
skinparam ranksep 25
skinparam padding 2
@enduml
```

Example:

```c
// Allocate memory (creates internal data)
check(module_construct(&hal_device_module) == ERROR_NONE);
// Register the module
check(module_add(&hal_device_module) == ERROR_NONE);
// Activate the module
check(module_start(&hal_device_module) == ERROR_NONE);

// The module is now active

// Stop the module
check(module_stop(&hal_device_module) == ERROR_NONE);
// Deregister the module
check(module_remove(&hal_device_module) == ERROR_NONE);
// Deallocate memory (destroys internal data)
check(module_destruct(&hal_device_module) == ERROR_NONE);
```

## Devicetree

The devicetree defines a set of `struct Device` instances based on a `.dts` file and related `.yaml` bindings that are specified by the drivers:

```c
#include <bindings/tlora_pager.h>
#include <tactility/bindings/esp32_gpio.h>
#include <tactility/bindings/esp32_i2c.h>

/ {
	compatible = "lilygo,tlora-pager";
	model = "LilyGO T-Lora Pager";

	gpio0 {
		compatible = "espressif,esp32-gpio";
		gpio-count = <49>;
	};

	i2c0 {
		compatible = "espressif,esp32-i2c";
		port = <I2C_NUM_0>;
		clock-frequency = <100000>;
		pin-sda = <&gpio0 3 GPIO_FLAG_NONE>; // Pin 3
		pin-scl = <&gpio0 2 GPIO_FLAG_NONE>; // Pin 2
	};
};
```

The `compatible` field of each device specifies which driver should be bound.

This is matched with the name that the driver specifies in its YAML file:

```yaml
description: ESP32 GPIO Controller

compatible: "espressif,esp32-gpio"

# Inherit properties
include: ["gpio-controller.yaml"]
```

And `gpio-controller.yaml`:

```yaml
properties:
  gpio-count:
    type: int
    required: true
    description: |
        The number of available GPIOs.
```

These YAML files are used for parsing the devicetree's `.dts` file.

The driver implementation also specifies `compatible`:

```c
Driver esp32_gpio_driver = {
    /* ... */
    .compatible = (const char*[]) { "espressif,esp32-gpio", nullptr },
    /* ... */
};
```

Here, `compatible` is used for finding the right driver when initializing the device.

Devicetrees can be found in the device subprojects in `Devices/`.
