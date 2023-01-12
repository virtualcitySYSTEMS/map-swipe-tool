import { ContentTreeItem } from '@vcmap/ui';
import { ref } from 'vue';
import { check } from '@vcsuite/check';
import { SplitActionState } from './layerSwipeTreeItem.js';

/**
 * A swipe item. Splits left, right or none.
 * @class
 * @extends {import("@vcmap/ui").LayerContentTreeItem}
 */
class SwipeTreeItem extends ContentTreeItem {
  /**
   * @returns {string}
   */
  static get className() {
    return 'SwipeTreeItem';
  }

  /**
   * @param {import("@vcmap/ui").ContentTreeItemOptions} options
   * @param {import("@vcmap/ui").VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {SplitActionStateObject}
     * @protected
     */
    this._splitState = {
      left: ref(SplitActionState.ACTIVE),
      right: ref(SplitActionState.ACTIVE),
    };
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
   * @inheritDoc
   * @returns {import("@vcmap/ui").TreeViewItem}
   */
  getTreeViewItem() {
    const treeViewItem = super.getTreeViewItem();
    Object.assign(treeViewItem, { splitState: this._splitState });
    return treeViewItem;
  }
}

export default SwipeTreeItem;
