# Testing

Tests use [Doctest](https://github.com/doctest/doctest) and run on the simulator (POSIX) target only — they don't run on real ESP32 hardware.

## Building and running

```bash
cmake -B buildsim -G Ninja
ninja -C buildsim build-tests
cd buildsim && ctest
```

Or run an individual test binary directly:

```bash
./buildsim/Tests/TactilityKernel/TactilityKernelTests
./buildsim/Tests/Tactility/TactilityTests
./buildsim/Tests/TactilityFreeRtos/TactilityFreeRtosTests
./buildsim/Tests/crypt-module/CryptModuleTests
```

## Project structure

Tests live in `Tests/`, mirroring the subproject they cover:

- `Tests/TactilityKernel/` — kernel device/driver/module and concurrency primitive tests
- `Tests/Tactility/` — main OS layer tests
- `Tests/TactilityFreeRtos/` — FreeRTOS wrapper tests
- `Tests/crypt-module/` — `crypt-module` tests
- `Tests/Doctest/` — the vendored Doctest header

`Tests/CMakeLists.txt` registers each test subproject and groups them under a single `build-tests` target.

## Adding a test

Add a new source file to the relevant test subproject's `Source/` directory and use Doctest's `TEST_CASE`/`SUBCASE` macros. New test files are picked up automatically if the subproject's `CMakeLists.txt` globs its sources; otherwise add the file explicitly.
