# Simulator

## Software Requirements

C++23 compiler. If you're running Ubuntu, this means you need Ubuntu 24.04 or newer.

## Running the official Simulator build

*(Linux)*

If you only want to run the simulator from a downloaded Tactility release, you only need the `mesa` and/or `mesa-util` dependencies.

*(macOS)*

macOS simulator support is a work in progress.

*(Windows 11)*

If you install WSL and Ubuntu, the simulator should work out-of-the-box.

## Profiles

The simulator can imitate different devices. Open the Simulator app (Settings -> Simulator), pick a profile with the list button and press Reboot to apply it. The simulator restarts itself with the new profile.

A profile sets:
- the resolution of the display, and whether it starts in portrait or landscape
- the UI density (regular or compact)
- whether the display is greyscale, which gives the monochrome theme
- whether it has a keyboard and whether it has a pointer (mouse or touch)

The Orientation section of the app overrides the profile's orientation: Default, Landscape or Portrait. The window changes shape when the display rotates. Picking a different profile sets the override back to Default.

The selected profile and orientation are stored in `data/tactility/simulator_profile.txt`. Changing either one also changes the saved orientation of the Display settings: Landscape or Portrait is written there, and Default removes it, so that the profile's own orientation applies. The profiles are listed in `Devices/simulator/Source/SimulatorProfile.cpp`.

## Mock hardware

The simulator's devicetree (`Devices/simulator/simulator.dts`) has mock devices from `Drivers/mock-drivers-module`:

| Compatible | Behaviour |
|---|---|
| `mock,wifi` | Wi-Fi with a fixed list of access points. Connecting always succeeds |
| `mock,bluetooth` | Bluetooth with three nearby peers (a keyboard, a gamepad and a speaker). Scanning, pairing and connecting succeed instantly. Pairing is not stored |
| `mock,radio` | A packet radio, e.g. LoRa. Mock radios in the same process with the same settings receive each other's transmissions |

## Building

## Building on Windows 11 (with WSL + Ubuntu)

Install WSL and open the Ubuntu application from your start menu, then follow the Linux guide below.

Note: It was reported that building the project from somewhere in `/mnt/c/` does not work.
Use a folder somewhere in the home directory instead (`cd ~`).

## Building on Linux or macOS

To run the simulator you will need to install these dependencies:

*(Ubuntu)*
```sh
sudo apt-get install -y build-essential git cmake mesa-utils libsdl2-dev
export LIBGL_ALWAYS_SOFTWARE=1
```

*(Arch)*
```sh
pacman -S base-devel git cmake mesa
```

*(Fedora)*
```sh
sudo dnf install git cmake SDL2_gfx-devel.x86_64 libXext-devel.x86_64 wayland-devel.x86_64 libxkbcommon-devel.x86_64
```

*(macOS)*
```sh
# Install Xcode Command Line Tools
xcode-select --install
```

Other Linux distros are also expected to work with either X11 or Wayland, as SDL is compiled with both enabled.
If you notice that X11 or Wayland options are not on when compiling SDL, try installing the SDL development package for your distro.

Clone the repository:

```sh
git clone https://github.com/TactilityProject/Tactility.git --recurse-submodules
```

From the project folder, run:

```sh
cmake -S ./ -B buildsim
cmake --build buildsim --target FirmwareSim
```

Then go to the `Data/` folder and start the executable from there:

```sh
cd Data
../buildsim/Firmware/FirmwareSim
```

## Building on native Windows

Native Windows is not possible out-of-the-box.
FreeRTOS froms the base for all Tactility development and it requires POSIX threads (pthreads) to work.

There is [a work-around with a custom "port layer"](https://www.freertos.org/Documentation/02-Kernel/03-Supported-devices/04-Demos/03-Emulation-and-simulation/Windows/FreeRTOS-Windows-Simulator-Emulator-for-Visual-Studio-and-Eclipse-MingW)
that makes it run with MingW and Visual Studio, but it's currently not being considered to actively support this. 

