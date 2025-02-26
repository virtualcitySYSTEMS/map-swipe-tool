import deepEqual from 'fast-deep-equal';
import { parseBoolean, parseNumber } from '@vcsuite/parsers';
import { check, maybe, ofEnum } from '@vcsuite/check';
import {
  GroupContentTreeItem,
  LayerContentTreeItem,
  LayerGroupContentTreeItem,
  NodeContentTreeItem,
  SubContentTreeItem,
} from '@vcmap/ui';
import type {
  ContentTreeCollection,
  ContentTreeItem,
  LayerContentTreeItemOptions,
  LayerGroupContentTreeItemOptions,
  TreeViewItem,
  VcsUiApp,
} from '@vcmap/ui';
import { computed, ComputedRef, ref, type Ref } from 'vue';
import { SplitDirection } from '@vcmap-cesium/engine';
import {
  type Layer,
  type SplitLayer,
  VcsEvent,
  VectorLayer,
} from '@vcmap/core';
import SwipeElement from './swipeElement.js';
import LayerSwipeTreeItem, {
  type LayerSwipeTreeItemOptions,
} from './swipeTree/layerSwipeTreeItem.js';
import {
  setupSwipeToolActions,
  setupSwipeToolActionsNoUI,
  swipeWindowId,
} from './actionHelper.js';
import GroupSwipeTreeItem from './swipeTree/groupSwipeTreeItem.js';
import LayerGroupSwipeTreeItem from './swipeTree/layerGroupSwipeTreeItem.js';
import {
  SplitDirectionKeys,
  type SwipeElementTitles,
  type LayerStateOptions,
  type SwipeToolConfig,
} from './index.js';
import { SwipeTreeViewItem } from './swipeTree/swipeTreeItem.js';

export type SplitableLayer = Layer & SplitLayer;

/**
 * @param {LayerStateOptions} options
 * @returns {SwipeLayerState}
 */
export function parseSwipeLayerState(
  options: LayerStateOptions,
): SwipeLayerState {
  check(options.active, Boolean);
  check(options.splitDirection, maybe(ofEnum(SplitDirectionKeys)));
  const key = options.splitDirection?.toUpperCase();

  return {
    active: options.active,
    splitDirection: key
      ? SplitDirection[key as keyof typeof SplitDirection]
      : SplitDirection.NONE,
  };
}

export type SwipeLayerState = {
  splitDirection: SplitDirection;
  active: boolean;
};

/**
 * This widget allows to swipe split views of a {@link @vcmap/core.CesiumMap} or {@link @vcmap/core.OpenlayersMap} map.
 * {@link @vcmap/core.SplitLayer}s can be split
 * using their splitDirection property. This widget provides a {@link SwipeElement} to
 * swipe the split position. Changing the splitDirection property while the widget is active is tracked. Once
 * the widget is deactivated, the layer state previous its activation is reimplemented.
 */
export class SwipeTool {
  static get className(): string {
    return 'SwipeTool';
  }

  private _app: VcsUiApp;

  private _active = false;

  private _splitPosition: number;

  private _showSwipeTree: boolean;

  private _showSwipeElement: boolean;

  private _swipeElementTitles?: SwipeElementTitles;

  private _swipeElement: SwipeElement;

  swipeLayerStates: Record<string, LayerStateOptions>;

  private _cachedState: Record<string, SwipeLayerState> = {};

  private _initialState: Record<string, SwipeLayerState> = {};

  private _subTreeIds: Ref<string[]> = ref([]);

  private _subTreeViewItems: Map<string, SwipeTreeViewItem> = new Map();

  stateChanged: VcsEvent<boolean> = new VcsEvent();

  private _listeners: Array<() => void>;

  private _destroyActions: () => void;

  /**
   * Returns the default options for this Widget
   */
  static getDefaultOptions(): SwipeToolConfig {
    return {
      showSwipeTree: true,
      showSwipeElement: true,
      splitPosition: 0.5,
      swipeElementTitles: undefined,
      swipeLayerStates: undefined,
    };
  }

