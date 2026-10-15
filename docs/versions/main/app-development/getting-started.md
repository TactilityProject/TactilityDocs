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

## Installing the tt tool

Apps are built, installed and run with the [tt tool](app-development/tt.md). Download [tt.zip](https://cdn.tactilityproject.org/sdk/tt.zip) from `https://cdn.tactilityproject.org/sdk/tt.zip` and extract it into your project's root folder. It needs Python 3.

The example apps in [TactilityApps](https://github.com/TactilityProject/TactilityApps) already include it.

## Building

After you went through the [Fundamentals](app-development/fundamentals.md) to set up a new application,
or if you downloaded one of the example apps, you can build it from the app's folder:

```bash
# Either build for all platforms in the manifest's target.platforms:
./tt app build
# Or do a quicker build for just 1 platform during development:
./tt app build --architecture esp32s3
```

On Windows, use `tt` instead of `./tt`.

`tt` downloads the TactilitySDK version from the manifest's `target.sdk` automatically. It builds the app for every platform and creates the package in `build/<package id>.app`.

If you have more than one app in your repository, you can specify its path:

```bash
./tt app build --path Apps/SomeApp
./tt app build --path Apps/OtherApp
```

Run `./tt help` for all commands, and see [The tt Tool](app-development/tt.md) for more documentation.

To build against a firmware that you built yourself (e.g. with new symbols), see [Building TactilitySDK locally](app-development/symbols.md?id=building-tactilitysdk-locally).

## Installing and running

First, make sure to set up the Tactility device:
- Wi-Fi should be on, and connected to the same network as your computer
- The development server should be on (via Settings -> Development, see [Remote Access](user-guide/remote-access.md))

Tell `tt` which device to use. The Development app shows its IP address:

```bash
./tt host 192.168.1.123
```

Make sure you target the right IP address! You can also pass it to a single command with `--host`.

Install the app on your device as follows:

```bash
./tt app install
```

The first time, `tt` shows the device's fingerprint and asks whether to trust it, and the device asks whether to accept your computer. See [Remote Access](user-guide/remote-access.md). The package contains the binaries for all of its platforms, so the device picks its own.

Once the app is installed, you can start it remotely:

```bash
./tt app run
```

If you want to build, install and run with one command:

```bash
# Either run (b)uild-(i)nstall-(r)un:
./tt app bir --architecture esp32s3
# Or just "app goes brrr":
./tt app brrr --architecture esp32s3
# Whatever floats your boat
```

`--architecture` is optional here too: without it, all platforms are built.

To remove the app again:

```bash
./tt app uninstall
```

## Debugging

### Remote shell

`./tt shell` opens a shell on the device, to look at files and run commands while you test your app. `./tt push` and `./tt pull` copy files to and from the device. See [The tt Tool](app-development/tt.md).

### Serial monitor

You can connect your device via USB and use `idf.py monitor` to check the logs for debug or crash details.

To use `idf.py` you must have the [main firmware repository](https://github.com/TactilityProject/Tactility) checked out and run it from there.

To connect faster, run `idf.py -p [PORT] monitor`

When an app fails to load, the log names the missing symbol (see [Symbols](app-development/symbols.md?id=testing)).

### Attaching a debugger

This hasn't been investigated yet, but the [approach from Zephyr](https://docs.zephyrproject.org/latest/services/llext/debug.html) might work.
In the case of Tactility, the mentioned breakpoint could be placed at `esp_elf_relocate()`

**Warning:** This is untested and might not work!
