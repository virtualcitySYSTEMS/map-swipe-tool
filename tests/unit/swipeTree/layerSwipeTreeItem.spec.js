import { ObliqueMap, OpenlayersMap, VectorLayer } from '@vcmap/core';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { VcsUiApp } from '@vcmap/ui';
import { SplitDirection } from '@vcmap-cesium/engine';
import LayerSwipeTreeItem, {
  SplitActionState,
} from '../../../src/swipeTree/layerSwipeTreeItem.js';

describe('LayerContentTreeItem', () => {
  describe('if there is a layer', () => {
    let layer;
    let item;
    /** @type {VcsUiApp} */
    let app;

    beforeAll(async () => {
      app = new VcsUiApp();
      app.maps.add(new OpenlayersMap({ name: 'ol' }));
      app.maps.add(new ObliqueMap({ name: 'obl' }));
      await app.maps.setActiveMap('ol');
      layer = new VectorLayer({ mapNames: ['ol'] });
      app.layers.add(layer);
      item = new LayerSwipeTreeItem(
        {
          name: 'foo',
          layerName: layer.name,
        },
        app,
      );
    });

    afterAll(() => {
      app.destroy();
      item.destroy();
      layer.destroy();
    });

    describe('handling map activation', () => {
      afterAll(async () => {
        await app.maps.setActiveMap('ol');
      });

      it('should not be visible if activating an unsuported map', async () => {
        await app.maps.setActiveMap('obl');
        expect(item.visible).to.be.false;
      });

      it('should be visible if the active map is supported', async () => {
        await app.maps.setActiveMap('ol');
        expect(item.visible).to.be.true;
      });
    });

    describe('handle removing of the layer', () => {
      beforeAll(() => {
        app.layers.remove(layer);
      });

      afterAll(() => {
        app.layers.add(layer);
      });

      it('should no longer be visible', () => {
        expect(item.visible).to.be.false;
      });

      it('should no longer listen to state changes', async () => {
        layer.splitDirection = SplitDirection.LEFT;
        await layer.activate();
        expect(item.splitState.left.value).to.equal(SplitActionState.INACTIVE);
        expect(item.splitState.right.value).to.equal(SplitActionState.INACTIVE);
        layer.deactivate();
      });
    });

    describe('split state', () => {
      it('should have a split state of left/right ACTIVE, if all layer is active and has SplitDirection none', async () => {
        layer.splitDirection = SplitDirection.NONE;
        await layer.activate();
        expect(item.splitState.left.value).to.equal(SplitActionState.ACTIVE);
        expect(item.splitState.right.value).to.equal(SplitActionState.ACTIVE);
        layer.deactivate();
      });

      it('should have a split state of left ACTIVE and right INACTIVE, if layer is active and has SplitDirection left', async () => {
        layer.splitDirection = SplitDirection.LEFT;
        await layer.activate();
        expect(item.splitState.left.value).to.equal(SplitActionState.ACTIVE);
        expect(item.splitState.right.value).to.equal(SplitActionState.INACTIVE);
        layer.deactivate();
      });

      it('should have a split state of left INACTIVE and right ACTIVE, if layer is active and has SplitDirection right', async () => {
        layer.splitDirection = SplitDirection.RIGHT;
        await layer.activate();
        expect(item.splitState.left.value).to.equal(SplitActionState.INACTIVE);
        expect(item.splitState.right.value).to.equal(SplitActionState.ACTIVE);
        layer.deactivate();
      });

      it('should have a split state of left/ right INACTIVE, if layer is inactive', async () => {
        layer.deactivate();
        expect(item.splitState.left.value).to.equal(SplitActionState.INACTIVE);
        expect(item.splitState.right.value).to.equal(SplitActionState.INACTIVE);
      });
    });
  });

  describe('if layer is not present', () => {
    it('should not be visible', () => {
      const app = new VcsUiApp();
      const item = new LayerSwipeTreeItem(
        { name: 'foo', layerName: 'foo' },
        app,
      );
      expect(item.visible).to.be.false;
      item.destroy();
      app.destroy();
    });
  });

  describe('serialize', () => {
    it('should serialize name, type and layerName', () => {
      const app = new VcsUiApp();
      const item = new LayerSwipeTreeItem(
        { name: 'foo', layerName: 'foo' },
        app,
      );
      const config = item.toJSON();
      expect(config).to.have.all.keys(['name', 'type', 'layerName']);
      item.destroy();
      app.destroy();
    });
  });
});