  constructor(app: VcsUiApp, options: SwipeToolConfig) {
    const defaultOptions = SwipeTool.getDefaultOptions();

    this._app = app;

    this._splitPosition = parseNumber(
      options.splitPosition,
      SwipeTool.getDefaultOptions().splitPosition,
    );
    this._showSwipeTree = parseBoolean(
      options.showSwipeTree,
      defaultOptions.showSwipeTree,
    );
    this._showSwipeElement = parseBoolean(
      options.showSwipeElement,
      defaultOptions.showSwipeElement,
    );
    this._swipeElementTitles =
      options.swipeElementTitles || defaultOptions.swipeElementTitles;

    this._swipeElement = new SwipeElement(app, this._swipeElementTitles);

    this.swipeLayerStates = options.swipeLayerStates ?? {};

    if (options.swipeLayerStates) {
      Object.entries(this.swipeLayerStates).forEach(
        ([layerName, swipeLayerOptions]) => {
          this._cachedState[layerName] =
            parseSwipeLayerState(swipeLayerOptions);
        },
      );
    }
    this._listeners = [
      app.contentTree.added.addEventListener(this.handleItemAdded.bind(this)),
      app.contentTree.removed.addEventListener(this.setTreeView.bind(this)),
      app.moduleAdded.addEventListener(this.setTreeView.bind(this)),
      this._swipeElement.positionChanged.addEventListener((position) => {
        this._splitPosition = position;
      }),
    ];
    this._destroyActions = this._showSwipeTree
      ? setupSwipeToolActions(this._app, this)
      : setupSwipeToolActionsNoUI(this._app, this);
  }

  get active(): boolean {
    return this._active;
  }

  get splitPosition(): number {
    return this._splitPosition;
  }

  set splitPosition(position: number) {
    check(position, Number);
    if (position < 0 || position > 1) {
      throw new Error('Position must be between 0 and 1');
    }
    this._splitPosition = position;
    if (this._active) {
      this._app.maps.splitPosition = this._splitPosition;
    }
  }

  get showSwipeElement(): boolean {
    return this._showSwipeElement;
  }

  set showSwipeElement(value: boolean) {
    check(value, Boolean);
    this._showSwipeElement = value;
    if (value) {
      this._swipeElement.activate();
    } else {
      this._swipeElement.deactivate();
    }
  }

  get showSwipeTree(): boolean {
    return this._showSwipeTree;
  }

  set showSwipeTree(value: boolean) {
    check(value, Boolean);
    this._showSwipeTree = value;
    this._destroyActions();
    this._destroyActions = this._showSwipeTree
      ? setupSwipeToolActions(this._app, this)
      : setupSwipeToolActionsNoUI(this._app, this);
  }

  /** The title present on the swipe element. */
  get swipeElementTitles(): SwipeElementTitles | undefined {
    return this._swipeElementTitles;
  }

  set swipeElementTitles(titles: SwipeElementTitles | undefined) {
    check(titles, maybe(Object));

    this._swipeElementTitles = titles;
    if (this._swipeElement) {
      this._swipeElement.titles = this._swipeElementTitles;
    }
  }

  get swipeElement(): SwipeElement {
    return this._swipeElement;
  }

