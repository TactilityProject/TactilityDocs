# App Development - Getting Started

## Examples

You can find examples in the [TactilityApps](https://github.com/ByteWelder/TactilityApps) project.

Each app in the [Apps/](https://github.com/ByteWelder/TactilityApps/tree/main/Apps) directory is its own standalone project.

## Building

After you went through the [Fundamentals](app-development/fundamentals.md) to set up a new application,
or if you downloaded one of the example apps, you can build it:

```bash
# Either build for all supported hardware:
python tactility.py build
# Or do a quicker build for just 1 target during development:
python tactility.py build esp32s3
```

Documentation for this command can be found [here](https://github.com/ByteWelder/TactilityTool).

## Installing and running   

First, make sure to set up the Tactility device:
- Wi-Fi should be on
- Development service should be enabled (via Settings -> Development)

Install the app to your ESP32S3 device as follows:

```bash
python tactility.py install 192.168.1.123
```

Make sure you target the right hardware and IP address!

Once the app is installed, you can start it remotely:

```bash
python tactility.py run 192.168.1.123
```

Also here you have to make sure the IP address is correct.

If you want to do build, install and run with one command:

```bash
# Either run (b)uild-(i)nstall-(r)un:
python tactility.py bir 192.168.1.123
# Or just "app goes brrr":
python tactility.py brrr 192.168.1.123
# Whatever floats your boat
```

## Debugging

### Serial monitor

You can connect your device via USB and use `idf.py monitor` to check the logs for debug or crash details.

To use `idf.py` you must have the [main firmware repository](https://github.com/TactilityProject/Tactility) checked out and run it from there.

To connect faster, run `idf.py -p [PORT] monitor`

### Attaching a debugger

This hasn't been investigated yet, but the [approach from Zephyr](https://docs.zephyrproject.org/latest/services/llext/debug.html) might work.
In the case of Tactility, the mentioned breakpoint could be placed at `esp_elf_relocate()`

**Warning:** This is untested and might not work!
