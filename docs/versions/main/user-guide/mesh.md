# Mesh Networking

Tactility can send and receive text messages over a LoRa mesh network, without Wi-Fi or a phone. Devices with Wi-Fi can also use [ESP-NOW](#radio) as a short-range mesh radio. It speaks two mesh protocols:

- [MeshCore](https://github.com/meshcore-dev/MeshCore)
- [Meshtastic](https://meshtastic.org)

One protocol is active at a time. Your device then talks to other MeshCore or Meshtastic nodes nearby.

LoRa mesh networking requires a LoRa radio, so it's not available on all devices.

## Getting started

1. **Set your region.** A radio may only transmit on the frequencies and at the power that are allowed where you are. The setup wizard asks for your region on first boot. You can change it later in **Settings → Mesh → Region**. The radio stays off until a region is set.
2. **Pick a mesh network.** In **Settings → Mesh → Mesh network**, choose MeshCore or Meshtastic. Choosing "Disabled" turns mesh networking off.
3. **Pick a radio** (only when you have more than one). See [Radio](#radio).
4. **Pick a preset** (MeshCore only, LoRa only). The preset sets the radio parameters, and must match the other nodes around you. "Default" is the standard setting of your region. "EU NL" is the setting of the Dutch community.

Once a mesh network is selected and a region is set, the **Mesh** toggle in the system menu turns mesh networking on and off. While it's on, the status bar shows the mesh icon.

## Name

**Settings → Mesh → Name** sets the name that other nodes see. Until you set one, it's `TactilityUser-` followed by 8 random hexadecimal characters, generated once.

## Radio

**Settings → Mesh → Radio** only shows when two or more radios can be used for mesh networking. The default is the first radio that isn't ESP-NOW. The choice is remembered, and takes effect right away.

ESP-NOW is a Wi-Fi radio mode. For MeshCore, Tactility uses MeshCore's ESP-NOW settings: unencrypted broadcasts, long range mode and 20 dBm.

- It only reaches other ESP-NOW nodes in Wi-Fi range, not LoRa nodes.
- Presets and regions don't apply to it.
- It shares Wi-Fi with the Chat app's ESP-NOW. While you're connected to an access point, it uses that access point's channel.
- Frames over 250 bytes aren't sent.
- Meshtastic doesn't support ESP-NOW.

## Regions and presets

| Mesh network | Regions |
|---|---|
| MeshCore | EU 868, US 915, AU 915 |
| Meshtastic | EU 433, EU 868, US 915, AU 915, NZ 865, IN 865, RU 868, CN 470, JP 920 |

Meshtastic uses the LongFast preset, in the frequency slot that its primary channel's name selects, like other Meshtastic nodes do.

Tactility limits how much the radio transmits, to stay within the duty cycle of your region (e.g. 1% or 10% of an hour in Europe). Before it transmits, it checks whether the channel is free.

## Channels

Both mesh networks come with a public channel: "Public" for MeshCore, "LongFast" for Meshtastic.

## Contacts and channels

Two apps cover chatting. Both open the same chat screen, and the settings icon in their toolbar opens the Mesh settings.

**Mesh Contacts**
- **+ Add by key**: enter a name and the public key in hexadecimal.
- **+ Add seen**: pick a node that was heard recently.
- **Show my QR**: shows a QR code that other MeshCore users can scan to add you. The code of a saved contact can be shown too.
- A node that sends you a direct message is added automatically.
- In the list of seen nodes, long names are cut off with an ellipsis. Long press an entry to see its full hash.
- The remove icon in a chat removes the contact. The messages are kept.

**Mesh Channels**

The **+** button in the toolbar offers:
- **Join public channel**: a hashtag channel such as `#test`. Its key comes from the name.
- **Join private channel**: enter the name and the key in hexadecimal.
- **Create private channel**: enter a name. Tactility makes a random key. Open the channel's chat and tap the info icon to see the key, so you can share it with people who should join.

The remove icon in a channel's chat leaves the channel. The primary channel can't be left.

**Chat**
- Messages show their state: queued, sent, delivered (acknowledged direct messages), or failed (no acknowledgement in time). Channel messages stay "sent", as they aren't acknowledged.
- Join and create need mesh to be running. The apps tell you the state when it isn't.

A QR code opens full screen in the **QR Code** app. Touch the screen, press a key or use the encoder to close it.

## Inspecting traffic

The `mesh inspect` command in the [Terminal](user-guide/shell-and-terminal.md) shows what the mesh network receives and sends, line by line. `mesh inspect 50` prints the latest 50 messages (20 without a number) and ends. `mesh inspect -f` (or `--follow`) prints them and then keeps following new traffic until you press **Ctrl+C** or **q**:

- Messages, with their channel or sender, the signal strength and, for sent messages, the delivery state
- Adverts: nodes announcing themselves
- Frames that couldn't be read, e.g. messages on a channel that you haven't joined
- Changes of the mesh state and of delivery states

## Storage

Messages are stored on your device's user data storage, so they survive a reboot. When the storage budget is full, the oldest messages are removed.

Your node's identity (a MeshCore key pair, or a Meshtastic node number) is created on first use, and stored there too.

## Limitations

- Tactility is a chat node: it doesn't repeat messages for other nodes.
- MeshCore: no direct routing (path learning), no repeater or room server requests and no multi-part messages.
- Meshtastic: no public key encryption of direct messages, no other presets than LongFast, and no positions or telemetry.
