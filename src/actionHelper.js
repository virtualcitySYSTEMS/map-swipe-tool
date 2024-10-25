import { ToolboxType, WindowSlot } from '@vcmap/ui';
import { ObliqueMap } from '@vcmap/core';
import { reactive } from 'vue';
import SwipeToolComponent from './SwipeToolComponent.vue';
import { name as pluginName } from '../package.json';

export const swipeWindowId = 'swipe-tool-window';

/**
 *
 * @param {SwipeElement} swipeElement
 * @returns {{action: import("@vcmap/ui").VcsAction, destroy: Function}}
 */
function createSwipeElementAction(swipeElement) {
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
  const destroy = () => listener();
  return { action, destroy };
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app
 * @param {SwipeTool} swipeTool
 * @returns {function():void}
 */
export function setupSwipeToolActions(app, swipeTool) {
  const { action: swipeElementAction, destroy: swipeElementDestroy } =
    createSwipeElementAction(swipeTool.swipeElement);
  /**
   *
   * @type {import("@vcmap/ui").WindowComponentOptions}
   */
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
          return app.windowManager.add(windowComponent, pluginName);
        } else {
          app.windowManager.remove(swipeWindowId);
          swipeTool.deactivate();
          action.active = false;
        }
        action.background = false;
      } else {
        swipeTool.activate();
        action.active = true;
        return app.windowManager.add(windowComponent, pluginName);
      }
      return null;
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
      if (map instanceof ObliqueMap) {
        swipeTool.deactivate();
        app.windowManager.remove(swipeWindowId);
        action.disabled = true;
      } else {
        action.disabled = false;
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
    listeners.forEach((cb) => cb());
  };
}

/**
 * @param {import("@vcmap/ui").VcsUiApp} app
 * @param {SwipeTool} swipeTool
 * @returns {function():void}
 */
export function setupSwipeToolActionsNoUI(app, swipeTool) {
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
      return null;
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
