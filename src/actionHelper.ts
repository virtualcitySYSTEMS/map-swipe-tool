import { ToolboxType, WindowSlot } from '@vcmap/ui';
import { CesiumMap, OpenlayersMap } from '@vcmap/core';
import { reactive } from 'vue';
import type { VcsAction, VcsUiApp } from '@vcmap/ui';
import SwipeToolComponent from './SwipeToolComponent.vue';
import type SwipeElement from './swipeElement.js';
import type SwipeTool from './swipeTool.js';
import { name as pluginName } from '../package.json';

export const swipeWindowId = 'swipe-tool-window';

function createSwipeElementAction(swipeElement: SwipeElement): {
  action: VcsAction;
  destroy: () => void;
} {
  const action = reactive({
    name: 'hide-swipe-action',
    title: 'swipeTool.hideController',
    icon: '$vcsEye',
    active: false,
    callback() {
      if (swipeElement.active) {
        swipeElement.deactivate();
        action.title = 'swipeTool.showController';
      } else {
        swipeElement.activate();
        action.title = 'swipeTool.hideController';
      }
    },
  });

  const listener = swipeElement.stateChanged.addEventListener((active) => {
    action.active = active;
  });
  return { action, destroy: listener };
}

export function setupSwipeToolActions(
  app: VcsUiApp,
  swipeTool: SwipeTool,
): () => void {
  const { action: swipeElementAction, destroy: swipeElementDestroy } =
    createSwipeElementAction(swipeTool.swipeElement);

  const windowComponent = {
    id: swipeWindowId,
    component: SwipeToolComponent,
    slot: WindowSlot.DYNAMIC_LEFT,
    state: {
      headerTitle: 'swipeTool.title',
      headerIcon: '$vcsSplitView',
      headerActions: [swipeElementAction],
      infoUrlCallback: app.getHelpUrlCallback('/tools/swipeTool.html'),
    },
  };

  const action = reactive({
    name: 'swipe-action',
    title: 'swipeTool.title',
    icon: '$vcsSplitView',
    active: false,
    background: false,
    disabled: false,
    callback() {
      if (action.active) {
        if (action.background) {
          app.windowManager.add(windowComponent, pluginName);
        } else {
          app.windowManager.remove(swipeWindowId);
          swipeTool.deactivate();
          action.active = false;
        }
        action.background = false;
      } else {
        swipeTool.activate();
        action.active = true;
        app.windowManager.add(windowComponent, pluginName);
      }
    },
  });

  const listeners = [
    app.windowManager.added.addEventListener(({ id }) => {
      if (id === swipeWindowId) {
        action.active = true;
        action.background = false;
      }
    }),
    app.windowManager.removed.addEventListener(({ id }) => {
      if (id === swipeWindowId) {
        action.background = true;
      }
    }),
    swipeTool.stateChanged.addEventListener((active) => {
      action.active = active;
      action.background = !app.windowManager.has(swipeWindowId);
    }),
    app.maps.mapActivated.addEventListener((map) => {
      if (map instanceof CesiumMap || map instanceof OpenlayersMap) {
        action.disabled = false;
      } else {
        swipeTool.deactivate();
        app.windowManager.remove(swipeWindowId);
        action.disabled = true;
      }
    }),
  ];

  if (app.toolboxManager.has(pluginName)) {
    app.toolboxManager.remove(pluginName);
  }
  app.toolboxManager.add(
    {
      id: pluginName,
      type: ToolboxType.SINGLE,
      action,
    },
    pluginName,
  );

  return () => {
    if (app.toolboxManager.has(pluginName)) {
      app.toolboxManager.remove(pluginName);
    }
    if (app.windowManager.has(swipeWindowId)) {
      app.windowManager.remove(swipeWindowId);
    }
    if (swipeElementDestroy) {
      swipeElementDestroy();
    }
    listeners.forEach((cb) => {
      cb();
    });
  };
}

export function setupSwipeToolActionsNoUI(
  app: VcsUiApp,
  swipeTool: SwipeTool,
): () => void {
  const action = reactive({
    name: 'swipe-action',
    title: 'swipeTool.title',
    icon: '$vcsSplitView',
    active: false,
    callback() {
      if (action.active) {
        swipeTool.deactivate();
        action.active = false;
      } else {
        swipeTool.activate();
        action.active = true;
      }
    },
  });

  const listener = swipeTool.stateChanged.addEventListener((active) => {
    action.active = active;
  });

  if (app.toolboxManager.has(pluginName)) {
    app.toolboxManager.remove(pluginName);
  }
  app.toolboxManager.add(
    {
      id: pluginName,
      type: ToolboxType.SINGLE,
      action,
    },
    pluginName,
  );

  return () => {
    if (app.toolboxManager.has(pluginName)) {
      app.toolboxManager.remove(pluginName);
    }
    listener();
  };
}
