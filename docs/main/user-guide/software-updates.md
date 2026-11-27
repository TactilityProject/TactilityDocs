# Software Updates

Tactility can update itself over Wi-Fi. Open **Settings → Software** to check for updates, install them and choose an update channel.

## Devices that can update themselves

A device installs updates itself when its partition table has two app slots: devices with 16 MB of flash that store their data on an SD card, and devices with 32 MB of flash. Other devices show when an update is available, and are updated with the [Web Installer](installing-firmware.md#web-installer).

## Checking for updates

The update card at the top of the Software app shows the status on the left, and a button on the right:

| Status | Button | |
|---|---|---|
| Up to date | Check | The installed version and its date are below the status |
| Up to date | Checking... | A check is running |
| Update available | Update | The version and the build date of the update are below the status |
| Update available | Updating... | The update is being installed |
| Update installed | Restart | The update runs after a restart |

Tactility also checks by itself when Wi-Fi connects and when the Software app opens, unless it checked less than 10 minutes ago.

When an update is found, a notification from **Software** says so. Tap it to open the Software app. It stays until the update is installed, or until there is no update anymore.

## Installing an update

Press **Update** and confirm. The update is downloaded and written next to the running firmware:
- **Preparing update...** while it connects and erases the space for the update
- **Installing: 42%** while it downloads and writes the update

You can leave the Software app while it installs. The update continues in the background, and the app shows the progress again when you open it.

When the update is installed, the app offers to restart. The update runs from the next start. Keep the device powered on until the update is installed.

The running firmware isn't touched until the restart:
- When the download or the writing fails, the device keeps its current firmware. Press **Update** to try again.
- When the new firmware doesn't finish starting (for example it crashes), the device goes back to the previous firmware at the next restart.

### When an update can't be installed

| Message | Meaning |
|---|---|
| The update couldn't be installed. | The download failed or didn't match. The app checks again, and tries once more by itself when the download didn't match. Press **Update** to try again. |
| This update needs a full install with the web flasher. | The update was built for another partition table, or it doesn't fit. Install it with the [Web Installer](installing-firmware.md#web-installer). |
| Install this update with the web flasher. | The device can't install updates itself. |
| Incompatible update | The update doesn't fit the device. Install it from [install.tactilityproject.org](https://install.tactilityproject.org) |

## Update channels

The update channel decides which builds you get:

| Channel | Builds |
|---|---|
| Main | Official releases |
| Beta | The latest development version (the `main` branch) |
| Develop | Builds of pull requests. These aren't finished or tested, and can be unstable. |

The channel starts as the channel of the installed firmware. A firmware that you built yourself is on the Develop channel.

Press the button next to **Update channel** to choose another one. After a switch, the build of the new channel is offered whenever it differs from the installed firmware, also when it is older. Within the same channel, only newer builds are offered.

Main only has builds after an official release that publishes them. Until then, the app tells you that Main isn't available yet, and you can use Beta.

The Develop channel is hidden. Tap the channel name 5 times within 3 seconds to switch to it. It stays listed while you use it.

## App Hub Repositories

The second card of the Software app shows the number of App Hub repositories. Press its button to open **App Hub Repositories**, which lists the catalogs that App Hub installs apps from:

- The switch next to a repository turns it on or off. The official Tactility repository can be turned off, but not removed.
- The **+** button adds a repository. Its address starts with `https://`. Apps from other repositories aren't checked by the Tactility project, so only add repositories that you trust.
- The trash button removes a repository.

See [App Hub CDN](../app-hub-cdn/overview.md) to host a repository.
