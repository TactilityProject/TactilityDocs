# Project Structure

- `App`: The application/firmware example project
- `Boards`: Contains board configuration projects with drivers (and simulator)
- `Tactility`: The main application platform code
- `TactilityC`: C wrappers for making side-loaded apps (C++ is not supported yet)
- `TactilityHeadless`: Service framework and default services.
- `TactilityCore`: Core functionality regarding threads, stdlib, etc.
- `Libraries`: Contains a mix of regular libraries and ESP modules

```plantuml
@startuml
skinparam componentStyle uml1

[InternalApp]
note top of InternalApp : An app that's built into the main firmware
[ExternalApp]
note right of ExternalApp : An app that can run from external storage / SPIFFS
[TactilityC]
note right of TactilityC : optional wrapper to expose Tactility a C code\nC++ is not supported here. 
[Tactility]
note right of Tactility : facilitate apps with a UI
[TactilityHeadless]
note right of TactilityHeadless : facilitate background services
[TactilityCore]
note right of TactilityCore : defines, data types, logging, async, etc.

[InternalApp] ..> [Tactility]
[ExternalApp] ..> [TactilityC]
[TactilityC] ..> [Tactility]
[Tactility] ..> [TactilityHeadless]
[TactilityHeadless] ..> [TactilityCore]

@enduml
```
