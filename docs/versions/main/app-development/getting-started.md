# App Development - Getting Started

## Examples

You can find examples in the [TactilityApps](https://github.com/TactilityProject/TactilityApps) project.

Each app in the [Apps/](https://github.com/TactilityProject/TactilityApps/tree/main/Apps) directory is its own standalone project, e.g. `Apps/HelloWorld`.

## Project structure

An app project looks like this:

```
HelloWorld/
├── CMakeLists.txt
├── manifest.properties
├── assets/               (optional)
└── main/
    ├── CMakeLists.txt
    └── Source/
        └── main.c
```

- `manifest.properties` describes the package and its apps (see [Manifest.properties](app-development/fundamentals.md?id=manifestproperties)).
- The top-level `CMakeLists.txt` sets up the project with the SDK:
  ```cmake
  cmake_minimum_required(VERSION 3.20)

  get_filename_component(TACTILITY_SDK_PATH "$ENV{TACTILITY_SDK_PATH}" ABSOLUTE)
  include("${TACTILITY_SDK_PATH}/TactilitySDK.cmake")

  tactility_project_pre(helloworld)
  project(helloworld)
  tactility_project_post(helloworld)
  ```
- `main/CMakeLists.txt` registers the app's sources:
  ```cmake
  include("$ENV{TACTILITY_SDK_PATH}/TactilitySDK.cmake")

  file(GLOB_RECURSE SOURCE_FILES Source/*.c*)
  tactility_component_register(SRCS ${SOURCE_FILES})
  ```
- `assets/` holds files that are packaged with the app (see [Assets](app-development/fundamentals.md?id=assets)).

The easiest way to start a new app is to copy one of the examples and change its manifest.

## Building

After you went through the [Fundamentals](app-development/fundamentals.md) to set up a new application,
or if you downloaded one of the example apps, you can build it from the app's folder:

```bash
# Either build for all platforms in the manifest's target.platforms:
python tactility.py build
# Or do a quicker build for just 1 platform during development:
python tactility.py build --architecture esp32s3
```

`tactility.py` downloads the TactilitySDK version from the manifest's `target.sdk` automatically. It builds the app for every platform and creates the package in `build/<package id>.app`.

If you have more than one app in your repository, you can specify its path:

```bash
python tactility.py build --path Apps/SomeApp
python tactility.py build --path Apps/OtherApp
```

Run `python tactility.py --help` for all commands and options, and see the [TactilityTool](https://github.com/TactilityProject/TactilityTool) project for more documentation.

To build against a firmware that you built yourself (e.g. with new symbols), see [Building TactilitySDK locally](app-development/symbols.md?id=building-tactilitysdk-locally).

## Installing and running

First, make sure to set up the Tactility device:
- Wi-Fi should be on, and connected to the same network as your computer
- Development service should be enabled (via Settings -> Development)

Install the app on your device as follows:

```bash
python tactility.py install --host 192.168.1.123
```

Make sure you target the right IP address! The package contains the binaries for all of its platforms, so the device picks its own.

Once the app is installed, you can start it remotely:

```bash
python tactility.py run --host 192.168.1.123
```

If you want to build, install and run with one command:

```bash
# Either run (b)uild-(i)nstall-(r)un:
python tactility.py bir --host 192.168.1.123 --architecture esp32s3
# Or just "app goes brrr":
python tactility.py brrr --host 192.168.1.123 --architecture esp32s3
# Whatever floats your boat
```

`--architecture` is optional here too: without it, all platforms are built.

To remove the app again:

```bash
python tactility.py uninstall --host 192.168.1.123
```

## Debugging

### Serial monitor

You can connect your device via USB and use `idf.py monitor` to check the logs for debug or crash details.

To use `idf.py` you must have the [main firmware repository](https://github.com/TactilityProject/Tactility) checked out and run it from there.

To connect faster, run `idf.py -p [PORT] monitor`

When an app fails to load, the log names the missing symbol (see [Symbols](app-development/symbols.md?id=testing)).

### Attaching a debugger

This hasn't been investigated yet, but the [approach from Zephyr](https://docs.zephyrproject.org/latest/services/llext/debug.html) might work.
In the case of Tactility, the mentioned breakpoint could be placed at `esp_elf_relocate()`

**Warning:** This is untested and might not work!
