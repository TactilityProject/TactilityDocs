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

Installed apps that are command-line tools (headless apps) are also available as commands, by the name of their binary.

### Files and folders

The storage is mounted at `/sdcard` (SD card), `/data` (internal storage) and `/system` (read-only system files). See [Storage and Settings](app-development/storage.md).

### Scripts and programs

- Run a shell script with `sh script.sh [arguments]`. The script gets its arguments as `$1`, `$2`, etc.
- Run an app binary directly by its path, e.g. `/sdcard/tools/hello.elf`.

## Writing command-line apps

An app becomes a shell command when its manifest marks it as headless (`app.0.headless=true`). It then runs without a window, with the terminal as its standard input and output:
- Read input with `getchar()`, `fgets()` or `read()`, and write output with `printf()`.
- Arguments arrive in `main(argc, argv)`, like in a regular C program.
- Return `0` from `main()` for success.

See [Fundamentals](app-development/fundamentals.md) for the manifest, and the CoreUtils example in [TactilityApps](https://github.com/TactilityProject/TactilityApps).
