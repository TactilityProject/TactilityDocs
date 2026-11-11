# Building Tactility

## Cloning from git

Ensure you clone the repository including the submodules! For example:

```sh
git clone --recurse-submodules -j8 https://github.com/ByteWelder/Tactility.git
```

## Build Requirements

- ESP32 hardware (or variant)
- [ESP-IDF 5.4](https://docs.espressif.com/projects/esp-idf/en/v5.4/esp32/get-started/index.html) or a newer v5.4.x
- Linux, macOS, or Windows (Win11 natively or via WSL2 with Ubuntu 24.04 or newer) (\*)

(\*) Continuously tested with latest Arch (x86-64) and Ubuntu 24.04 (x86-64). Sporadically tested with latest macOS (aarch64).

## Building on Linux/macOS/WSL2

Make a copy of `sdkconfig.board.YOUR_BOARD` and name it `sdkconfig`. Copy from `sdkconfig.defaults` if you are setting up a custom board.

```sh
cp sdkconfig.board.<board-name> sdkconfig
```

Build the firmware:

```sh
idf.py build
```

Flash the firmware to a device and monitor the output:

```sh
idf.py -p <port> flash monitor
```

`<port>` is something like `/dev/ttyACM0` or `/dev/ttyUSB0` on Linux/macOS, or `COM3` on Windows.

# Building on Windows 11 natively

**Note:** This guide is updated and checked less frequently as this is not the main development platform.

[Pre-requisites for ESP-IDF](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/prerequisites.html)

[Installation process for ESP-IDF on Windows](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/installation.html)

Install VSCode and the ESP-IDF extension for VSCode.<br/>
**Note:** It might be safer to not use spaces for the intall path of ESP-IDF.


Once ESP-IDF is installed, click "File", then "Open Folder".

The "Import ESP-IDF Project" option in the extension as [mentioned in the ESP-IDF documentation](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/startproject.html#esp-idf-existing-esp-idf-project) doesn't seem to work with Tactility.

If you installed the CMake extension: Ignore the "Scan for kits" popup at the top, if it doesn't auto close shortly just hit escape.

Click the "ESP-IDF: Explorer" extension on the left side panel, click "Advanced", "Add .vscode subdirectory files".
This adds the `.vscode` folder to the project with `c_cpp_properties.json`, `launch.json` and `settings.json`.

Take a look at `c_cpp_properties.json`. It should contain a `compilerPath` that refers to your ESP-IDF installation.

You can also double-check `settings.json`. It should refer to the ESP-IDF installation path. Make sure it matches the ESP-IDF version with the version mentioned earlier in the docs.

- Click "File > Save Workspace as..." as save the `Tactiliy.code-workspace` to the Tactility folder.
- Click the "ESP-IDF: Explorer" extension on the left side panel, click "Open ESP-IDF Terminal".
- Run `.\Buildscripts\build.ps1 <board name> eg: cyd-2432S024c`
Or manually: 
```powershell
cp sdkconfig.board.<boardname> (insert board name) sdkconfig
idf.py build
```

Run `.\Buildscripts\release.ps1 <board name>`
For example: `.\Buildscripts\release.ps1 cyd-2432S024c`
Find the executables in the release folder.

Considering making a `tasks.json` and store it in the `.vscode` folder to have some easy build / release tasks to run with the command palette or one of the many task extensions (e.g. task explorer):

```json
{
    "version": "2.0.0",
    "windows": {
        "options": {
            "shell": {
                "executable": "powershell.exe",
                "args": [
                    "-NoProfile",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-Command ${config:idf.espIdfPathWin}\\export.ps1;"
                ]
            }
        }
    },
    "problemMatcher": [],
    "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared",
        "showReuseMessage": false,
        "clear": true
    },
    "tasks": [
        {
            "label": "[Build] CYD_2432S024C",
            "type": "shell",
            "command": ".\\Buildscripts\\build.ps1 cyd-2432S024c"
        },
        {
            "label": "[Release] CYD_2432S024C",
            "type": "shell",
            "command": ".\\Buildscripts\\release.ps1 cyd-2432S024c"
        }
    ]
}
```
