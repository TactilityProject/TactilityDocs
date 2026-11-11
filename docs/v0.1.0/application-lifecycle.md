# Application Lifecycle

The app goes through these states:

```plantuml
@startuml
[*] --> onStart : app is created
onStart --> onShow : app becomes visible
onShow --> onHide : app is no longer visible
onHide --> onStop : app is preparing to be destroyed
onStop --> [*] : app is destroyed
skinparam ranksep 25
skinparam padding 2
@enduml
```

Let's look at a scenario where an app launches another app:

1. `first` app starts: `first.onStart()` -> `first.onShow()`
2. `second` app starts: `first.onHide()` -> `second.onStart()` -> `second.onShow()`
3. `second` app stops: `second.onHide()` -> `second.onStop()` -> `first.onShow()`
4. `first` app stops: `first.onHide()` -> `first.onStop()`
