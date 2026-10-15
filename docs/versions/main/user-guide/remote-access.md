# Remote Access

The development server lets a computer on the same network control a Tactility device: install and run apps, copy files, and open a remote shell. The [tt tool](app-development/tt.md) is its client.

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

- The **Remote access** dialog shows the computer's name, its IP address and what it wants to do: `shell`, `sync` (file transfer) or `app` (install and run apps).
- It shows the start of the computer's fingerprint. Tap **...** to see the whole fingerprint.
- **Accept** trusts this computer from now on. **Reject**, or closing the dialog, refuses it.

The computer waits up to 60 seconds for an answer.

## Trusted computers

The **Trusted** card in the Development app lists the computers that you accepted, with their name and the start of their fingerprint. Tap the trash button of a computer to remove it: it's asked for again the next time it connects.

## On the computer

The computer stores what it trusts in the `.tactility` folder in your home folder (`%USERPROFILE%\.tactility` on Windows):

| File | Contents |
|---|---|
| `client.key`, `client.crt` | The computer's own key and certificate, created on first use |
| `known_hosts` | The fingerprint of every device it trusts, as `<host>:<port> <fingerprint>` |

The first connection to a device shows the device's fingerprint and asks whether to continue. Compare it with the fingerprint in the device's Development app. When a device's fingerprint changes later (e.g. after it was reset), the connection is refused. Remove its line from `known_hosts` to trust it again.

## Details

- The server listens on TCP port **6667**.
- At most 3 sessions are active at the same time, and at most 1 of them is a remote shell.
- The protocol is described in the [development module's README](https://github.com/TactilityProject/Tactility/tree/main/Modules/development-module).
