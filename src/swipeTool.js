import deepEqual from 'fast-deep-equal';
import { parseBoolean, parseNumber } from '@vcsuite/parsers';
import { check, checkMaybe } from '@vcsuite/check';
import {
  GroupContentTreeItem,
  LayerContentTreeItem,
  LayerGroupContentTreeItem,
  NodeContentTreeItem,
  SubContentTreeItem,
} from '@vcmap/ui';
import { computed, ref } from 'vue';
import { SplitDirection } from '@vcmap-cesium/engine';
import { VcsEvent } from '@vcmap/core';
import SwipeElement from './swipeElement.js';
import LayerSwipeTreeItem from './swipeTree/layerSwipeTreeItem.js';
import {
  setupSwipeToolActions,
  setupSwipeToolActionsNoUI,
} from './actionHelper.js';
import GroupSwipeTreeItem from './swipeTree/groupSwipeTreeItem.js';
import LayerGroupSwipeTreeItem from './swipeTree/layerGroupSwipeTreeItem.js';

/**
 * @param {SwipeLayerOptions} options
 * @returns {SwipeLayerState}
 */
export function parseSwipeLayerState(options) {
  check(options.active, Boolean);
  checkMaybe(options.splitDirection, String);
  const key = options.splitDirection?.toUpperCase();

  return {
    active: options.active,
    splitDirection: SplitDirection[key] ?? SplitDirection.NONE,
  };
}

/**
 * @typedef {Object} SwipeLayerState
 * @property {import("@vcmap-cesium/engine").SplitDirection} splitDirection
 * @property {boolean} active
 */

/**
 * This widget allows to swipe split views of a {@link @vcmap/core.CesiumMap} or {@link @vcmap/core.OpenlayersMap} map.
 * {@link @vcmap/core.SplitLayer}s can be split
 * using their splitDirection property. This widget provides a {@link SwipeElement} to
 * swipe the split position. Changing the splitDirection property while the widget is active is tracked. Once
 * the widget is deactivated, the layer state previous its activation is reimplemented.
 * @class
 * @export
 * @api
 */
class SwipeTool {
  static get className() {
    return 'SwipeTool';
  }

  /**
   * Returns the default options for this Widget
   * @api
   * @returns {SwipeToolConfig}
   */
  static getDefaultOptions() {
    return {
      showSwipeTree: true,
      showSwipeElement: true,
      splitPosition: 0.5,
      swipeElementTitles: undefined,
      swipeLayerStates: undefined,
    };
  }

  /**
   * @param {import("@vcmap/ui").VcsUiApp} app
   * @param {SwipeToolConfig} options
   */
  constructor(app, options) {
    const defaultOptions = SwipeTool.getDefaultOptions();

    /**
     * @type {import("@vcmap/ui").VcsUiApp}
     * @private
     */
    this._app = app;
    /**
     * @type {boolean}
     * @private
     */
    this._active = false;
    /**
     * @type {number}
     * @private
     */
    this._splitPosition = parseNumber(
      options.splitPosition,
      SwipeTool.getDefaultOptions().splitPosition,
    );
    /**
     * @type {boolean}
     * @private
     */
    this._showSwipeTree = parseBoolean(
      options.showSwipeTree,
      defaultOptions.showSwipeTree,
    );
    /**
     * @type {boolean}
     * @private
     */
    this._showSwipeElement = parseBoolean(
      options.showSwipeElement,
      defaultOptions.showSwipeElement,
    );
    /**
     * @type {Object<string, string>|undefined}
     * @private
     */
    this._swipeElementTitles =
      options.swipeElementTitles || defaultOptions.swipeElementTitles;
    /**
     * @type {SwipeElement}
     * @private
     */
    this._swipeElement = new SwipeElement(app, this._swipeElementTitles);
    /**
     * @type {Object<string,SwipeLayerOptions>}
     */
    this.swipeLayerStates = options.swipeLayerStates;
    /**
     * @type {Object<string,SwipeLayerState>}
     * @private
     */
    this._cachedState = {};
    if (options.swipeLayerStates) {
      Object.entries(this.swipeLayerStates).forEach(
        ([layerName, swipeLayerOptions]) => {
          this._cachedState[layerName] =
            parseSwipeLayerState(swipeLayerOptions);
        },
      );
    }
    /**
     * @type {Object<string,SwipeLayerState>}
     * @private
     */
    this._initialState = {};
    /**
     * @type {import("vue").Ref<Array<string>>}
     * @private
     */
    this._subTreeIds = ref([]);
    /**
     * @type {Map<string, import("@vcmap/ui").TreeViewItem>}
     * @private
     */
    this._subTreeViewItems = new Map();
    /**
     * @type {import("@vcmap/core").VcsEvent<boolean>}
     */
    this.stateChanged = new VcsEvent();

    this._listeners = [
      app.contentTree.added.addEventListener(this.handleItemAdded.bind(this)),
      app.contentTree.removed.addEventListener(this.setTreeView.bind(this)),
      app.moduleAdded.addEventListener(this.setTreeView.bind(this)),
      this._swipeElement.positionChanged.addEventListener((position) => {
        this._splitPosition = position;
      }),
    ];
    /**
     * @type {function(): void}
     * @private
     */
    this._destroyActions = this._showSwipeTree
      ? setupSwipeToolActions(this._app, this)
      : setupSwipeToolActionsNoUI(this._app, this);
  }

