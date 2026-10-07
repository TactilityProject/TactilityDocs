# Devicetree

A devicetree describes the hardware of a device: which chips it has, how they're connected and how they're configured. Every device in `Devices/` has a `.dts` file. At build time, the devicetree compiler (`Buildscripts/DevicetreeCompiler/`) turns it into C code with a [`struct Device`](kernel-concepts/device.md) for every node. At startup, the kernel adds those devices and binds each one to its [driver](kernel-concepts/driver.md).

The format is based on the Linux and Zephyr devicetree formats, but it's a simplified subset with its own compiler.

## Basic syntax

```dts
/dts-v1/;

#include <tactility/bindings/root.h>
#include <tactility/bindings/esp32_gpio.h>
#include <tactility/bindings/esp32_i2c_master.h>
#include <bindings/gt911.h>

/ {
	compatible = "root";
	model = "LilyGO T-Deck";

	gpio0 {
		compatible = "espressif,esp32-gpio";
		gpio-count = <49>;
	};

	i2c0 {
		compatible = "espressif,esp32-i2c-master";
		port = <I2C_NUM_0>;
		clock-frequency = <400000>;
		pin-sda = <&gpio0 18 GPIO_FLAG_NONE>;
		pin-scl = <&gpio0 8 GPIO_FLAG_NONE>;

		touch0 {
			compatible = "goodix,gt911";
			reg = <0x5D>;
			x-max = <240>;
			y-max = <320>;
		};
	};
};
```

- The file starts with `/dts-v1/;`.
- `#include` lines include the binding headers of the drivers that are used. They're copied into the generated C code, so the C constants they define (e.g. `I2C_NUM_0`, `GPIO_FLAG_NONE`) can be used as property values.
- `/ { ... };` is the root node. Every other node is inside it.
- A node is `name { ... };` and contains properties and child nodes. Every node, including the root, ends with `};`.
- A property is `name = value;`, or just `name;` for a boolean that is `true`.
- Comments are `// ...` or `/* ... */`.

## Hierarchy

Nodes form a tree, and the tree describes how the hardware is connected: a node's parent is the bus or controller that it's attached to. In the example above, the touch controller is on the I2C bus, so `touch0` is a child of `i2c0`.

Every node becomes a device whose `parent` is the device of its parent node. Drivers use that to reach their bus: the GT911 driver talks to the I2C controller that is its parent.

### Node names

- The node name becomes the device's name (e.g. `touch0`), which is used for logging and for looking it up with `device_get_by_name()`.
- Node names must be unique in the whole file, as they also become the names of the generated C variables.
- A node can have a unit address: `display@0`. The number after the `@` becomes the device's `address` (e.g. the chip select index on an SPI bus).
- A node can have a label, used to refer to it from other nodes: `i2c_internal: i2c0 { ... };`. References can use either the label or the node name.

## Driver binding

Every node has a `compatible` property, which names the driver to use, e.g. `compatible = "goodix,gt911";`. The format is `vendor,device`.

At startup, the kernel finds the driver with the same `compatible` string and binds it to the device. The driver then reads the device's configuration, which the devicetree compiler built from the node's properties.

### Bindings

Each driver describes its properties in a YAML binding, in its module's `bindings/` folder:

```yaml
description: Goodix GT911 capacitive touch controller

include: ["i2c-device.yaml"]

compatible: "goodix,gt911"

bus: i2c

properties:
  x-max:
    type: int
    required: true
    description: Horizontal resolution
  mirror-x:
    type: boolean
    default: false
    description: Mirror the X axis
```

- `compatible` is the string that nodes use to select this driver.
- `include` copies the properties of shared bindings, like `i2c-device.yaml` (which adds `reg`, the device's I2C address).
- Every property has a `type`, and is either `required` or has a `default`.

The devicetree compiler checks every node against its binding: unknown properties and missing required properties are errors.

The compiler turns the properties into the driver's configuration struct (`DEFINE_DEVICETREE(gt911, struct Gt911Config)` in the driver's `bindings/gt911.h`). The struct's fields must be in the same order as the binding's properties, starting with the properties from included bindings.

### Finding the bindings

Each device folder has a `module.yaml` that tells the compiler where to find the `.dts` file and which modules' bindings to use:

```yaml
dependencies:
  - Platforms/platform-esp32
  - Drivers/gt911-module
dts: lilygo,tdeck.dts
```

A driver module's own `module.yaml` points to its bindings folder (`bindings: bindings`).

## Property values

| Syntax | Example | Binding type |
|---|---|---|
| `<number>` | `clock-frequency = <400000>;` or `reg = <0x5D>;` | `int` |
| `<C constant>` | `port = <I2C_NUM_0>;` | `int` |
| `"text"` | `model = "LilyGO T-Deck";` | `text` |
| present or absent | `mirror-x;` | `boolean` |
| `<&node>` | `backlight = <&display_backlight>;` | `phandle`: a reference to another device |
| `<&node pin flags>` | `pin-sda = <&gpio0 18 GPIO_FLAG_NONE>;` | `phandles`: a reference with arguments, like a GPIO pin |
| `<...>, <...>` | `cs-gpios = <&gpio0 9 GPIO_FLAG_NONE>, <&gpio0 10 GPIO_FLAG_NONE>;` | `phandle-array`: a list of references |
| `[bytes]` | `init-sequence = [01 02 03];` | `array` |

A GPIO pin reference has three parts: the GPIO controller, the pin number, and flags such as `GPIO_FLAG_ACTIVE_LOW`. Drivers acquire the pin with `gpio_descriptor_acquire_pin_spec()`.

## Status

A node's `status` decides whether the device is started at boot:

- `status = "okay";` (the default when there's no `status`): the device is added and started at boot.
- `status = "disabled";`: the device is added, so that it can be found, but it isn't started. Code starts it later when it's needed.

For example, a display backlight that should stay off until the display has been initialized:

```dts
display_backlight {
	compatible = "pwm-backlight";
	status = "disabled";
	pwm = <&display_backlight_pwm>;
};
```

Devices with a driver that can detect the hardware (e.g. a removable SD card) are started when the hardware is present, and stopped when it's removed.

## Where to find more

- [Device](kernel-concepts/device.md) and [Driver](kernel-concepts/driver.md) for the device and driver lifecycle
- The `.dts` files in `Devices/` for complete examples
- The bindings in `Drivers/*/bindings/`, `Platforms/*/bindings/` and `TactilityKernel/bindings/` for the properties of each driver
