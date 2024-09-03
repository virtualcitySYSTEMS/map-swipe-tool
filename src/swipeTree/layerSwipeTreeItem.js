import { reactive, ref, watch } from 'vue';
import { VcsObjectContentTreeItem } from '@vcmap/ui';
import { SplitDirection } from '@vcmap-cesium/engine';
import { check } from '@vcsuite/check';

/**
 *
 * @enum {number}
 * @property {number} INACTIVE - hidden on this side
 * @property {number} ACTIVE - visible on this side
 * @property {number} INDETERMINATE - either hidden or visible
 */
export const SplitActionState = {
  INACTIVE: 0,
  ACTIVE: 1,
  INDETERMINATE: 2,
};

/**
 * Mapping to icons.
 * @type {Object<SplitActionState, string>}
 */
const stateIconMap = {
  [SplitActionState.INACTIVE]: '$vcsCheckbox',
  [SplitActionState.ACTIVE]: '$vcsCheckboxChecked',
  [SplitActionState.INDETERMINATE]: '$vcsCheckboxIndeterminate',
};

/**
 * Mapping to i18n titles. Requires appending either 'Left' or 'Right' to match an available i18n string.
 * @type {Object<SplitActionState, string>}
 */
const stateI18nMap = {
  [SplitActionState.INACTIVE]: 'swipeTool.stateActionTitles.inactive',
  [SplitActionState.ACTIVE]: 'swipeTool.stateActionTitles.active',
  [SplitActionState.INDETERMINATE]: 'swipeTool.stateActionTitles.indeterminate',
};

/**
 * @typedef {Object} SplitActionStateObject
 * @property {SplitActionState} left
 * @property {SplitActionState} right
 */

/**
 * Creates an action
 * @param {SplitActionStateObject} splitStateObj
 * @param {function():void} callback
 * @returns {{ actions: Array<import("@vcmap/ui").VcsAction>, destroy: () => void }}
 */
export function createSplitStateRefActions(splitStateObj, callback) {
  check(splitStateObj.left.value, Object.values(SplitActionState));
  check(splitStateObj.right.value, Object.values(SplitActionState));
  check(callback, Function);

  const { left, right } = splitStateObj;

  const splitRightAction = reactive({
    name: 'split-right',
    active: !!right.value,
    icon: stateIconMap[right.value],
    title: `${stateI18nMap[right.value]}Right`,
    callback: () => callback(SplitDirection.RIGHT),
  });

  const destroyWatcherRight = watch(right, (newValue) => {
    splitRightAction.active = !!newValue;
    splitRightAction.icon = stateIconMap[newValue];
    splitRightAction.title = `${stateI18nMap[right.value]}Right`;
  });

  const splitLeftAction = reactive({
    name: 'split-left',
    active: !!left.value,
    icon: stateIconMap[left.value],
    title: `${stateI18nMap[left.value]}Left`,
    callback: () => callback(SplitDirection.LEFT),
  });

  const destroyWatcherLeft = watch(left, (newValue) => {
    splitLeftAction.active = !!newValue;
    splitLeftAction.icon = stateIconMap[newValue];
    splitLeftAction.title = `${stateI18nMap[left.value]}Left`;
  });

  return {
    actions: [splitRightAction, splitLeftAction],
    destroy: () => {
      destroyWatcherRight();
      destroyWatcherLeft();
    },
  };
}

/**
 * applies splitDirection on a layer
 * @param {import("@vcmap/core").LayerCollection} layerCollection
 * @param {import("@vcmap/core").SplitLayer} layer
 * @param {import("@vcmap-cesium/engine").SplitDirection} direction
 * @returns {Promise<void>}
 */
export function toggle(layerCollection, layer, direction) {
  if (layer.active || layer.loading) {
    if (layer.splitDirection && layer.splitDirection !== direction) {
      layer.splitDirection = SplitDirection.NONE;
    } else if (layer.splitDirection === direction) {
      layer.deactivate();
    } else if (layer.splitDirection === SplitDirection.NONE) {
      layer.splitDirection =
        direction === SplitDirection.RIGHT
          ? SplitDirection.LEFT
          : SplitDirection.RIGHT;
    }
    return Promise.resolve();
  }

  if (layer.exclusiveGroups.length > 0) {
    const activeLayersForGroup = layer.exclusiveGroups
      .map((group) =>
        layerCollection.exclusiveManager.getActiveLayersForGroup(group),
      )
      .flat();

    if (
      activeLayersForGroup.length === 1 &&
      activeLayersForGroup[0].splitDirection === SplitDirection.NONE
    ) {
      activeLayersForGroup[0].splitDirection =
        direction === SplitDirection.RIGHT
          ? SplitDirection.LEFT
          : SplitDirection.RIGHT;
    }
  }
  layer.splitDirection = direction;
  return layer.activate();
}

