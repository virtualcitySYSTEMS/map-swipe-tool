import { reactive, watch } from 'vue';
import { VcsObjectContentTreeItem } from '@vcmap/ui';
import type {
  ContentTreeItemOptions,
  LayerContentTreeItemOptions,
  LayerContentTreeItemProperties,
  VcsAction,
  VcsUiApp,
} from '@vcmap/ui';
import { check, ofEnum } from '@vcsuite/check';
import { SplitDirection } from '@vcmap-cesium/engine';
import type { Layer, LayerCollection } from '@vcmap/core';
import type { SplitableLayer } from '../swipeTool.js';
import { SwipeTreeViewItem } from './swipeTreeItem.js';

export enum SplitActionState {
  /** hidden on this side */
  INACTIVE = 0,
  /** visible on this side */
  ACTIVE = 1,
  /** either hidden or visible */
  INDETERMINATE = 2,
}

/** Mapping to icons. */
const stateIconMap: Record<SplitActionState, string> = {
  [SplitActionState.INACTIVE]: '$vcsCheckbox',
  [SplitActionState.ACTIVE]: '$vcsCheckboxChecked',
  [SplitActionState.INDETERMINATE]: '$vcsCheckboxIndeterminate',
};

/** Mapping to i18n titles. Requires appending either 'Left' or 'Right' to match an available i18n string. */
const stateI18nMap: Record<SplitActionState, string> = {
  [SplitActionState.INACTIVE]: 'swipeTool.stateActionTitles.inactive',
  [SplitActionState.ACTIVE]: 'swipeTool.stateActionTitles.active',
  [SplitActionState.INDETERMINATE]: 'swipeTool.stateActionTitles.indeterminate',
};

export type SplitActionStateObject = {
  left: SplitActionState;
  right: SplitActionState;
};

/** Creates an action */
export function createSplitStateRefActions(
  splitStateObj: SplitActionStateObject,
  callback: (direction: SplitDirection) => void | Promise<void>,
): { actions: VcsAction[]; destroy: () => void } {
  check(splitStateObj.left, ofEnum(SplitActionState));
  check(splitStateObj.right, ofEnum(SplitActionState));
  check(callback, Function);

  const splitLeftAction = reactive({
    name: 'split-left',
    active: !!splitStateObj.left,
    icon: stateIconMap[splitStateObj.left],
    title: `${stateI18nMap[splitStateObj.left]}Left`,
    callback: () => callback(SplitDirection.LEFT),
  });

  const destroyWatcherLeft = watch(
    () => splitStateObj.left,
    (newValue) => {
      splitLeftAction.active = !!newValue;
      splitLeftAction.icon = stateIconMap[newValue];
      splitLeftAction.title = `${stateI18nMap[splitStateObj.left]}Left`;
    },
  );

  const splitRightAction = reactive({
    name: 'split-right',
    active: !!splitStateObj.right,
    icon: stateIconMap[splitStateObj.right],
    title: `${stateI18nMap[splitStateObj.right]}Right`,
    callback: () => callback(SplitDirection.RIGHT),
  });

  const destroyWatcherRight = watch(
    () => splitStateObj.right,
    (newValue) => {
      splitRightAction.active = !!newValue;
      splitRightAction.icon = stateIconMap[newValue];
      splitRightAction.title = `${stateI18nMap[splitStateObj.right]}Right`;
    },
  );

  return {
    actions: [splitRightAction, splitLeftAction],
    destroy: (): void => {
      destroyWatcherLeft();
      destroyWatcherRight();
    },
  };
}

/** Applies splitDirection on a layer */
export function toggle(
  layerCollection: LayerCollection,
  layer: SplitableLayer,
  direction: SplitDirection,
): Promise<void> {
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
        layerCollection.exclusiveManager.getActiveLayersForGroup(
          group.toString(),
        ),
      )
      .flat()
      .filter((l) => 'splitDirection' in l);

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

export function getSplitStateFromLayer(
  layer: SplitableLayer,
): SplitActionStateObject {
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

export type LayerSwipeTreeItemOptions = ContentTreeItemOptions & {
  layerName: string;
};

/** A swipe item. Splits left, right or none. */
class LayerSwipeTreeItem extends VcsObjectContentTreeItem<LayerContentTreeItemProperties> {
  static get className(): string {
    return 'LayerSwipeTreeItem';
  }

  _app: VcsUiApp;

  private _splitState = reactive<SplitActionStateObject>({
    left: SplitActionState.ACTIVE,
    right: SplitActionState.ACTIVE,
  });

  private _layerName: string;

  private _listeners: Array<() => void> = [];

  private _destroyWatcher: (() => void) | undefined;

  constructor(options: LayerSwipeTreeItemOptions, app: VcsUiApp) {
    super(options, app);

    this._app = app;

    this._layerName = options.layerName;

    this._setup();
  }

  get splitState(): SplitActionStateObject {
    return this._splitState;
  }

  set splitState(state: SplitActionStateObject) {
    check(state.left, ofEnum(SplitActionState));
    check(state.right, ofEnum(SplitActionState));

    if (this._splitState.left !== state.left) {
      this._splitState.left = state.left;
    }
    if (this._splitState.right !== state.right) {
      this._splitState.right = state.right;
    }
  }

  get layer(): SplitableLayer {
    return this._app.layers.getByKey(this._layerName) as SplitableLayer;
  }

  private _setSwipeActions(): void {
    this.removeAction('split-right');
    this.removeAction('split-left');

    const cb = toggle.bind(this, this._app.maps.layerCollection, this.layer);
    const { actions, destroy } = createSplitStateRefActions(
      this.splitState,
      cb,
    );
    actions.forEach((a) => this.addAction(a));
    this._destroyWatcher = destroy;
  }

  private _clearListeners(): void {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
  }

  private _setup(): void {
    this._clearListeners();
    this._setSwipeActions();
    /** Called when a layer is added or removed to reset the item if needed */
    const resetHandler = (layer: Layer): void => {
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
      this.visible = this.layer.isSupported(this._app.maps.activeMap!);
      this.setPropertiesFromObject(this.layer);

      this._listeners.push(
        this._app.layers.removed.addEventListener(resetHandler),
      );
      this._listeners.push(
        this._app.layers.added.addEventListener(resetHandler),
      );

      this._listeners.push(
        this._app.maps.mapActivated.addEventListener(() => {
          this.visible = this.layer.isSupported(this._app.maps.activeMap!);
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

  getTreeViewItem(): SwipeTreeViewItem {
    const item = super.getTreeViewItem() as SwipeTreeViewItem;
    item.splitState = this._splitState;
    return item;
  }

  toJSON(): LayerContentTreeItemOptions {
    const contentTreeConfig = super.toJSON();
    const config = { ...contentTreeConfig, layerName: this._layerName };
    return config;
  }

  destroy(): void {
    super.destroy();
    this._destroyWatcher?.();
    this._clearListeners();
  }
}

export default LayerSwipeTreeItem;
