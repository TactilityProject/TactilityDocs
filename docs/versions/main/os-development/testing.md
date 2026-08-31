# Testing

Most tests use [Doctest](https://github.com/doctest/doctest) and run on the simulator (POSIX) target.

## Building and running

```bash
cmake -B buildsim -G Ninja
ninja -C buildsim build-tests
cd buildsim && ctest --test-dir Tests
```

Run a single suite instead of all of them with `-R` (matches by regex against the suite name):

```bash
ctest --test-dir buildsim/Tests -R TactilityKernelTests
```

Or run its binary directly (useful for Doctest's own filters, e.g. `-tc="some test case"` to run one test case):

```bash
buildsim/Tests/TactilityKernel/TactilityKernelTests
```

## Test suites

Each suite is its own executable, registered in `Tests/CMakeLists.txt`:

- `ServiceModuleTests` — `service-module`
- `TactilityFreeRtosTests` — `TactilityFreeRtos`
- `TactilityKernelTests` — `TactilityKernel`
- `TactilityTests` — the `Tactility` layer itself
- `CryptModuleTests` — `crypt-module`
- `AppModuleTests` — `app-module`
- `AppPosixModuleTests` — `app-posix-module`
- `HttpModuleTests` — `http-module`

## SDK integration test

`Tests/SdkIntegration` isn't a Doctest suite. It's a real app project that verifies a generated `TactilitySDK` release actually builds and links against. Generate an SDK bundle first, then build against it:

```bash
python3 Buildscripts/release-sdk-posix.py <target_path>
TACTILITY_SDK_PATH=<target_path> cmake -S Tests/SdkIntegration -B <build_path> -G Ninja
ninja -C <build_path>
```

Run it after any change to `Buildscripts/TactilitySDK/`, `tactility_component_register()`, or what a released SDK bundles. A passing `ninja build-tests` doesn't catch a broken SDK release, since that's a completely separate packaging/consumption path.

## Where tests live

Tests for a project go in a `Tests/` or `tests/` subfolder of that project (e.g. `Modules/app-module/tests/`), following the same layout as the existing suites above. Each test project has its own `CMakeLists.txt` that builds a Doctest executable from its `source/*.cpp` files and registers it with `add_test()`.

To add a new suite, wire its subdirectory into the top-level `Tests/CMakeLists.txt` (`add_subdirectory()` plus an `add_dependencies(build-tests ...)` line so it's included in `ninja build-tests`).

## Linking app-module or Tactility code in a test

`app-module` compiled with `TT_APP_IO_WRAPS_STDIO` calls `__real_read()`/`__real_write()`/`__real_close()` in `io.cpp` for its real-syscall fallback. These only resolve if the final link wraps those symbols with `-Wl,--wrap=read`/`write`/`close` and the binary provides matching `__wrap_read()`/`__wrap_write()`/`__wrap_close()` functions, defined in `Tactility/Source/AppStdioWrap.cpp`.

A test binary linking `app-module` or `Tactility` needs both pieces. Add the wrap flags (see `Modules/app-module/tests/CMakeLists.txt` for the exact `target_link_options` call, skipped on Apple since its linker doesn't support `--wrap`), and include `AppStdioWrap.cpp` in the build. Skipping either one fails the link with `undefined reference to __real_write` (or `read`/`close`).
