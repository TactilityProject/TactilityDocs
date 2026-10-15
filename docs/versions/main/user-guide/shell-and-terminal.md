# Shell and Terminal

Tactility has a command-line shell, like on a computer. The **Terminal** app shows it on the device's screen.

## Terminal

Open the Terminal app from the Launcher. It's meant for devices with a keyboard: you type commands, and the output appears on the screen.

- On devices with external RAM, the terminal runs in a regular window. On touch devices, tap the terminal to show or hide the toolbar with the close button.
- On devices without external RAM, the terminal takes over the whole screen, as the window needs too much memory. Without a keyboard attached, touch the screen to exit.
- Type `exit` to close the shell and the terminal.

## Using the shell

The shell is a small POSIX-style shell, similar to `sh`:

- **Pipes and redirection:** `ls | wc`, `echo hello > note.txt`, `cat note.txt >> log.txt`
- **Variables:** `NAME=world`, `echo "Hello $NAME"`, `export`
- **Control flow:** `if`, `while`, `for`, `case`, functions, `&&` and `||`
- **Wildcards:** `ls *.txt`
- **Line editing:** the arrow keys move through the line and the command history, and **Tab** completes commands and paths.

### Commands

The shell's own commands:

| Command | Purpose |
|---|---|
| `cd`, `pwd` | Change and show the current folder |
| `echo`, `printf` | Print text |
| `test`, `[` | Compare values and check files |
| `read`, `set`, `export`, `unset`, `local`, `shift` | Variables and arguments |
| `exit`, `return`, `break`, `continue`, `true`, `false` | Control flow |

Standard tools:

| Command | Purpose |
|---|---|
| `ls`, `cat`, `head`, `tail`, `wc` | Show folders and files |
| `cp`, `mv`, `rm`, `mkdir`, `touch` | Manage files and folders |
| `df`, `du`, `free` | Storage and memory usage |
| `date` | Show the date and time |
| `clear` | Clear the screen |
| `which` | Show where a command comes from |
| `help` | List the available commands |

On devices with Wi-Fi, `wifi` controls the Wi-Fi connection:

| Command | Purpose |
|---|---|
| `wifi status` | Show the radio state, and the network, IP address and signal strength when connected |
| `wifi radio on`, `wifi radio off` | Turn the Wi-Fi radio on or off |
| `wifi scan` | List the nearby access points. Saved networks are marked with `*` |
| `wifi connect -s <ssid> [-p <password>] [-c <channel>] [--no-save]` | Connect to a network. Without `-p`, it uses the saved password, or connects to an open network. A new network is saved once connected, unless you add `--no-save` |
| `wifi disconnect` | Disconnect from the network |
| `wifi saved` | List the saved networks |
| `wifi forget -s <ssid>` | Remove a saved network |

On devices with mesh networking support, `mesh` controls the mesh network, like the **Mesh Settings** app:

| Command | Purpose |
|---|---|
| `mesh status` | Show whether mesh is on, and its backend, preset and region |
| `mesh on`, `mesh off` | Turn mesh networking on or off |
| `mesh backend [<id>]` | List the backends (e.g. `meshcore`, `meshtastic`), or select one |
| `mesh region [<name>]` | List the radio regions (e.g. `EU_868`), or set yours |
| `mesh preset [<name>]` | List the radio presets of the backend, or select one |
| `mesh channels` | List the channels |
| `mesh join <#channel>` | Join a hashtag channel, e.g. `mesh join #test` |

The lists mark the current choice with `*`. The radio stays off until you set a region.

Installed apps that are command-line tools (headless apps) are also available as commands, by the name of their binary. Apps that are also hidden (`hidden=true` in their manifest) are not.

### Files and folders

The storage is mounted at `/sdcard` (SD card), `/data` (internal storage) and `/system` (read-only system files). See [Storage and Settings](app-development/storage.md).

### Scripts and programs

- Run a shell script with `sh script.sh [arguments]`. The script gets its arguments as `$1`, `$2`, etc.
- Run a command line with `sh -c "<command>"`, e.g. `sh -c "ls | wc"`.
- Run an app binary directly by its path, e.g. `/sdcard/tools/hello.elf`.

## Remote shell

You can also use the shell from a computer on the same network, with the [tt tool](app-development/tt.md):

- `./tt shell` opens an interactive shell.
- `./tt shell <command>` runs one command and returns its exit code, e.g. `./tt shell ls /sdcard`. Quote a command with pipes or `;`, e.g. `./tt shell 'ls | wc'`.

This needs the development server on the device, see [Remote Access](user-guide/remote-access.md).

## Writing command-line apps

An app becomes a shell command when its manifest marks it as headless (`app.0.headless=true`), and not as hidden. It then runs without a window, with the terminal as its standard input and output:
- Read input with `getchar()`, `fgets()` or `read()`, and write output with `printf()`.
- Arguments arrive in `main(argc, argv)`, like in a regular C program.
- Return `0` from `main()` for success.

See [Fundamentals](app-development/fundamentals.md) for the manifest, and the CoreUtils example in [TactilityApps](https://github.com/TactilityProject/TactilityApps).
