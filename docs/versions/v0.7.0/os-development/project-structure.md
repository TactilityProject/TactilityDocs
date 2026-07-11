# Project Structure

- `Boards`: Board implementation projects
- `Drivers`: Core drivers, Tactility drivers
- `Firmware`: The main project to build the firmware (and simulator)
- `Libraries`: A mix of regular libraries and ESP components
- `Modules`: Each subproject represents a group of functionality (e.g. LVGL)
- `Platforms`: The platform-specific driver implementations for TactilityKernel (e.g. I2C, UART, etc.)
- `Tactility`: The main application platform
- `TactilityC`: C wrappers for Tactility used by external apps
- `TactilityCore`: Core functionality (e.g. IO, multi-tasking, logging, etc.)

