import { watch } from 'vue';
import {
  callSafeAction,
  type ContentTreeItemOptions,
  type VcsUiApp,
} from '@vcmap/ui';
import { SplitDirection } from '@vcmap-cesium/engine';
import {
  createSplitStateRefActions,
  SplitActionState,
} from './layerSwipeTreeItem.js';
import { getGroupStates } from './layerGroupSwipeTreeItem.js';
import SwipeTreeItem from './swipeTreeItem.js';

/**
 * A group item which has _no click handler_
 * @class
 * @extends {import("@vcmap/ui").ContentTreeItem}
 */
class GroupSwipeTreeItem extends SwipeTreeItem {
  static get className(): string {
    return 'GroupSwipeTreeItem';
  }

  private _listeners: Array<() => void> = [];

  private _childWatcher: () => void;

  private _destroyWatcher: (() => void) | undefined;

  constructor(options: ContentTreeItemOptions, app: VcsUiApp) {
    super(options, app);

    this._childWatcher = watch(
      this._children,
      () => {
        const children = this._children.value;
        this.visible = children.some((c) => c.visible);
        const states = children.map(({ splitState }) => splitState);
        this.splitState = getGroupStates(states);
      },
      { deep: true },
    );

    this._setup();
  }

  private _setSwipeActions(): void {
    this.removeAction('split-right');
    this.removeAction('split-left');

    const cb = (dir: SplitDirection): void => {
      this._children.value.forEach(({ actions }) => {
        if (dir === SplitDirection.LEFT) {
          const active = this.splitState.left === SplitActionState.ACTIVE;
          actions
            .filter((a) => a.name === 'split-left' && a.active === active)
            .forEach((a) => {
              callSafeAction(a);
            });
        } else if (dir === SplitDirection.RIGHT) {
          const active = this.splitState.right === SplitActionState.ACTIVE;
          actions
            .filter((a) => a.name === 'split-right' && a.active === active)
            .forEach((a) => {
              callSafeAction(a);
            });
        }
      });
    };

    const { actions, destroy } = createSplitStateRefActions(
      this.splitState,
      cb,
    );
    actions.forEach((a) => {
      this.addAction(a);
    });
    this._destroyWatcher = destroy;
  }

  private _setup(): void {
    this._setSwipeActions();
    this.splitState = getGroupStates(
      this._children.value.map(({ splitState }) => splitState),
    );
  }

  private _clearListeners(): void {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
  }

  destroy(): void {
    this._clearListeners();
    super.destroy();
    this._destroyWatcher?.();
    this._childWatcher?.();
  }
}

export default GroupSwipeTreeItem;
