import {
  describe, it, expect, beforeAll, afterAll, vi,
} from 'vitest';
import { LayerContentTreeItem, VcsUiApp } from '@vcmap/ui';
import { SplitDirection } from '@vcmap-cesium/engine';
import { OpenlayersMap, VectorLayer } from '@vcmap/core';
import { sleep } from '../helpers.js';
import SwipeTool, { parseSwipeLayerState } from '../../src/swipeTool.js';

async function setupMap() {
  const app = new VcsUiApp();
  const map = new OpenlayersMap({});
  app.maps.add(map);
  await app.maps.setActiveMap(map.name);
  const target = document.createElement('div');
  document.body.append(target);
  app.maps.setTarget(target);

  return app;
}

const options = {
  showSwipeTree: true,
  showSwipeElement: true,
  splitPosition: 0.1,
  swipeLayerStates: {
    sampleLayer: {
      active: true,
      splitDirection: 'left',
    },
  },
  swipeElementTitles: {
    left: 'Left title',
    right: 'Right title',
  },
};

describe('SwipeTool', () => {
  describe('parsing swipe layer state', () => {
    it('should return SwipeLayerState', () => {
      const { sampleLayer } = options.swipeLayerStates;
      const swipeLayerState = parseSwipeLayerState(sampleLayer);
      expect(swipeLayerState).to.have.property('active', sampleLayer.active);
      expect(swipeLayerState).to.have.property('splitDirection', SplitDirection.LEFT);
    });
  });

  describe('parsing options', () => {
    let app;
    let swipeTool;

    beforeAll(() => {
      app = new VcsUiApp();
      swipeTool = new SwipeTool(app, options);
    });

    afterAll(() => {
      swipeTool.destroy();
      app.destroy();
    });

    it('should set shopSwipeTree', () => {
      expect(swipeTool).to.have.property('showSwipeTree', options.showSwipeTree);
    });
    it('should set showSwipeElement', () => {
      expect(swipeTool).to.have.property('showSwipeElement', options.showSwipeElement);
    });
    it('should set splitPosition', () => {
      expect(swipeTool).to.have.property('splitPosition', options.splitPosition);
    });
    it('should set swipeElementTitles', () => {
      expect(swipeTool).to.have.property('swipeElementTitles', options.swipeElementTitles);
    });
  });

  describe('swipe state', () => {
    let app;
    let layer;
    let item;
    let swipeTool;

    beforeAll(async () => {
      app = await setupMap();
      layer = new VectorLayer({ name: 'sampleLayer' });
      item = new LayerContentTreeItem({ name: 'foo', layerName: layer.name }, app);
      app.layers.add(layer);
      app.contentTree.add(item);
      swipeTool = new SwipeTool(app, options);
    });

    afterAll(() => {
      swipeTool.destroy();
      item.destroy();
      layer.destroy();
      app.destroy();
    });

    describe('getting state', () => {
      it('should return the current swipe layer state of all content tree layers', () => {
        const state = swipeTool.getState();
        expect(state).to.have.property('sampleLayer');
        expect(state.sampleLayer).to.have.property('active', layer.active);
        expect(state.sampleLayer).to.have.property('splitDirection', layer.splitDirection);
      });
    });

    describe('setting and applying state', () => {
      it('should NOT apply the provided state, if the tool is deactive', async () => {
        const state = {
          sampleLayer: { active: true, splitDirection: SplitDirection.LEFT },
        };
        swipeTool.setState(state);
        await sleep(10);
        expect(layer).to.have.property('active', false);
        expect(layer).to.have.property('splitDirection', SplitDirection.NONE);
        swipeTool.clear();
      });

      it('should apply the provided state, if the tool is active', async () => {
        const state = {
          sampleLayer: { active: true, splitDirection: SplitDirection.LEFT },
        };
        swipeTool.activate();
        swipeTool.setState(state);
        await sleep(10);
        expect(layer).to.have.property('active', state.sampleLayer.active);
        expect(layer).to.have.property('splitDirection', state.sampleLayer.splitDirection);
        swipeTool.clear();
      });
    });
  });

  describe('activating swipe tool', () => {
    let app;
    let layer;
    let swipeTool;
    let setTreeViewSpy;

    beforeAll(async () => {
      app = await setupMap();
      layer = new VectorLayer({ name: 'sampleLayer' });
      app.layers.add(layer);
      swipeTool = new SwipeTool(app, options);
      setTreeViewSpy = vi.spyOn(swipeTool, 'setTreeView');
      swipeTool.activate();
    });

    afterAll(() => {
      swipeTool.destroy();
      layer.destroy();
      app.destroy();
    });

    it('should update the maps splitPosition', () => {
      expect(app.maps.splitPosition).to.eq(swipeTool.splitPosition);
    });
    it('should activate the swipe element', () => {
      expect(swipeTool.swipeElement).to.have.property('active', true);
    });
    it('should set the tree view', () => {
      expect(setTreeViewSpy).toHaveBeenCalledTimes(1);
    });
    it('should set the swipe tool state', () => {
      expect(swipeTool).to.have.property('active', true);
    });
  });

  describe('deactivating swipe tool', () => {
    let app;
    let layer;
    let swipeTool;
    let setStateSpy;

    beforeAll(async () => {
      app = await setupMap();
      layer = new VectorLayer({ name: 'sampleLayer' });
      app.layers.add(layer);
      swipeTool = new SwipeTool(app, options);
      setStateSpy = vi.spyOn(swipeTool, 'setState');
      swipeTool.activate();
      swipeTool.deactivate();
    });

    afterAll(() => {
      swipeTool.destroy();
      layer.destroy();
      app.destroy();
    });

    it('should update the splitPosition', () => {
      expect(swipeTool.splitPosition).to.eq(app.maps.splitPosition);
    });
    it('should deactivate the swipe element', () => {
      expect(swipeTool.swipeElement).to.have.property('active', false);
    });
    it('should set the swipe state to the initial state', () => {
      expect(setStateSpy).toHaveBeenCalledTimes(1);
    });
    it('should set the swipe tool state', () => {
      expect(swipeTool).to.have.property('active', false);
    });
  });

  describe('serialize', () => {
    it('should serialize options', () => {
      const app = new VcsUiApp();
      const swipeTool = new SwipeTool(app, options);
      const config = swipeTool.toJSON();
      expect(config).to.have.property('splitPosition', options.splitPosition);
      expect(config).to.have.property('swipeElementTitles', options.swipeElementTitles);
      swipeTool.destroy();
      app.destroy();
    });
  });
});
