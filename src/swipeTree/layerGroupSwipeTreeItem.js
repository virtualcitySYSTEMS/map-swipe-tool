import { SplitDirection } from '@vcmap-cesium/engine';
import {
  createSplitStateRefActions,
  getSplitStateFromLayer,
  SplitActionState,
  toggle,
} from './layerSwipeTreeItem.js';
import SwipeTreeItem from './swipeTreeItem.js';

/**
 * @param {Array<SplitActionStateObject>} states
 * @param {string} side
 * @returns {SplitActionState}
 */
export function getGroupStateForSide(states, side) {
  if (states.every((s) => s[side] === SplitActionState.ACTIVE)) {
    return SplitActionState.ACTIVE;
  }
  if (states.every((s) => s[side] === SplitActionState.INACTIVE)) {
    return SplitActionState.INACTIVE;
  }
  return SplitActionState.INDETERMINATE;
}

/**
 * @param {Array<SplitActionStateObject>} states
 * @returns {SplitActionStateObject}
 */
export function getGroupStates(states) {
  return {
    left: getGroupStateForSide(states, 'left'),
    right: getGroupStateForSide(states, 'right'),
  };
}

/**
 * @param {Array<import("@vcmap/core").Layer>} layers
 * @returns {SplitActionStateObject}
 */
export function getSplitStateFromLayers(layers) {
  return getGroupStates(layers.map((l) => getSplitStateFromLayer(l)));
}

/**
 * A group item which has _no click handler_
 * @class
 * @extends {import("@vcmap/ui").ContentTreeItem}
 */
class LayerGroupSwipeTreeItem extends SwipeTreeItem {
  /**
   * @returns {string}
   */
  static get className() {
    return 'LayerGroupSwipeTreeItem';
  }

  /**
   * @param {import("@vcmap/ui").LayerGroupContentTreeItemOptions} options
   * @param {import("@vcmap/ui").VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {Array<string>}
     * @private
     */
    this._layerNames = Array.isArray(options.layerNames)
      ? options.layerNames.slice()
      : [];
    /**
     * @type {Array<Function>}
     * @private
     */
    this._listeners = [];

    this._setup();
  }

  /**
   * @type {Array<import("@vcmap/core").SplitLayer>}
   * @private
   */
  get _layers() {
    return this._layerNames
      .map((n) => this._app.layers.getByKey(n))
      .filter((l) => l)
      .filter((l) => l.splitDirection !== undefined);
  }

  /**
   * @private
   */
  _setSwipeActions() {
    this.removeAction('split-right');
    this.removeAction('split-left');

    const cb = (dir) => {
      this._layers
        .filter((layer) => {
          const splitState = getSplitStateFromLayer(layer);
          if (dir === SplitDirection.LEFT) {
            const active =
              this.splitState.left.value === SplitActionState.ACTIVE;
            return active
              ? splitState.left === SplitActionState.ACTIVE
              : splitState.left !== SplitActionState.ACTIVE;
          } else if (dir === SplitDirection.RIGHT) {
            const active =
              this.splitState.right.value === SplitActionState.ACTIVE;
            return active
              ? splitState.right === SplitActionState.ACTIVE
              : splitState.right !== SplitActionState.ACTIVE;
          }
          return false;
        })
        .forEach((layer) => toggle(this._app.maps.layerCollection, layer, dir));
    };
    const actions = createSplitStateRefActions(this._splitState, cb);
    actions.forEach((a) => this.addAction(a));
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
      if (this._layerNames.includes(layer.name)) {
        this._setup();
      }
    };
    const layers = this._layers;

    this.visible = layers.some((l) => l.isSupported(this._app.maps.activeMap));
    this._setSwipeActions();

    this._listeners.push(
      this._app.layers.removed.addEventListener(resetHandler),
    );
    this._listeners.push(this._app.layers.added.addEventListener(resetHandler));

    this._listeners.push(
      this._app.maps.mapActivated.addEventListener(() => {
        this.visible = !!layers.find((l) =>
          l.isSupported(this._app.maps.activeMap),
        );
      }),
    );

    layers.forEach((layer) => {
      this._listeners.push(
        layer.stateChanged.addEventListener(() => {
          this.splitState = getSplitStateFromLayers(layers);
        }),
      );
      this._listeners.push(
        layer.splitDirectionChanged.addEventListener(() => {
          this.splitState = getSplitStateFromLayers(layers);
        }),
      );
    });

    this.splitState = getSplitStateFromLayers(layers);
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
   * @returns {import("@vcmap/ui").LayerGroupContentTreeItemOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.layerNames = this._layerNames.slice();
    return config;
  }

  /**
   * @inheritDoc
   */
  destroy() {
    this._clearListeners();
    super.destroy();
  }
}

export default LayerGroupSwipeTreeItem;
