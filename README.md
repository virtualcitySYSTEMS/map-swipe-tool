# @vcmap/swipe-tool

> Part of the [VC Map Project](https://github.com/virtualcitySYSTEMS/map-ui)

The swipe tool can be used to compare different states within the VC Map.
It provides a simple split view with predefined split states or an extended view with a TreeView of SplitLayers.
Its activation button is located within the toolbar.

## Simple vs. Extended Swipe Tool

Depending on its configuration the behaviour of the swipe tool button differs.

### a) Simple Swipe Tool
If `showSwipeTree` is configured to `false`, the button shows on activation the Swipe Controller and applies the configured `swipeLayerStates`.
Moving the Swipe Controller a user can interactively compare two predefined states of an object or scene.
Clicking the tool button again, hides the Swipe Controller and resets the original state.

### b) Extended Swipe Tool with Swipe TreeView Window
Per default, on activation a Window with a swipe tree opens, where the user can interactively apply states on available layers.
The swipe tree is derived from the content tree mapping the structure and items to SwipeTreeItems with two actions:
- split left, to show or hide the layer on the left side
- split right, to show or hide the layer on the right side

The Swipe Tool window offers additional header actions to hide the Swipe Controller, deactivate and reactivated the Swipe Tool and to view help.
Clicking the Swipe Tool button in active state, closes the window. It doesn't deactivate the tool, though!

## Configuration

The `SwipeToolConfig` contains the following options:

| property           | type                                          | default   | description                                                         |
|--------------------|-----------------------------------------------|-----------|---------------------------------------------------------------------|
| showSwipeTree      | boolean                                       | true      | Whether Swipe Tree is shown on tool activation.                     |
| showSwipeElement   | boolean                                       | true      | Whether to show or hide Swipe Controller on activation.             |
| swipeElementTitles | Object<string,string>&vert;undefined          | undefined | An object with keys 'left' and 'right' containing titles.           |
| swipeLayerStates   | Object<string,LayerSwipeState&vert;undefined> | undefined | An object with layer name as key and state of SplitLayers as value. |

A `LayerSwipeState` can be defined. This state is applied on first activation of the tool.
If no values are provided or after deactivation and reactivation the current state of the layers are used.

The configuration is done with the following options:

| property       | type    | description                                                                             |
|----------------|---------|-----------------------------------------------------------------------------------------|
| splitDirection | string  | The split direction of the layer. Either 'left' or 'right', if omitted none is applied. |
| active         | boolean | The active state of the layer.                                                          |

A config entry could for example look like:
```json
{
  "name": "@vcmap/swipe-tool",
  "showSwipeTree": true,
  "showSwipeElement": true,
  "swipeLayerStates": {
    "Openstreetmap OSM Cache": {
      "active": true,
      "splitDirection": 1
    }
  },
  "swipeElementTitles": {
    "left": "Left",
    "right": "Right"
  }
}
```

## API

The Swipe Tool plugin can be accessed via the `VcsUiApp`.
It's provided on the plugin by a getter:
```js
const { swipeTool } = vcsUiApp.plugins.getByKey('@vcmap/swipe-tool');
```

### Activation and deactivation

To activate the swipeTool via API call:
```js
swipeTool.activate();
```

To deactivate the swipeTool via API call:
```js
swipeTool.deactivate();
```

### Change configuration (tree view, titles)

To toggle whether the tree view is shown or not use:
```js
swipeTool.showSwipeTree = true; // or false
```
The setter will trigger a new setup of the swipe tool actions.

To update the `swipeElementTitles` use:
```js
swipeTool.swipeElementTitles = {
  left: 'My new left title',
  right: 'My new right title',
}
```

### Adding or removing swipe layers

To add a layer to the swipe tree, you have to add a [LayerContentTreeItem](https://github.com/virtualcitySYSTEMS/map-ui/blob/main/documentation/CONTENT_TREE.md#vcsobject) to the content tree collection.
The swipe tree is automatically derived from the content tree and will be updated each time, the content tree changes.

### Swipe Tool State

The swipe tool has to private properties for state:
- `_initialState` is cached on activation and applied on deactivation.
- `_cachedState` is the tool's internal state. It is updated on deactivation or whenever `setState` is called. 

Methods to work with the state:

#### getState
```js
const currentState = swipeTool.getState();
```
Iterates over content tree collection and returns current SwipeLayerState for all layers of LayerContentTreeItem and LayerGroupContentTreeItem.

#### setState
```js
swipeTool.setState({ 'layerName': { active: true, splitDirection: -1 } });
```
Sets a new state and applies it, if the tool is active.

#### applyState
```js
swipeTool.applyState({ 'layerName': { active: true, splitDirection: -1 } });
```
Applies the provided state to all referenced layers, if the tool is active.

#### clear
```js
swipeTool.clear();
```
Clearing the swipe tool removes all items from the tree view, if present, and resets the initial swipe state on all swipe layers.
It also clears cached states of `_cachedState` and `_initialState`.
