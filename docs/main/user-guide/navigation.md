# Navigation

Tactility works with a touchscreen, a keyboard, a trackball, an encoder or a few buttons. This page explains how to get around with each of them.

## The screen

The screen has two parts:

- **Statusbar:** shows the time and status icons, like Wi-Fi and the battery. When the bar is too full, the icons that matter most stay: for example a critical battery before the Wi-Fi icon, and the buttons of the system bars before the icons.
- **App area:** the app that is running. The Launcher is the home screen.

On wide screens, the statusbar becomes a strip on the left side of the screen (the "side" layout). The Launcher's buttons then move into that strip. Pick the layout in **Settings → Appearance**: **Auto** uses the side layout on wide landscape screens, or you can choose the layout for portrait and landscape yourself.

## Launcher

The Launcher shows your apps as a grid of tiles.

- **Tap a tile** to open the app.
- **Swipe left or right** on the grid to go to the next or previous page. In the side layout, where the page buttons point up and down, **swipe up or down** instead. A swipe that starts on a tile doesn't open it. The `<` and `>` buttons in the bar below the grid (or the up and down buttons in the strip) do the same, and the dots show which page you're on. The pages wrap around: after the last page comes the first.
- **The mode button** in the bar switches between your **apps** and the **settings**. Its icon shows the mode it switches to.

### Favourites

**Long press** an app tile to make it a favourite. Favourites get a badge and are shown first, before the other apps. Long press it again to remove it from the favourites.

Favourites are only for apps, not for settings.

## System menu

There are two system menus: the **Settings** (quick toggles, volume and memory) and the **Notifications**. Only one of them is shown at a time. See [Notifications](notifications.md) for the second one.

To open them:
- **Swipe down** on the statusbar, or in the side layout, **swipe down from the top edge** of the screen. A swipe that starts in the **left half** of the screen opens the Settings, and one that starts in the **right half** opens the Notifications.
- **Tap** the status icons in the statusbar to open the Settings.
- **Press the notifications button** in the system bars to open the Notifications.

To close it:
- **Swipe up**, or **tap** outside of the menu.
- Press **Esc** on a keyboard.
- Without a touchscreen, select the close button.

Devices without a touchscreen have a close button in the top row, and the Settings have a power off button on its right. The menu is narrower on wide landscape screens.

### Settings

- **Toggles** for Wi-Fi, location (GPS), Bluetooth and Mesh. It only shows the ones that your device has (Mesh appears once it's set up, see [Mesh Networking](mesh.md)). **Long press** a toggle to close the menu and open the settings of that feature.
- **Volume**, when the device has sound output. A speaker button mutes and unmutes (it's filled while the sound is on), and the **-** and **+** buttons change the volume in steps of 10. On a touchscreen with enough room there is a slider between them. Otherwise the volume is shown as a percentage.
- **Memory**, on devices where it is useful. A ring shows how much internal RAM is free, and a second one shows the free PSRAM when the device has it. The number inside is the free amount, in kB, MB or GB, with at most 3 digits. The ring turns amber when memory is getting low and red when it is critical (below 64 kB and 32 kB of internal RAM, or below 20% and 10% of the PSRAM). On monochrome displays, a critical ring is shown inverted. The rings are in the middle of the top row, between the close and power off buttons, and are left out when there isn't room for them.
- If the toggles don't fit, they scroll vertically.

## Keyboard, trackball and buttons

Without touch, you move a **focus** between the items on the screen, and the selected item is highlighted.

| Key | Action |
|---|---|
| Arrow keys | Move between the tiles in the grid, and between buttons in a bar or toolbar |
| Enter | Open the focused app, or press the focused button |
| `f` | Add the focused app to the favourites, or remove it (in the Launcher's apps) |
| Esc | Close the system menu |
| Left and right arrows | Move between the close button and the power off button in the top row of the system menu, between the toggles, and between the buttons of the volume row |

- In the Launcher, the arrow keys move through the grid in rows and columns. At the edge of the grid, they move on to the buttons in the bar.
- In the side layout, the **right** arrow key moves from the strip on the left to the app.
- The status icons can also be focused: press **Enter** on them to open the system menu. In the side layout, moving down from the status icons goes to the notifications button first, then the previous and next page buttons, and then the main action button.
- A trackball moves the focus like the arrow keys, and pressing it works like Enter.
- Encoders and buttons that can only step forward and backward go through the items in order.

When an app is open, the close button in its toolbar returns you to the Launcher. On devices without touch, that button is focused when the app opens.
