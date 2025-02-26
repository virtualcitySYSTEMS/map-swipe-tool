import type { TreeViewItem } from '@vcmap/ui';
import { ContentTreeItem } from '@vcmap/ui';
import { reactive, type Ref } from 'vue';
import { check, ofEnum } from '@vcsuite/check';
import {
  SplitActionState,
  type SplitActionStateObject,
} from './layerSwipeTreeItem.js';

export type SwipeTreeViewItem = Omit<TreeViewItem, 'children'> & {
  children: SwipeTreeViewItem[];
  splitState: SplitActionStateObject;
};

/**
 * A swipe item. Splits left, right or none.
 * @class
 * @extends {import("@vcmap/ui").LayerContentTreeItem}
 */
class SwipeTreeItem extends ContentTreeItem {
  static get className(): string {
    return 'SwipeTreeItem';
  }

  declare protected _children: Ref<SwipeTreeViewItem[]>;

  private _splitState = reactive<SplitActionStateObject>({
    left: SplitActionState.ACTIVE,
    right: SplitActionState.ACTIVE,
  });

  get children(): Ref<SwipeTreeViewItem[]> {
    return this._children;
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

  getTreeViewItem(): SwipeTreeViewItem {
    const item = super.getTreeViewItem() as SwipeTreeViewItem;
    item.splitState = this._splitState;
    return item;
  }
}

export default SwipeTreeItem;
