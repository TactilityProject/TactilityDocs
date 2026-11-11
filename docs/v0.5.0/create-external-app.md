# Create An External App

[App Fundamentals](app-fundamentals.md) will teach you the basics.

An example app can be found in the main repository in the [ExternalApps](https://github.com/ByteWelder/Tactility/tree/main/ExternalApps) folder. Make a copy and use it as a template to build your own.

Run `python tactility.py build all` to build all variants. Documentation for this command can be found [here](https://github.com/ByteWelder/TactilityTool).
Or run `python tactility.py --help` to show the commandline options.

## Install and test your app

First, make sure to set up the Tactility device:
- Wi-Fi should be on
- An SD card should be present (later it will be possible to install to `/data`)
- Development service should be enabled (via Settings -> Development)

Install the app to your ESP32S3 device as follows:

```bash
python tactility.py install 192.168.1.123 esp32s3
```

Make sure you target the right hardware and IP address!

Once the app is installed, you can start it remotely:

```bash
python tactility.py run 192.168.1.123 /sdcard/HelloWorld.app.elf
```

Also here you have to make sure the IP address is correct.