  /** Activates swipe tool by applying state */
  activate(): void {
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

  /** Deactivating swipe tool by resetting state and clearing swipe tree */
  deactivate(): void {
    if (this._active) {
      this._splitPosition = this._app.maps.splitPosition;
      this._swipeElement.deactivate();
      if (this._app.windowManager.has(swipeWindowId)) {
        this._app.windowManager.remove(swipeWindowId);
      }
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
   */
  private _handleChildren(
    mappedItem: ContentTreeItem,
    item: TreeViewItem,
    contentTree: ContentTreeCollection,
  ): SwipeTreeViewItem {
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
    return mappedItem.getTreeViewItem() as SwipeTreeViewItem;
  }

  /** Maps ContentTreeItems to SwipeTreeItems */
  private _mapTreeItems(
    item: TreeViewItem,
    contentTree: ContentTreeCollection,
  ): SwipeTreeViewItem | null {
    const i = contentTree.getByKey(item.name)!;
    let mappedItem;
    const options = i.toJSON();
    if (i instanceof LayerContentTreeItem) {
      const layer = this._app.maps.layerCollection.getByKey(
        (options as LayerContentTreeItemOptions).layerName,
      );
      if (layer instanceof VectorLayer && layer.vectorClusterGroup) {
        return null;
      }

      if (layer && (layer as SplitableLayer).splitDirection !== undefined) {
        mappedItem = new LayerSwipeTreeItem(
          options as LayerSwipeTreeItemOptions,
          this._app,
        );
      }
    } else if (i instanceof LayerGroupContentTreeItem) {
      mappedItem = new LayerGroupSwipeTreeItem(
        options as LayerGroupContentTreeItemOptions,
        this._app,
      );
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
  setTreeView(): void {
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

  /** All ids of the currently managed subtrees. Ids are not persisted and will change if
   * the trees get recalculated. */
  get subTreeIds(): Ref<string[]> {
    return this._subTreeIds;
  }

  getComputedVisibleTree(id: string): ComputedRef<SwipeTreeViewItem[]> {
    return computed(() => {
      if (this._subTreeViewItems.has(id)) {
        return [this._subTreeViewItems.get(id)].filter(
          (item): item is SwipeTreeViewItem => item !== undefined,
        );
      }
      return [];
    });
  }

  private _clearSwipeTree(): void {
    this._subTreeViewItems.clear();
    this._subTreeIds.value.splice(0);
  }

  /** Clears swipeTool by removing all items of managed layers and resetting initial state */

  clear(): void {
    this.applyState(this._initialState);
    this._cachedState = {};
    this._initialState = {};
    this._clearSwipeTree();
  }

  /**
   * Iterates over content tree collection and returns current SwipeLayerState
   * for all layers of LayerContentTreeItem and LayerGroupContentTreeItem.
   */
  getState(): Record<string, SwipeLayerState> {
    const layerStates = [...this._app.contentTree]
      .map((item) => {
        const options = item.toJSON();
        if ((options as LayerContentTreeItemOptions).layerName) {
          return [(options as LayerContentTreeItemOptions).layerName];
        } else if ((options as LayerGroupContentTreeItemOptions).layerNames) {
          return (options as LayerGroupContentTreeItemOptions).layerNames;
        }
        return [];
      })
      .flat()
      .filter(
        (layerName) =>
          (this._app.layers.getByKey(layerName) as SplitableLayer)
            ?.splitDirection !== undefined,
      )
      .map((name) => {
        const { active, splitDirection } = this._app.layers.getByKey(
          name,
        ) as SplitableLayer;
        return [name, { active, splitDirection }];
      });
    return Object.fromEntries(layerStates) as Record<string, SwipeLayerState>;
  }

  /** Sets SwipeLayerState and applies it, if active. */
  setState(state: Record<string, SwipeLayerState>): void {
    this._cachedState = state;
    this.applyState(this._cachedState);
  }

  /** Iterate over all cached SwipeLayerStates and apply state on the layer */
  applyState(state: Record<string, SwipeLayerState>): void {
    if (this._active) {
      Object.entries(state).forEach(([layerName, layerSwipeState]) => {
        this._applyStateToLayer(layerName, layerSwipeState);
      });
    }
  }

  private _applyStateToLayer(
    layerName: string,
    layerSwipeState: SwipeLayerState,
  ): void {
    const layer = this._app.maps.layerCollection.getByKey(layerName);
    if (
      layer &&
      'splitDirection' in layer &&
      layer.splitDirection !== undefined
    ) {
      layer.splitDirection = layerSwipeState.splitDirection;
      if (layer.active !== layerSwipeState.active) {
        if (layer.active) {
          layer.deactivate();
        } else {
          // eslint-disable-next-line no-void
          void layer.activate();
        }
      }
    }
  }

  /** Handles items added to the content tree */
  handleItemAdded(item: ContentTreeItem): void {
    const options = item.toJSON();
    const layerNames = [];
    if ((options as LayerContentTreeItemOptions).layerName) {
      layerNames.push((options as LayerContentTreeItemOptions).layerName);
    } else if ((options as LayerGroupContentTreeItemOptions).layerNames) {
      layerNames.push(
        ...(options as LayerGroupContentTreeItemOptions).layerNames,
      );
    }
    layerNames.forEach((layerName) => {
      const layer = this._app.layers.getByKey(layerName);
      if (layer) {
        const { active, splitDirection } = layer as SplitableLayer;
        this._initialState[layerName] = { active, splitDirection };
        if (this._cachedState[layerName]) {
          if (this._active) {
            this._applyStateToLayer(layerName, this._cachedState[layerName]);
          }
        }
      }
    });
  }

  toJSON(): SwipeToolConfig {
    const config: SwipeToolConfig = {};
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

  destroy(): void {
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
