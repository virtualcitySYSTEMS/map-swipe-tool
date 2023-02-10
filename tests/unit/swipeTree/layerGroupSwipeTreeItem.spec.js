import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest';
import { ObliqueMap, OpenlayersMap, VectorLayer } from '@vcmap/core';
import { VcsUiApp } from '@vcmap/ui';
import { SplitDirection } from '@vcmap-cesium/engine';
import LayerGroupSwipeTreeItem from '../../../src/swipeTree/layerGroupSwipeTreeItem.js';
import { SplitActionState } from '../../../src/swipeTree/layerSwipeTreeItem.js';

describe('LayerGroupContentTreeItem', () => {
  describe('if no layers are present', () => {
    it('should not be visible', () => {
      const app = new VcsUiApp();
      const item = new LayerGroupSwipeTreeItem({ name: 'foo', layerNames: ['foo'] }, app);
      expect(item.visible).to.be.false;
      app.destroy();
      item.destroy();
    });
  });

  describe('if layers are present', () => {
    let app;
    let item;
    let layers;

    beforeEach(async () => {
      app = new VcsUiApp();
      app.maps.add(new OpenlayersMap({ name: 'ol' }));
      app.maps.add(new ObliqueMap({ name: 'obl' }));
      await app.maps.setActiveMap('ol');
      layers = [
        { mapNames: ['ol'] },
        { mapNames: ['ol'] },
        { mapNames: ['bar'] },
      ].map(config => new VectorLayer(config));

      layers.forEach((l) => {
        app.layers.add(l);
      });
      item = new LayerGroupSwipeTreeItem({
        name: 'foo', layerNames: layers.map(l => l.name),
      }, app);
    });

    afterEach(() => {
      item.destroy();
      app.destroy();
    });

    describe('visibility', () => {
      it('should be visible if a single layer is supported', () => {
        expect(item.visible).to.be.true;
      });

      it('should not be visible, if all layers are not supported', async () => {
        await app.maps.setActiveMap('obl');
        expect(item.visible).to.be.false;
      });

      it('should not be visible if removing all supported layers', () => {
        app.layers.remove(layers[0]);
        app.layers.remove(layers[1]);
        expect(item.visible).to.be.false;
      });
    });

    describe('split state', () => {
      it('should have a split state of left/right ACTIVE, if all layers are active and have SplitDirection none', async () => {
        await Promise.all(layers.map((l) => {
          l.splitDirection = SplitDirection.NONE;
          return l.activate();
        }));
        expect(item.splitState.left.value).to.equal(SplitActionState.ACTIVE);
        expect(item.splitState.right.value).to.equal(SplitActionState.ACTIVE);
      });

      it('should have a split state of left ACTIVE and right INACTIVE, if all layers are active and have SplitDirection left', async () => {
        await Promise.all(layers.map((l) => {
          l.splitDirection = SplitDirection.LEFT;
          return l.activate();
        }));
        expect(item.splitState.left.value).to.equal(SplitActionState.ACTIVE);
        expect(item.splitState.right.value).to.equal(SplitActionState.INACTIVE);
      });

      it('should have a split state of left INACTIVE and right ACTIVE, if all layers are active and have SplitDirection right', async () => {
        await Promise.all(layers.map((l) => {
          l.splitDirection = SplitDirection.RIGHT;
          return l.activate();
        }));
        expect(item.splitState.left.value).to.equal(SplitActionState.INACTIVE);
        expect(item.splitState.right.value).to.equal(SplitActionState.ACTIVE);
      });

      it('should have a split state of left/ right INACTIVE, if all layers are inactive', async () => {
        await Promise.all(layers.map((l) => {
          l.splitDirection = SplitDirection.NONE;
          return l.deactivate();
        }));
        expect(item.splitState.left.value).to.equal(SplitActionState.INACTIVE);
        expect(item.splitState.right.value).to.equal(SplitActionState.INACTIVE);
      });
    });
  });

  describe('serialization', () => {
    let app;
    let inputConfig;
    let outputConfig;

    beforeAll(() => {
      app = new VcsUiApp();
      inputConfig = {
        name: 'foo',
        layerNames: ['foo'],
      };

      const item = new LayerGroupSwipeTreeItem(inputConfig, app);
      outputConfig = item.toJSON();
      item.destroy();
    });

    afterAll(() => {
      app.destroy();
    });

    it('should only configure type, name and layerNames', () => {
      expect(outputConfig).to.have.all.keys(['name', 'type', 'layerNames']);
    });

    it('should configure layerNames', () => {
      expect(outputConfig).to.have.property('layerNames').and.to.eql(inputConfig.layerNames);
      expect(outputConfig).to.have.property('layerNames').and.to.not.equal(inputConfig.layerNames);
    });
  });
});
