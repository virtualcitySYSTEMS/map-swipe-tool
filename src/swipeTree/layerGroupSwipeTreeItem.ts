import { SplitDirection } from '@vcmap-cesium/engine';
import type { Layer } from '@vcmap/core';
import type { LayerGroupContentTreeItemOptions, VcsUiApp } from '@vcmap/ui';
import { getLogger } from '@vcsuite/logger';
import {
  createSplitStateRefActions,
  getSplitStateFromLayer,
  SplitActionState,
  toggle,
  type SplitActionStateObject,
} from './layerSwipeTreeItem.js';
import SwipeTreeItem from './swipeTreeItem.js';
import type { SplitableLayer } from '../swipeTool.js';
import { name } from '../../package.json';

function getGroupStateForSide(
  states: SplitActionStateObject[],
  side: 'left' | 'right',
): SplitActionState {
  if (states.every((s) => s[side] === SplitActionState.ACTIVE)) {
    return SplitActionState.ACTIVE;
  }
  if (states.every((s) => s[side] === SplitActionState.INACTIVE)) {
    return SplitActionState.INACTIVE;
  }
  return SplitActionState.INDETERMINATE;
}

export function getGroupStates(
  states: SplitActionStateObject[],
): SplitActionStateObject {
  return {
    left: getGroupStateForSide(states, 'left'),
    right: getGroupStateForSide(states, 'right'),
  };
}

export function getSplitStateFromLayers(
  layers: SplitableLayer[],
): SplitActionStateObject {
  return getGroupStates(layers.map((l) => getSplitStateFromLayer(l)));
}

/**
 * A group item which has _no click handler_
 * @class
 * @extends {import("@vcmap/ui").ContentTreeItem}
 */
class LayerGroupSwipeTreeItem extends SwipeTreeItem {
  static get className(): string {
    return 'LayerGroupSwipeTreeItem';
  }

  private _layerNames: string[];

  private _listeners: Array<() => void> = [];

  private _destroyWatcher: (() => void) | undefined;

  constructor(options: LayerGroupContentTreeItemOptions, app: VcsUiApp) {
    super(options, app);

    this._layerNames = Array.isArray(options.layerNames)
      ? options.layerNames.slice()
      : [];

    this._setup();
  }

  private get _layers(): Array<SplitableLayer> {
    return this._layerNames
      .map((n) => this._app.layers.getByKey(n))
      .filter((l) => !!l)
      .filter((l) => 'splitDirection' in l && l.splitDirection !== undefined)
      .map((l) => l as SplitableLayer);
  }

  private _setSwipeActions(): void {
    this.removeAction('split-right');
    this.removeAction('split-left');

    const cb = (dir: SplitDirection): void => {
      this._layers
        .filter((layer) => {
          const splitState = getSplitStateFromLayer(layer);
          if (dir === SplitDirection.LEFT) {
            const active = this.splitState.left === SplitActionState.ACTIVE;
            return active
              ? splitState.left === SplitActionState.ACTIVE
              : splitState.left !== SplitActionState.ACTIVE;
          } else if (dir === SplitDirection.RIGHT) {
            const active = this.splitState.right === SplitActionState.ACTIVE;
            return active
              ? splitState.right === SplitActionState.ACTIVE
              : splitState.right !== SplitActionState.ACTIVE;
          }
          return false;
        })
        .forEach((layer) => {
          toggle(this._app.maps.layerCollection, layer, dir).catch((e) => {
            getLogger(name).error(
              'Error while applying Split Direction to layer',
              layer.name,
              e,
            );
          });
        });
    };
    const { actions, destroy } = createSplitStateRefActions(
      this.splitState,
      cb,
    );
    actions.forEach((a) => this.addAction(a));

    this._destroyWatcher = destroy;
  }

  private _setup(): void {
    this._clearListeners();
    /** Called when a layer is added or removed to reset the item if needed */
    const resetHandler = (layer: Layer): void => {
      if (this._layerNames.includes(layer.name)) {
        this._setup();
      }
    };
    const layers = this._layers;

    this.visible = layers.some((l) => l.isSupported(this._app.maps.activeMap!));
    this._setSwipeActions();

    this._listeners.push(
      this._app.layers.removed.addEventListener(resetHandler),
    );
    this._listeners.push(this._app.layers.added.addEventListener(resetHandler));

    this._listeners.push(
      this._app.maps.mapActivated.addEventListener(() => {
        this.visible = !!layers.find((l) =>
          l.isSupported(this._app.maps.activeMap!),
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

  private _clearListeners(): void {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
  }

  toJSON(): LayerGroupContentTreeItemOptions {
    const contentTreeConfig = super.toJSON();
    const config = {
      ...contentTreeConfig,
      layerNames: this._layerNames.slice(),
    };
    return config;
  }

  destroy(): void {
    this._clearListeners();
    this._destroyWatcher?.();
    super.destroy();
  }
}

export default LayerGroupSwipeTreeItem;