  /**
   * @type {boolean}
   * @readonly
   */
  get active() {
    return this._active;
  }

  /**
   * @type {number}
   */
  get splitPosition() {
    return this._splitPosition;
  }

  /**
   * @param {number} position
   */
  set splitPosition(position) {
    check(position, Number);
    if (position < 0 || position > 1) {
      throw new Error('Position must be between 0 and 1');
    }
    this._splitPosition = position;
    if (this._active) {
      this._app.maps.splitPosition = this._splitPosition;
    }
  }

  /**
   * @type {boolean}
   */
  get showSwipeElement() {
    return this._showSwipeElement;
  }

  /**
   * @param {boolean} value
   */
  set showSwipeElement(value) {
    check(value, Boolean);
    this._showSwipeElement = value;
    if (value) {
      this._swipeElement.activate();
    } else {
      this._swipeElement.deactivate();
    }
  }

  /**
   * @type {boolean}
   */
  get showSwipeTree() {
    return this._showSwipeTree;
  }

  /**
   * @param {boolean} value
   */
  set showSwipeTree(value) {
    check(value, Boolean);
    this._showSwipeTree = value;
    this._destroyActions();
    this._destroyActions = this._showSwipeTree
      ? setupSwipeToolActions(this._app, this)
      : setupSwipeToolActionsNoUI(this._app, this);
  }

  /**
   * The title present on the swipe element.
   * @type {Object<string, string>|undefined}
   */
  get swipeElementTitles() {
    return this._swipeElementTitles;
  }

  /**
   * @param {Object<string, string>|undefined} titles
   */
  set swipeElementTitles(titles) {
    checkMaybe(titles, Object);

    this._swipeElementTitles = titles;
    if (this._swipeElement) {
      this._swipeElement.titles = this._swipeElementTitles;
    }
  }

  /**
   * @type {SwipeElement}
   * @readonly
   */
  get swipeElement() {
    return this._swipeElement;
  }

  /**
   * activates swipe tool by applying state
   */
  activate() {
    if (!this._active) {
      this._app.maps.splitPosition = this._splitPosition;
      if (this._showSwipeElement) {
        this._swipeElement.activate();
      }
      this._initialState = this.getState();
      this._active = true;
      this.setTreeView();
      this.applyState(this._cachedState);
      this.stateChanged.raiseEvent(this._active);
    }
  }

  /**
   * deactivating swipe tool by resetting state and clearing swipe tree
   */
  deactivate() {
    if (this._active) {
      this._splitPosition = this._app.maps.splitPosition;
      this._swipeElement.deactivate();
      const state = this.getState();
      this.setState(state);
      this.applyState(this._initialState);
      this._clearSwipeTree();
      this._active = false;
      this.stateChanged.raiseEvent(this._active);
    }
  }

