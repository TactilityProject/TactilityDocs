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
4. **Pick a preset** (LoRa only). The preset sets the radio parameters, and must match the other nodes around you. Both mesh networks have their own card in the Mesh settings, which are always shown so you can set up a mesh network before you select it. See [Regions and presets](#regions-and-presets).

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

The **Region** is the legal limit for your radio: the frequencies and power that you may use. A preset sets the rest of the radio parameters. The settings of each mesh network are kept separately, and are remembered while another mesh network is selected.

### MeshCore

The **MeshCore** card in the Mesh settings has a **Selected preset**. Besides "Default", the list has the settings that the MeshCore community suggests for countries and regions, such as Australia, Netherlands, Netherlands (Limburg), EU/UK (Narrow), USA and Vietnam. "Default" is the standard setting of your region, for EU 868, US 915 and AU 915.

- Selecting a preset also sets the **Region** to the one that the preset needs, e.g. "Netherlands" selects EU 868. If the current region already allows the preset, it stays.
- Selecting a preset fills in the settings below it: frequency, bandwidth, spreading factor, coding rate, transmit power, path hash size and region scope. Turn on **Advanced settings** to see them and change them.
- A change of one of these settings replaces the value of the preset. "Profile value" in the selection (or an empty frequency or scope) goes back to the value of the preset. Selecting another preset clears your changes.
- **Frequency** is in MHz, e.g. `869.618`.
- **Path hash size** is the number of bytes per hop in the path of a packet (1 to 3). The presets of the Netherlands use 2 bytes. Other MeshCore nodes on your network need to use a size that they accept.
- **Region scope** limits flooded packets to a region, like the default scope in the MeshCore app. The presets of the Netherlands use `nl`. Enter `*` for no scope. Packets with a scope are only repeated by repeaters that know that region.
- A setting is refused when it doesn't fit the region. That includes a frequency or bandwidth that leaves the band of the region, and a power above the limit of the band that holds the frequency.

### Meshtastic

The **Meshtastic** card has a **Modem preset**: LongFast (the default), LongModerate, LongSlow, MediumFast, MediumSlow, ShortFast, ShortSlow and ShortTurbo. Its frequency slot comes from the name of the primary channel within the band of your region, like other Meshtastic nodes do.

- A preset that is wider than the band of your region can't be used, e.g. ShortTurbo in EU 868. The preset is refused, and the status shows "Settings not allowed in" and your region when settings stop the radio from starting.
- A primary channel that you never changed is named after the selected modem preset, like other Meshtastic nodes do. A primary channel that you configured keeps its name, so it keeps its frequency slot.
- Meshtastic uses the region that you set. It doesn't change it.

### Regions that each mesh network supports

| Mesh network | Regions |
|---|---|
| MeshCore | Any region that has a preset for it, such as EU 433, EU 868, US 915 and AU 915 |
| Meshtastic | EU 433, EU 868, US 915, AU 915, NZ 865, IN 865, RU 868, CN 470, JP 920 |

### Transmit limits

Tactility limits how much the radio transmits, to stay within the duty cycle of your region (e.g. 1% or 10% of an hour in Europe). Before it transmits, it checks whether the channel is free. The transmit power is also limited to what the band of your channel allows.

## Channels

Both mesh networks come with a public channel: "Public" for MeshCore, "LongFast" for Meshtastic. You can leave the "Public" channel of MeshCore and join it again later. The primary channel of Meshtastic can't be left.

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
- **Join public channel**: a hashtag channel such as `#test`. Its key comes from the name. To join MeshCore's "Public" channel again, enter `Public` without the `#`.
- **Join private channel**: enter the name and the key in hexadecimal.
- **Create private channel**: enter a name. Tactility makes a random key. Open the channel's chat and tap the info icon to see the key, so you can share it with people who should join.

The remove icon in a channel's chat leaves the channel. Meshtastic's primary channel can't be left: Tactility tells you so.

A channel that you join or create gets the next free number, after the primary channel.

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
- MeshCore: only the default region scope is supported, not scopes per channel.
- Meshtastic: no public key encryption of direct messages, and no positions or telemetry.
