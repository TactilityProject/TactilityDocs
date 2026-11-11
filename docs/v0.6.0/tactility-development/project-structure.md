# Project Structure

- `Boards`: Board implementation projects
- `Drivers`: Core drivers, Tactility drivers
- `Firmware`: The main project to build the firmware (and simulator)
- `Libraries`: A mix of regular libraries and ESP components
- `Tactility`: The main application platform
- `TactilityC`: C wrappers for Tactility used by external apps
- `TactilityCore`: Core functionality (e.g. IO, multi-tasking, logging, etc.)

```plantuml
@startuml
skinparam componentStyle uml1

[InternalApp]
note top of InternalApp : An app that's built into the main firmware
[ExternalApp]
note right of ExternalApp : An app that was installed later
[TactilityC]
note right of TactilityC : Wrapper that exposes Tactility as C code
[Tactility]
note right of Tactility : Facilitate apps, services and HAL
[TactilityCore]
note right of TactilityCore : IO, data types, logging, async, etc.

[InternalApp] ..> [Tactility]
[ExternalApp] ..> [TactilityC]
[TactilityC] ..> [Tactility]
[Tactility] ..> [TactilityCore]

@enduml
```
