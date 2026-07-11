# Configuration

User data files are stored on either `/sdcard/tactility/` or `/data/tactility/`.

The `/data` partition is only present on devices that don't have an SD card slot. Devices with an SD card slot must have an SD card present when booting. 

## Boot

During the boot process, the system tries to load the `boot.properties` file from an SD card (if present and mounted).
When it fails to load from SD card, it tries to load it from `/{user_data}/settings`.
When that fails to load too, the system defaults are used.

Locations:
- `/{user_data}/settings/boot.properties`
- (optional) `/{user_data}/settings/boot.properties`

Properties:
- `launcherAppId`: The application identifier for the launcher app. This parameter is required. The default is "Launcher".
- `autoStartAppId`: An optional application to start after the launcher is started. This parameter is optional. There is no default value.

## System

General system settings are stored in `system.properties` which is loaded from `/{user_data}/settings`

Location: `/{user_data}/settings/system.properties`

Properties:
- `language`: The locale that determines the language. The default is "en-US". Supported languages: en-US, en-GB, nl-NL, nl-BE, fr-FR
- `timeFormat24h`: Determines the format of the time in the top bar. Supported values: "true" or "false". The default value is "true".

## Wi-Fi

## Wi-Fi Access Point Provisioning

Access point provisioning files can be placed in `/{user_data}/provisioning`.

For each access point that you want to configure, create a unique file in the root of the SD card with the name `[name].ap.properties` where `[name]` can be any text you like.

The file content looks like this:

```properties
ssid=SomeWifiName
password=yourplaintextpassword
autoConnect=true
autoRemovePropertiesFile=false
```

Properties:

- `ssid`: The name of the access point
- `password`: The plain text password
- `autoConnect`: Whether Tactility should automatically connect to it when Wi-Fi is enabled (values "true" or "false")
- `autoRemovePropertiesFile`: Whether to automatically delete the files from SD card once this configuration has been successfully applied. This is a security feature.

## Wi-Fi Settings

These settings are found in `/{user_data}/settings/wifi.properties`

Properties:

- `enableOnBoot`: turn on Wi-Fi service at boot (values "true" or "false")


