# Mesh Networking

Tactility can send and receive text messages over a LoRa mesh network, without Wi-Fi or a phone. It speaks two mesh protocols:

- [MeshCore](https://github.com/meshcore-dev/MeshCore)
- [Meshtastic](https://meshtastic.org)

One protocol is active at a time. Your device then talks to other MeshCore or Meshtastic nodes nearby.

Mesh networking requires hardware support, so it's not available on all devices.

## Getting started

1. **Set your region.** A radio may only transmit on the frequencies and at the power that are allowed where you are. The setup wizard asks for your region on first boot. You can change it later in **Settings → Mesh → Region**. The radio stays off until a region is set.
2. **Pick a mesh network.** In **Settings → Mesh → Mesh network**, choose MeshCore or Meshtastic. Choosing "Disabled" turns mesh networking off.
3. **Pick a preset** (MeshCore only). The preset sets the radio parameters, and must match the other nodes around you. "Default" is the standard setting of your region. "EU NL" is the setting of the Dutch community.

Once a mesh network is selected and a region is set, the **Mesh** toggle in the system menu turns mesh networking on and off. While it's on, the status bar shows the mesh icon.

## Regions and presets

| Mesh network | Regions |
|---|---|
| MeshCore | EU 868, US 915, AU 915 |
| Meshtastic | EU 433, EU 868, US 915, AU 915, NZ 865, IN 865, RU 868, CN 470, JP 920 |

Meshtastic uses the LongFast preset, in the frequency slot that its primary channel's name selects, like other Meshtastic nodes do.

Tactility limits how much the radio transmits, to stay within the duty cycle of your region (e.g. 1% or 10% of an hour in Europe). Before it transmits, it checks whether the channel is free.

## Channels

Both mesh networks come with a public channel: "Public" for MeshCore, "LongFast" for Meshtastic.

## Mesh Inspect

The **Mesh Inspect** app shows what the mesh network receives and sends:

- Messages, with their channel or sender, the signal strength and, for sent messages, the delivery state
- Adverts: nodes announcing themselves
- Frames that couldn't be read, e.g. messages on a channel that you haven't joined

The list follows the newest entry. With a keyboard or encoder, you can select an older entry to stop following.

## Storage

Messages are stored on your device's user data storage, so they survive a reboot. When the storage budget is full, the oldest messages are removed.

Your node's identity (a MeshCore key pair, or a Meshtastic node number) is created on first use, and stored there too.

## Limitations

- Tactility is a chat node: it doesn't repeat messages for other nodes.
- MeshCore: no direct routing (path learning), no repeater or room server requests and no multi-part messages.
- Meshtastic: no public key encryption of direct messages, no other presets than LongFast, and no positions or telemetry.
