# Remote Access

The development server lets a computer on the same network control a Tactility device: install and run apps, copy files, and open a remote shell, and show the device's display. The [tt tool](../app-development/tt.md) is its client.

## Turning it on

Open **Settings -> Development** and turn on the switch in the toolbar. The server remembers this setting, so it starts again after a reboot.

When the device is connected to Wi-Fi, the app shows where the server is reachable:

```
Available at 192.168.1.123
Fingerprint: 1a2b 3c4d ...
```

The fingerprint identifies this device. The first time a computer connects, it shows the full fingerprint, so you can compare it with this one.

## Accepting a computer

The connection is encrypted, and both sides prove who they are with a certificate. When a computer connects for the first time, the device asks whether to allow it:

- The **Remote access** dialog shows the computer's name, its IP address and what it wants to do: `shell`, `sync` (file transfer), `app` (install and run apps) or `remote` (view and control the display).
- It shows the start of the computer's fingerprint. Tap **...** to see the whole fingerprint.
- **Accept** trusts this computer from now on. **Reject**, or closing the dialog, refuses it.

The computer waits up to 60 seconds for an answer.

## Viewing the display

`tt remote` opens a window that shows the device's display, and can send keyboard and touch input to it:

```bash
./tt remote
```

It uses the same encrypted connection and approval as the other commands.

- The sidebar on the left has buttons for **keyboard**, **touch**, **zoom in**, **zoom out**, **screenshot** and **rotate**. Keyboard and touch are on by default.
- Zoom changes the size of the picture in steps of 25%. The window resizes to fit.
- The screenshot button saves the picture as `screenshot <yyyy>-<mm>-<dd> <HH>-<MM>-<SS>.png`.
- The view turns upright by itself, following the device's orientation (e.g. a portrait device that is rotated to landscape). The rotate button turns the view by a quarter turn on top of that. It only changes the view.
- Touch with the left mouse button, and drag to swipe. Hold **Ctrl** and drag to pinch, or hold **Shift** to use two fingers that move together.
- Turning keyboard or touch on adds a virtual keyboard or touch device to the device. They're removed again when you turn them off or close the window.

The display is streamed as the screen changes, so a screen that doesn't change costs nothing. Screens that LVGL doesn't draw (e.g. a full-screen Terminal) are shown too. The device must have external RAM (PSRAM), because it keeps a copy of the whole screen. Only one remote display session is active at a time.

On Linux, the window needs Tk and Pillow's Tk support: `sudo dnf install python3-tkinter python3-pillow-tk` (Fedora) or `sudo apt install python3-tk python3-pil.imagetk` (Debian/Ubuntu).

## Trusted computers

The **Trusted** card in the Development app lists the computers that you accepted, with their name and the start of their fingerprint. Tap the trash button of a computer to remove it: it's asked for again the next time it connects.

## On the computer

The computer stores what it trusts in the `.tactility` folder in your home folder (`%USERPROFILE%\.tactility` on Windows):

| File | Contents |
|---|---|
| `client.key`, `client.crt` | The computer's own key and certificate, created on first use |
| `known_hosts` | The fingerprint of every device it trusts, as `<host>:<port> <fingerprint>` |

The first connection to a device shows the device's fingerprint and asks whether to continue. Compare it with the fingerprint in the device's Development app. When a device's fingerprint changes later (e.g. after it was reset), the connection is refused. Remove its line from `known_hosts` to trust it again.

`tt` might also create a `.tactility` folder in the folder where you run it. It remembers the device's host address and the SDK version there.

## Details

- The server listens on TCP port **6667**.
- At most 3 sessions are active at the same time, and at most 1 of them is a remote shell and at most 1 of them is a remote display.
- Anyone on the network can ask for the device's manufacturer, name, id and Tactility version, without a certificate or approval. `tt host` and `tt` use this to select the SDK version.
- The protocol is described in the [development module's README](https://github.com/TactilityProject/Tactility/tree/main/Modules/development-module).