/**
 * @param {import("@vcmap/core").SplitLayer} layer
 * @returns {SplitActionStateObject}
 */
export function getSplitStateFromLayer(layer) {
  if (layer.active) {
    if (layer.splitDirection === SplitDirection.LEFT) {
      return {
        left: SplitActionState.ACTIVE,
        right: SplitActionState.INACTIVE,
      };
    } else if (layer.splitDirection === SplitDirection.NONE) {
      return { left: SplitActionState.ACTIVE, right: SplitActionState.ACTIVE };
    } else {
      return {
        left: SplitActionState.INACTIVE,
        right: SplitActionState.ACTIVE,
      };
    }
  }
  return { left: SplitActionState.INACTIVE, right: SplitActionState.INACTIVE };
}

/**
 * @typedef {import("@vcmap"/ui).ContentTreeItemOptions} LayerSwipeTreeItemOptions
 * @property {string} layerName
 */

/**
 * A swipe item. Splits left, right or none.
 * @class
 * @extends {import("@vcmap/ui").VcsObjectContentTreeItem}
 */
class LayerSwipeTreeItem extends VcsObjectContentTreeItem {
  /**
   * @returns {string}
   */
  static get className() {
    return 'LayerSwipeTreeItem';
  }

  /**
   * @param {LayerSwipeTreeItemOptions} options
   * @param {import("@vcmap/ui").VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {SplitActionStateObject}
     * @private
     */
    this._splitState = {
      left: ref(SplitActionState.ACTIVE),
      right: ref(SplitActionState.ACTIVE),
    };

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

    /**
     * @type {function(): void}
     * @private
     */
    this._destroyWatcher = null;

    this._setup();
  }

  /**
   * @type {SplitActionStateObject}
   */
  get splitState() {
    return this._splitState;
  }

  /**
   * @param {SplitActionStateObject} state
   */
  set splitState(state) {
    check(state.left, Object.values(SplitActionState));
    check(state.right, Object.values(SplitActionState));

    if (this._splitState.left.value !== state.left) {
      this._splitState.left.value = state.left;
    }
    if (this._splitState.right.value !== state.right) {
      this._splitState.right.value = state.right;
    }
  }

  /**
   * @type {import("@vcmap/core").SplitLayer}
   */
  get layer() {
    return /** @type {import("@vcmap/core").SplitLayer} */ this._app.layers.getByKey(
      this._layerName,
    );
  }

  /**
   * @private
   */
  _setSwipeActions() {
    this.removeAction('split-right');
    this.removeAction('split-left');

    const cb = toggle.bind(this, this._app.maps.layerCollection, this.layer);
    const { actions, destroy } = createSplitStateRefActions(
      this._splitState,
      cb,
    );
    actions.forEach((a) => this.addAction(a));
    this._destroyWatcher = destroy;
  }

  /**
   * @private
   */
  _clearListeners() {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
  }

  /**
   * @private
   */
  _setup() {
    this._clearListeners();
    this._setSwipeActions();
    /**
     * Called when a layer is added or removed to reset the item if needed
     * @param {import("@vcmap/core").Layer} layer
     */
    const resetHandler = (layer) => {
      if (layer.name === this._layerName) {
        this._setup();
      }
    };

    if (!this.layer) {
      this.visible = false;
      this._listeners.push(
        this._app.layers.added.addEventListener(resetHandler),
      );
    } else {
      this.visible = this.layer.isSupported(this._app.maps.activeMap);
      this.setPropertiesFromObject(this.layer);

      this._listeners.push(
        this._app.layers.removed.addEventListener(resetHandler),
      );
      this._listeners.push(
        this._app.layers.added.addEventListener(resetHandler),
      );

      this._listeners.push(
        this._app.maps.mapActivated.addEventListener(() => {
          this.visible = this.layer.isSupported(this._app.maps.activeMap);
        }),
      );

      this._listeners.push(
        this.layer.stateChanged.addEventListener(() => {
          this.splitState = getSplitStateFromLayer(this.layer);
        }),
      );
      this._listeners.push(
        this.layer.splitDirectionChanged.addEventListener(() => {
          this.splitState = getSplitStateFromLayer(this.layer);
        }),
      );

      this.splitState = getSplitStateFromLayer(this.layer);
    }
  }

  /**
   * @inheritDoc
   * @returns {import("@vcmap/ui").TreeViewItem}
   */
  getTreeViewItem() {
    const treeViewItem = super.getTreeViewItem();
    Object.assign(treeViewItem, { splitState: this._splitState });
    return treeViewItem;
  }

  /**
   * @returns {import("@vcmap/ui").LayerContentTreeItemOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.layerName = this._layerName;
    return config;
  }

  destroy() {
    super.destroy();

    if (this._destroyWatcher) {
      this._destroyWatcher();
    }

    this._clearListeners();
  }
}

export default LayerSwipeTreeItem;
