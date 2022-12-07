import { ref, watch } from 'vue';
import { VcsObjectContentTreeItem } from '@vcmap/ui';
import { SplitDirection } from '@vcmap/cesium';
import { check } from '@vcsuite/check';

/**
 * @typedef {import("@vcmap/ui").ContentTreeItemOptions} SwipeTreeItemOptions
 * @property {string} name
 * @property {string} layerName
 * @property {boolean} [active]
 * @property {import("@vcmap/cesium").SplitDirection} [splitDirection]
 */

/**
 * @type {{left: Object, right: Object}}
 */
const stateMap = {
  left: {
    [SplitDirection.LEFT]: true,
    [SplitDirection.NONE]: true,
    [SplitDirection.RIGHT]: false,
  },
  right: {
    [SplitDirection.LEFT]: false,
    [SplitDirection.NONE]: true,
    [SplitDirection.RIGHT]: true,
  },
};

/**
 *
 * @param {import("@vcmap/cesium").SplitDirection} splitDirection
 * @param {boolean} active
 * @param {Object} states
 * @returns {boolean}
 */
function getState(splitDirection, active, states) {
  if (active) {
    return states[splitDirection];
  }
  return false;
}

/**
 * Creates an action
 * @param {import("vue").Ref<StateActionState>} splitDirectionRef
 * @param {import("vue").Ref<StateActionState>} stateRef
 * @param {function():void} callback
 * @returns {{ actions: Array<import("@vcmap/ui").VcsAction>, destroy: function():void }}
 */
export function createSplitStateRefActions(splitDirectionRef, stateRef, callback) {
  check(splitDirectionRef?.value, Object.values(SplitDirection));
  check(stateRef?.value, Boolean);
  check(callback, Function);

  const isRightActive = getState(splitDirectionRef.value, stateRef.value, stateMap.right);
  const isLeftActive = getState(splitDirectionRef.value, stateRef.value, stateMap.left);

  const splitRightAction = {
    name: 'split-right',
    active: isRightActive,
    icon: isRightActive ? '$vcsCheckboxChecked' : '$vcsCheckbox',
    title: isRightActive ? 'swipeTool.hideRight' : 'swipeTool.showRight',
    callback: () => callback(SplitDirection.RIGHT),
  };
  const splitLeftAction = {
    name: 'split-left',
    active: isLeftActive,
    icon: isLeftActive ? '$vcsCheckboxChecked' : '$vcsCheckbox',
    title: isLeftActive ? 'swipeTool.hideLeft' : 'swipeTool.showLeft',
    callback: () => callback(SplitDirection.LEFT),
  };

  const destroy = watch([splitDirectionRef, stateRef], () => {
    splitRightAction.active = getState(splitDirectionRef.value, stateRef.value, stateMap.right);
    splitRightAction.icon = splitRightAction.active ? '$vcsCheckboxChecked' : '$vcsCheckbox';
    splitRightAction.title = splitRightAction.active ? 'swipeTool.hideRight' : 'swipeTool.showRight';
    splitLeftAction.active = getState(splitDirectionRef.value, stateRef.value, stateMap.left);
    splitLeftAction.icon = splitLeftAction.active ? '$vcsCheckboxChecked' : '$vcsCheckbox';
    splitLeftAction.title = splitLeftAction.active ? 'swipeTool.hideLeft' : 'swipeTool.showLeft';
  });

  return {
    actions: [splitRightAction, splitLeftAction],
    destroy,
  };
}


/**
 * A swipe item. Splits left, right or none.
 * @class
 * @extends {VcsObjectContentTreeItem<SwipeContentTreeItemProperties>}
 */
class SwipeTreeItem extends VcsObjectContentTreeItem {
  /**
   * @todo this has to be refactored, just so we can read the config as is
   * @returns {string}
   */
  static get className() { return 'SwipeTreeItem'; }

  /**
   * @param {SwipeTreeItemOptions} options
   * @param {import("@vcmap/ui").VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);
    this.splitDirection = ref(options.splitDirection);

    this.active = ref(options.active);

    /**
     * @type {string}
     * @private
     */
    this._layerName = options.layerName;

