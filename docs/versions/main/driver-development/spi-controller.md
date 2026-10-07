# SPI Controller

An SPI controller (`SPI_CONTROLLER_TYPE`) is often shared by several devices on the same bus, such as a display and an SD card. Their drivers take turns on the bus by locking it.

Read the [Kernel Concepts](kernel-concepts/driver.md) first for how [drivers](kernel-concepts/driver.md), [devices](kernel-concepts/device.md) and [modules](kernel-concepts/module.md) work in general.

## SPI bus locking

A driver whose device sits on a shared SPI controller (parent device type `SPI_CONTROLLER_TYPE`) must bracket its own bus access with `spi_controller_lock()`/`spi_controller_unlock()` - or `spi_controller_lock_bus_of()`/`spi_controller_unlock_bus_of()` for the common case of a direct child - at the logical-operation level, not per primitive. This isn't done for you by the generic device-type wrappers (`display.h`, `pointer.h`, etc.); only the driver knows which of its own calls actually touch the bus.

```c
if (spi_controller_lock_bus_of(device) == ERROR_NONE) {
    // one logical operation's worth of SPI transfers
    spi_controller_unlock_bus_of(device);
}
```
