import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { VcsUiApp } from '@vcmap/ui';
import GroupSwipeTreeItem from '../../../src/swipeTree/groupSwipeTreeItem.js';
import SwipeTreeItem from '../../../src/swipeTree/swipeTreeItem.js';
import { sleep } from '../../helpers.js';
import SwipeTool from '../../../src/swipeTool.js';
import { SplitActionState } from '../../../src/swipeTree/layerSwipeTreeItem.js';

describe('GroupSwipeTreeItem', () => {
  let app;
  let swipeTool;
  function setupGroupItem() {
    const item = new GroupSwipeTreeItem({ name: 'foo' }, app);
    const childrenArray = item.getTreeViewItem().children;
    const children = [
      new SwipeTreeItem({ name: 'foo.bar' }, app),
      new SwipeTreeItem({ name: 'foo.bar' }, app),
      new SwipeTreeItem({ name: 'foo.bar' }, app),
    ];

    childrenArray.push(...children.map((c) => c.getTreeViewItem()));

    return { item, children };
  }

  beforeAll(() => {
    app = new VcsUiApp();
    swipeTool = new SwipeTool(app, {});
  });

  afterAll(() => {
    swipeTool.destroy();
    app.destroy();
  });

  describe('visibility', () => {
    let item;
    let children;

    beforeAll(() => {
      ({ item, children } = setupGroupItem());
      children.forEach((c) => {
        c.visible = false;
      });
    });

    afterAll(() => {
      item.destroy();
      children.forEach((c) => {
        c.destroy();
      });
    });

    it('should be visible, if a single child is visible', async () => {
      children[0].visible = true;
      await sleep();
      expect(item.visible).to.be.true;
    });

    it('should be invisible, if all children are not visible', async () => {
      children.forEach((c) => {
        c.visible = false;
      });
      await sleep();
      expect(item.visible).to.be.false;
    });
  });

  describe('split state', () => {
    let item;
    let children;

    beforeAll(() => {
      ({ item, children } = setupGroupItem());
      children.forEach((c) => {
        c.splitState = {
          left: SplitActionState.ACTIVE,
          right: SplitActionState.ACTIVE,
        };
      });
    });

    afterAll(() => {
      item.destroy();
      children.forEach((c) => {
        c.destroy();
      });
    });

    it('should have a split state of left/ right ACTIVE, if all items have a state of left/right ACTIVE', async () => {
      const splitState = {
        left: SplitActionState.ACTIVE,
        right: SplitActionState.ACTIVE,
      };
      children.forEach((c) => {
        c.splitState = splitState;
      });
      await sleep();
      expect(item.splitState.left.value).to.equal(SplitActionState.ACTIVE);
      expect(item.splitState.right.value).to.equal(SplitActionState.ACTIVE);
    });

    it('should have a split state of left/right INACTIVE, if all items have a state of left/right INACTIVE', async () => {
      const splitState = {
        left: SplitActionState.INACTIVE,
        right: SplitActionState.INACTIVE,
      };
      children.forEach((c) => {
        c.splitState = splitState;
      });
      await sleep();
      expect(item.splitState.left.value).to.equal(SplitActionState.INACTIVE);
      expect(item.splitState.right.value).to.equal(SplitActionState.INACTIVE);
    });

    it('should have a split state of INDETERMINATE, if items left/right have differing states', async () => {
      const splitState = {
        left: SplitActionState.ACTIVE,
        right: SplitActionState.ACTIVE,
      };
      children.forEach((c) => {
        c.splitState = splitState;
      });
      children[0].splitState = {
        left: SplitActionState.INACTIVE,
        right: SplitActionState.INACTIVE,
      };
      children[1].splitState = {
        left: SplitActionState.INACTIVE,
        right: SplitActionState.INACTIVE,
      };
      await sleep();
      expect(item.splitState.left.value).to.equal(
        SplitActionState.INDETERMINATE,
      );
      expect(item.splitState.right.value).to.equal(
        SplitActionState.INDETERMINATE,
      );
    });
  });
});