  /**
   * Takes a mapped SwipeTreeItem and handles its children.
   * Removes all other actions than split actions.
   * Returns a mapped TreeViewItem to be used within SwipeTree
   * @param {import("@vcmap/ui").ContentTreeItem} mappedItem
   * @param {import("@vcmap/ui").TreeViewItem} item
   * @param {import("@vcmap/ui").ContentTreeCollection} contentTree
   * @returns {import("@vcmap/ui").TreeViewItem|null}
   * @private
   */
  _handleChildren(mappedItem, item, contentTree) {
    mappedItem.getTreeViewItem().children = item.children
      .map((c) => this._mapTreeItems(c, contentTree))
      .filter((c) => !!c);
    if (!(mappedItem instanceof NodeContentTreeItem)) {
      mappedItem.getTreeViewItem().clickable = false;
    }
    const actionsToRemove = mappedItem.actions
      .map((a) => a.name)
      .filter((name) => name !== 'split-right' && name !== 'split-left');
    actionsToRemove.forEach((name) => mappedItem.removeAction(name));
    return mappedItem.getTreeViewItem();
  }

  /**
   * maps ContentTreeItems to SwipeTreeItems
   * @param {import("@vcmap/ui").TreeViewItem} item
   * @param {import("@vcmap/ui").ContentTreeCollection} contentTree
   * @returns {import("@vcmap/ui").TreeViewItem|null}
   * @private
   */
  _mapTreeItems(item, contentTree) {
    const i = contentTree.getByKey(item.name);
    let mappedItem;
    const options = i.toJSON();
    if (i instanceof LayerContentTreeItem) {
      const layer = this._app.maps.layerCollection.getByKey(options.layerName);
      if (layer && layer.splitDirection !== undefined) {
        mappedItem = new LayerSwipeTreeItem(options, this._app);
      }
    } else if (i instanceof LayerGroupContentTreeItem) {
      mappedItem = new LayerGroupSwipeTreeItem(options, this._app);
    } else if (i instanceof GroupContentTreeItem) {
      mappedItem = new GroupSwipeTreeItem(options, this._app);
    } else if (i instanceof NodeContentTreeItem) {
      mappedItem = new NodeContentTreeItem(options, this._app);
    }

    if (mappedItem) {
      return this._handleChildren(mappedItem, item, contentTree);
    }

    return null;
  }

  /**
   * Sets swipe tree by deriving it from content tree.
   * Maps all entries of content tree with swipe layers to new LayerSwipeTreeItems or GroupLayerSwipeTreeItems.
   * Called whenever content tree changes.
   * Might be extended in future to support further sources apart from content tree.
   */
  setTreeView() {
    this._clearSwipeTree();
    if (this._active && this._showSwipeTree) {
      [...this._app.contentTree.subTreeViewItems.value.values()].forEach(
        (subTree, idx) => {
          const { name, title, tooltip, icon } = subTree;
          const mappedItem = new SubContentTreeItem(
            { name, title, tooltip, icon },
            this._app,
          );
          const swipeSubTree = this._handleChildren(
            mappedItem,
            subTree,
            this._app.contentTree,
          );

          const id = this._app.contentTree.subTreeIds[idx];
          this._subTreeViewItems.set(id, swipeSubTree);
          this._subTreeIds.value.push(id);
        },
      );
      // XXX other sources of swipe layers?
    }
  }

  /**
   * All ids of the currently managed subtrees. Ids are not persisted and will change if
   * the trees get recalculated.
   * @type {import("vue").Ref<Array<string>>}
   * @readonly
   */
  get subTreeIds() {
    return this._subTreeIds;
  }

  /**
   * @param {string} id
   * @returns {import("vue").ComputedRef<Array<import("vuetify").TreeViewItem>>}
   */
  getComputedVisibleTree(id) {
    return computed(() => {
      if (this._subTreeViewItems.has(id)) {
        return this._subTreeViewItems.get(id);
      }
      return [];
    });
  }

