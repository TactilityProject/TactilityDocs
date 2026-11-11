# Simulator

## Running the official Simulator build

*(Linux)*

If you only want to run the simulator from a downloaded Tactility release, you only need the `mesa` and/or `mesa-util` dependencies.

Note: On Ubuntu 22.04, you might need to set `export LIBGL_ALWAYS_SOFTWARE=1` before running the executable.

*(Windows 11)*

If you install WSL and Ubuntu, the simulator should work out-of-the-box.

## Building

## Building on Windows 11 (with WSL + Ubuntu)

Install WSL and open the Ubuntu application from your start menu, then follow the Linux guide below.

Note: It was reported that building the project from somewhere in `/mnt/c/` does not work.
Use a folder somewhere in the home directory instead (`cd ~`).

## Building on Linux

To run the simulator you will need to install these dependencies:

*(Ubuntu)*
```sh
sudo apt-get install -y build-essential git cmake mesa-utils
```

*(Arch)*
```sh
pacman -S base-devel git cmake mesa
```

Other Linux distros are also expected to work with either X11 or Wayland, as SDL is compiled with both enabled.

Clone the repository:

```sh
git clone https://github.com/ByteWelder/Tactility.git --recurse-submodules
```

From the project folder, run:

```sh
cmake -S ./ -B buildsim
cmake --build buildsim --target AppSim
```

Then go to the `Data/` folder and start the executable from there:

```sh
cd Data
../buildsim/App/AppSim
```

Note: on Ubuntu 22.04, you need to have `export LIBGL_ALWAYS_SOFTWARE=1` in your shell environment.

## Building on native Windows

Native Windows is not possible out-of-the-box.
FreeRTOS froms the base for all Tactility development and it requires POSIX threads (pthreads) to work.

There is [a work-around with a custom "port layer"](https://www.freertos.org/Documentation/02-Kernel/03-Supported-devices/04-Demos/03-Emulation-and-simulation/Windows/FreeRTOS-Windows-Simulator-Emulator-for-Visual-Studio-and-Eclipse-MingW)
that makes it run with MingW and Visual Studio, but it's currently not being considered to actively support this. 

## Building on macOS

macOS is currently not supported. The simulator can be built, but it crashes on starting it.

The problem is that macOS requires SDL Window creation to happen on the main thread, but that in itself
also requires the rendering and event loop to be on the main thread (otherwise you get a black screen).
This can't be done currently with the default LVGL+SDL+FreeRTOS setup.
It might be possible in the future, by making a custom stack that combines SDL with LVGL, but it's a big time investment.