    /**
     * @type {Array<Function>}
     * @private
     */
    this._listeners = [];

    this._setup();
  }

  /**
   * @type {import("@vcmap/core").Layer}
   * @private
   */
  get _layer() {
    return this._app.layers.getByKey(this._layerName);
  }

  /**
   * @private
   */
  _setSwipeActions() {
    this.removeAction('split-right');
    this.removeAction('split-left');

    const toggle = (direction) => {
      if (this._layer.active || this._layer.loading) {
        if (this._layer.splitDirection && this._layer.splitDirection !== direction) {
          this._layer.splitDirection = SplitDirection.NONE;
        } else if (this._layer.splitDirection === direction) {
          this._layer.deactivate();
        } else if (this._layer.splitDirection === SplitDirection.NONE) {
          this._layer.splitDirection = direction === SplitDirection.RIGHT ?
            SplitDirection.LEFT :
            SplitDirection.RIGHT;
        }
        this.splitDirection.value = this._layer.splitDirection;
        this.active.value = this._layer.active;
        return Promise.resolve();
      }

      // if (this._layer.exclusiveGroups.length > 0) {
      //   const activeLayersForGroup = this._layer.exclusiveGroups
      //     .map(group => this.getFramework().layerCollection.exclusiveManager.getActiveLayersForGroup(group))
      //     .flat();
      //
      //   if (
      //     activeLayersForGroup.length === 1 &&
      //     activeLayersForGroup[0].splitDirection === SplitDirection.NONE
      //   ) {
      //     activeLayersForGroup[0].splitDirection = direction === SplitDirection.RIGHT ?
      //       SplitDirection.LEFT :
      //       SplitDirection.RIGHT;
      //   }
      // }
      this._layer.splitDirection = direction;
      this.active.value = this._layer.active;
      this.splitDirection.value = this._layer.splitDirection;
      return this._layer.activate();
    };

    /**
     *
     * @type {Array<import("@vcmap/ui").VcsAction>}
     */
    const { actions, destroy } = createSplitStateRefActions(this.splitDirection, this.active, toggle);

    actions.forEach(a => this.addAction(a));
    this._listeners.push(destroy);
  }

  /**
   * @param {SwipeTreeItemProperties} properties
   * @protected
   */
  _setProperties(properties) {
    super._setProperties(properties);
    this._setSwipeActions();
  }

  /**
   * @private
   */
  _clearListeners() {
    this._listeners.forEach((cb) => { cb(); });
    this._listeners.splice(0);
  }

  /**
   * @private
   */
  _setup() {
    this._clearListeners();
    /**
     * Called when a layer is added or removed to reset the item if needed
     * @param {import("@vcmap/core").Layer} layer
     */
    const resetHandler = (layer) => {
      if (layer.name === this._layerName) {
        this._setup();
      }
    };

    if (!this._layer) {
      this.visible = false;
      this._listeners.push(this._app.layers.added.addEventListener(resetHandler));
    } else {
      this.visible = this._layer.isSupported(this._app.maps.activeMap);
      this.setPropertiesFromObject(this._layer);

      this._listeners.push(this._app.layers.removed.addEventListener(resetHandler));
      this._listeners.push(this._app.layers.added.addEventListener(resetHandler));

      this._listeners.push(this._layer.stateChanged.addEventListener(() => {
        this.active.value = this._layer.active;
      }));
      this._listeners.push(this._layer.splitDirectionChanged.addEventListener((direction) => {
        this.splitDirection.value = direction;
      }));

      this._listeners.push(this._app.maps.mapActivated.addEventListener(() => {
        this.visible = this._layer.isSupported(this._app.maps.activeMap);
      }));
    }
  }

  /**
   * @returns {SwipeTreeItemOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.layerName = this._layerName;
    return config;
  }

  destroy() {
    super.destroy();
    this._clearListeners();
  }
}

export default SwipeTreeItem;
// contentTreeClassRegistry.registerClass(LayerContentTreeItem.className, LayerContentTreeItem);
