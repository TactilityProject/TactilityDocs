# Build Scripts

Here's an overview of the most important scripts in the `Buildscripts/` folder.

Note that all scripts must be executed from the root project folder.
They also require to have `idf.py` on your path.

### build.sh

Make a clean build for a specific board. This removes any existing `build/` folder on start.

```bash
Buildscripts/build.sh <board_name>
```

Example:

```bash
Buildscripts/build.sh lilygo-tdeck
```

### release.sh

Release the current artifacts with the specified board name.
Note that this does not perform any checks. If you built board A and you release it as board B, this script will not correct you.

```bash
Buildscripts/release.sh <board_name>
```

Example:

```bash
Buildscripts/release.sh lilygo-tdeck
```

### release-sdk.sh

Releases the current build files as an SDK in the specified folder.

```bash
Buildscripts/release-sdk.sh <sdk_name>
```

Example:

```bash
Buildscripts/release-sdk.sh release/TactilitySDK
```

### release-sdk-current.sh

Releases the current build files as an SDK in `release/TactilitySDK/`
This deployment is used when compiling apps in `ExternalApps/`

```bash
Buildscripts/release-sdk-current.sh
```

### build-and-release-all.sh

Builds and releases all firmwares and SDKs.

```bash
Buildscripts/build-and-release-all.sh
```
