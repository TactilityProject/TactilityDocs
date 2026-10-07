# Installing Firmware

## Web Installer

The easiest way to install Tactility is the [Web Installer](https://install.tactilityproject.org). It runs in a browser with Web Serial support (e.g. Chrome or Edge on a computer):

1. Connect the device with a USB cable.
2. Select your device in the Web Installer, and choose the stable release or the latest snapshot.
3. Choose the device's serial port, and start the installation. Installing with the **erase** option is recommended, especially for a first installation.

Some devices have to be put in download (boot) mode manually before they can be flashed. This usually means holding the BOOT button (on some devices the trackball or another button) while pressing and releasing RESET. Check your device's documentation.

## Downloaded releases

Firmware releases can also be flashed with [esptool](https://docs.espressif.com/projects/esptool/en/latest/esp32/installation.html) and the scripts in the release:

**Linux and macOS**

```bash
./flash.sh /dev/ttyACM0
```

The serial port is often `/dev/ttyACM0` or `/dev/ttyUSB0` on Linux, and `/dev/cu.usbmodem*` on macOS.

**Windows**

```powershell
.\flash.ps1 COM3
```

The scripts need `esptool` and `jq` (`pip install esptool jq`).

If you get an error like `function: not found` on Linux, your `sh` is probably a shell without functions (like `dash`): run the script with bash (`bash ./flash.sh /dev/ttyACM0`).

## Building it yourself

To build and flash Tactility from source, see [Building Tactility](os-development/building-tactility.md):

```bash
python device.py <device-id>
idf.py build flash monitor
```

## After installing

On the first start, Tactility runs its setup. Devices with an SD card store their data on it, so insert one before you start (see the device's `storage.userDataLocation` in its [device properties](device-development/device-properties.md)).

To install apps from your computer, connect the device to Wi-Fi and enable the Development service in Settings → Development (see [Getting Started](app-development/getting-started.md)).