  /**
   * @private
   */
  _clearSwipeTree() {
    this._subTreeViewItems.clear();
    this._subTreeIds.value.splice(0);
  }

  /**
   * clears swipeTool by removing all items of managed layers and resetting initial state
   */
  clear() {
    this.applyState(this._initialState);
    this._cachedState = {};
    this._initialState = {};
    this._clearSwipeTree();
  }

  /**
   * Iterates over content tree collection and returns current SwipeLayerState
   * for all layers of LayerContentTreeItem and LayerGroupContentTreeItem.
   * @returns {Object<string,SwipeLayerState>}
   */
  getState() {
    const layerStates = [...this._app.contentTree]
      .map((item) => {
        const options = item.toJSON();
        return options.layerName || options.layerNames || [];
      })
      .flat()
      .filter(
        (layerName) =>
          this._app.layers.getByKey(layerName)?.splitDirection !== undefined,
      )
      .map((name) => {
        const { active, splitDirection } = this._app.layers.getByKey(name);
        return [name, { active, splitDirection }];
      });
    return Object.fromEntries(layerStates);
  }

  /**
   * Sets SwipeLayerState and applies it, if active.
   * @param {Object<string,SwipeLayerState>} state
   */
  setState(state) {
    this._cachedState = state;
    this.applyState(this._cachedState);
  }

  /**
   * Iterate over all cached SwipeLayerStates and apply state on the layer
   * @param {Object<string,SwipeLayerState>} state
   */
  applyState(state) {
    if (this._active) {
      Object.entries(state).forEach(([layerName, layerSwipeState]) => {
        this._applyStateToLayer(layerName, layerSwipeState);
      });
    }
  }

  /**
   * @param {string} layerName
   * @param {SwipeLayerState} layerSwipeState
   * @private
   */
  _applyStateToLayer(layerName, layerSwipeState) {
    const layer = this._app.maps.layerCollection.getByKey(layerName);
    if (layer && layer.splitDirection !== undefined) {
      layer.splitDirection = layerSwipeState.splitDirection;
      if (layer.active !== layerSwipeState.active) {
        if (layer.active) {
          layer.deactivate();
        } else {
          layer.activate();
        }
      }
    }
  }

  /**
   * Handles items added to the content tree
   * @param {import("@vcmap/ui").ContentTreeItem} item
   */
  handleItemAdded(item) {
    const options = item.toJSON();
    const layerNames = [options?.layerName] || options?.layerNames || [];
    layerNames.forEach((layerName) => {
      const layer = this._app.layers.getByKey(layerName);
      if (layer) {
        const { active, splitDirection } = layer;
        this._initialState[layerName] = { active, splitDirection };
        if (this._cachedState[layerName]) {
          if (this._active) {
            this._applyStateToLayer(layerName, this._cachedState[layerName]);
          }
        }
      }
    });
  }

  /**
   * @returns {SwipeToolConfig}
   */
  toJSON() {
    const config = {};
    const defaultOptions = SwipeTool.getDefaultOptions();
    if (this.showSwipeTree !== defaultOptions.showSwipeTree) {
      config.showSwipeTree = this.showSwipeTree;
    }
    if (this._showSwipeElement !== defaultOptions.showSwipeElement) {
      config.showSwipeElement = this._showSwipeElement;
    }
    if (this._splitPosition !== defaultOptions.splitPosition) {
      config.splitPosition = this._splitPosition;
    }
    if (
      !deepEqual(this.swipeElementTitles, defaultOptions.swipeElementTitles)
    ) {
      config.swipeElementTitles = this.swipeElementTitles;
    }
    if (!deepEqual(this.swipeLayerStates, defaultOptions.swipeLayerStates)) {
      config.swipeLayerStates = this.swipeLayerStates;
    }

    return config;
  }

  destroy() {
    this.deactivate();
    this.clear();
    this.stateChanged.destroy();
    this._listeners.forEach((cb) => cb());
    if (this._destroyActions) {
      this._destroyActions();
    }
    this._swipeElement.destroy();
  }
}

export default SwipeTool;
