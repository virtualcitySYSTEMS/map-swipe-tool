import { watch } from 'vue';
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
  /**
   * @returns {string}
   */
  static get className() {
    return 'GroupSwipeTreeItem';
  }

  /**
   * @param {import("@vcmap/ui").ContentTreeItemOptions} options
   * @param {import("@vcmap/ui").VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {Array<Function>}
     * @private
     */
    this._listeners = [];

    /**
     * @type {function():void}
     * @private
     */
    this._childWatcher = watch(
      this._children,
      () => {
        const children = this._children.value;
        this.visible = children.some((c) => c.visible);
        const states = children.map((c) => ({
          left: c.splitState?.left?.value,
          right: c.splitState?.right?.value,
        }));
        this.splitState = getGroupStates(states);
      },
      { deep: true },
    );

    this._setup();
  }

  /**
   * @private
   */
  _setSwipeActions() {
    this.removeAction('split-right');
    this.removeAction('split-left');

    const cb = (dir) => {
      this._children.value.forEach(({ actions }) => {
        if (dir === SplitDirection.LEFT) {
          const active = this.splitState.left.value === SplitActionState.ACTIVE;
          actions
            .filter((a) => a.name === 'split-left' && a.active === active)
            .forEach((a) => a.callback());
        } else if (dir === SplitDirection.RIGHT) {
          const active =
            this.splitState.right.value === SplitActionState.ACTIVE;
          actions
            .filter((a) => a.name === 'split-right' && a.active === active)
            .forEach((a) => a.callback());
        }
      });
    };

    const actions = createSplitStateRefActions(this._splitState, cb);
    actions.forEach((a) => this.addAction(a));
  }

  /**
   * @private
   */
  _setup() {
    this._setSwipeActions();
    this.splitState = getGroupStates(
      this._children.value.map((c) => c.splitState),
    );
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
   * @inheritDoc
   */
  destroy() {
    this._clearListeners();
    super.destroy();
  }
}

export default GroupSwipeTreeItem;
