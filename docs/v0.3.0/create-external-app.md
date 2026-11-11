# Create An External App

[App Fundamentals](app-fundamentals.md) will teach you all the basics.

An example app can be found in the main repository in the [ExternalApps](https://github.com/ByteWelder/Tactility/tree/main/ExternalApps) folder.
Make a copy and use it as a template to build your own.

The projects in `ExternalApps/` folder are standalone projects. They output an `.app.elf` file. 

## Get the SDK

There are 2 methods for getting the SDK:
1. Building it from within the Tactility project.
2. Building it with a downloaded TactilitySDK.

### Method 1: Build from Tactility

During Tactility OS development, we use this method.

1. Ensure the project is built for your target:<br/>Run `idf.py build` from the Tactility root folder.
2. Run `Buildscripts/release-sdk-current.sh`
3. Your SDK is now available at `release/TactilitySDK`
4. Open the app's directory and run `idf.py build` (note: this shows an error at the end, but succesfully creates the elf file in the build folder)
5. Subsequent build commands are done with `idf.py elf` (these shouldn't result in an error)

### Method 2: Build from TactilitySDK

The SDK is officially released yet, but you can find build artifacts on GitHub (they expire after 5 days) and download them.
The provided zipfiles can be deployed anywhere.

When you compile one of the `ExternalApps` projects, make sure that `TACTILITY_SDK_PATH` environment variable is set to the SDK path.

Build it from the app folder by running `idf.py build` (note: this shows an error at the end, but succesfully creates the elf file in the build folder)

Subsequent build commands are done with `idf.py elf` (these shouldn't result in an error)

