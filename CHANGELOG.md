# v4.1.0

- Adds `ActivateSwipeToolCallback` and `DeactivateSwipeToolCallback` to activate and deactivate the swipe tool via the VcsCallback system
- Adds `activeOnStartup` config option to activate the swipe tool automatically on startup when no saved state is present

# v4.0.1

- Fixes a bug where plugin's state would include layer with SplitDirection set to none

# v3.0.0

- Convert SwipeTool plugin to TypeScript
- Makes the open state of the groups match the ContentTree on startup
- Fixes a bug where the initial open state of groups would not be respected

# v2.0.1

- Fixes a bug where editing the Swipe Element Titles would uncheck the relative checkbox
- Fixes a bug where the Initial Split Position could be set to an invalid value

# v2.0.0

- Updates @vcmap/core and @vcmap/ui to 6.x
- Fixes a bug where Swipe Element Titles would not be displayed

# 1.0.12

- Set url state, only if plugin is active
- Shorten url param
- add plugin interface spec

# v1.0.9

- deactivate swipeTool beforeDestroy
- add info url to swipe window

# v1.0.7

- Fixed testRunner
- Fixed Slider Position, now offset by 2px

# v1.0.0

Swipe Tool
