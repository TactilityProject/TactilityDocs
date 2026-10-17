# The tt Tool

`tt` is the command-line tool for app development. It builds apps, installs and runs them on a device, copies files and opens a remote shell.

## Installing tt

Download [tt.zip](https://cdn.tactilityproject.org/sdk/tt.zip) and extract it into your project's root folder. It contains:

| File | Purpose |
|---|---|
| `tt.py` | The tool itself (needs Python 3) |
| `tt` | Runs `tt.py` on Linux and macOS: `./tt` |
| `tt.ps1` | Runs `tt.py` in Windows PowerShell: `.\tt` |

On Windows, PowerShell only runs scripts that its execution policy allows. If `.\tt` is blocked, unblock the downloaded script once with `Unblock-File .\tt.ps1`, or run `py tt.py` instead (e.g. `py tt.py app build`). From `cmd.exe`, always use `py tt.py`.

The first remote command (`shell`, `push`, `pull`, `screenshot`, or installing and running apps) creates the computer's certificate, which needs the Python package `cryptography`: `pip install cryptography`.

If you still use `tactility.py`: run `python tactility.py updateself`, then run `python tactility.py` once more. It installs `tt` next to it, and from then on it only refers to `tt`.

## How it works

`tt` itself is small. Every command runs a tool that belongs to the TactilitySDK that your app targets:

1. `tt` reads `target.sdk` from `manifest.properties` in the current folder. Without one, it uses the first `Apps/*/manifest.properties` or `apps/*/manifest.properties`.
2. It downloads that SDK version's tools, and the SDK for each of the manifest's `target.platforms` (every platform of the SDK for `target.platforms=all`), into `~/.tactility/sdk/<version>/`. This only happens once per version.
3. It runs the command with that version's tools.

So an app always uses tools that match its SDK, and different apps can target different SDK versions.

## Commands

Run `tt help` in an app folder to list the commands of its SDK.

| Command | Purpose |
|---|---|
| `tt app <action>` | Build, install, run and uninstall the app (see below) |
| `tt shell` | Open a shell on the device |
| `tt shell <command>` | Run a command on the device, e.g. `tt shell ls /sdcard` |
| `tt push <local path> <device path>` | Copy a file to the device |
| `tt pull <device path> [local path]` | Copy a file from the device |
| `tt screenshot [local path]` | Save a screenshot of the device's screen as a PNG file. Without a path, it's saved as `screenshot-<yyyy-mm-dd>.png` |
| `tt host [hostname]` | Show or set the device that the remote commands use |
| `tt ui` | Open a dashboard to build, install and run the apps in `Apps/` (needs the Python package `textual`) |
| `tt update-self` | Update `tt` itself |
| `tt update-sdk` | Download a newer build of the SDK that the app targets: its tools and its platforms together |

`tt` checks for updates every 30 minutes and tells you when to run `tt update-self` or `tt update-sdk`. It never replaces an installed SDK by itself, so your builds only change when you choose to update. When an app needs a platform that isn't installed yet, and its SDK version was published again since you installed it, `tt` asks you to run `tt update-sdk` first, so the tools and all platforms stay from the same build.

### tt app

| Action | Purpose |
|---|---|
| `build` | Build the app and create its package in `build/<package id>.app` |
| `install` | Install the package on the device |
| `run` | Start the app on the device |
| `uninstall` | Remove the app from the device |
| `bir` (or `brrr`) | Build, install and run |
| `clean` | Remove the build folders |

Options:

| Option | Purpose |
|---|---|
| `-a`, `--architecture <platform>` | Build only this platform, e.g. `esp32s3`. Without it, all of the manifest's `target.platforms` are built |
| `-p`, `--path <folder>` | The app's folder, when it isn't the current folder |
| `-h`, `--host <hostname>` | The device to use |
| `--skip-build` | Skip the compiler steps |
| `--verbose` | Show more output |

## Choosing the device

Commands that talk to a device need its host name or IP address (shown in the device's Development app, see [Remote Access](user-guide/remote-access.md)). Either pass it with `-h`, or store it once:

```bash
./tt host 192.168.1.123
./tt app bir -a esp32s3
```

`tt host` stores the host in `.tactility/device_host` in the current folder. `tt host` without an argument shows it, or `none`.

## Using a local SDK

To build against an SDK that you built yourself (see [Building TactilitySDK locally](app-development/symbols.md?id=building-tactilitysdk-locally)), point `TACTILITY_SDK_PATH` to its `release` folder:

```bash
export TACTILITY_SDK_PATH=/path/to/Tactility/release
./tt app build -a esp32s3
```

When `TACTILITY_SDK_PATH` is set, `tt` uses the SDK and tools from there and downloads nothing. It says so on every command. The folder must have the same layout as `~/.tactility`:

```
release/
└── sdk/<version>/
    ├── tools/
    └── platform-<platform>/TactilitySDK/
```
