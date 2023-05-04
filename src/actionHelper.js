import { ToolboxType, WindowSlot } from '@vcmap/ui';
import { ObliqueMap } from '@vcmap/core';
import { reactive } from 'vue';
import SwipeToolComponent from './swipeToolComponent.vue';
import { name as pluginName } from '../package.json';

/**
 * @param {import("@vcmap/ui").VcsAction} action
 * @returns {string}
 */
function getToggleTitle(action) {
  if (action?.active) {
    if (action?.background) {
      return 'swipeTool.toolStateTitles.open';
    }
    return 'swipeTool.toolStateTitles.deactivate';
  } else {
    return 'swipeTool.toolStateTitles.activate';
  }
}

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
        this.title = 'swipeTool.showController';
      } else {
        swipeElement.activate();
        this.title = 'swipeTool.hideController';
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
    id: 'swipe-tool-window',
    component: SwipeToolComponent,
    slot: WindowSlot.DYNAMIC_LEFT,
    state: {
      headerTitle: 'swipeTool.title',
      headerIcon: '$vcsSplitView',
      headerActions: [swipeElementAction],
      // infoUrl: 'https://vc.systems',
    },
  };

  const action = reactive({
    name: 'swipe-action',
    title: getToggleTitle(this),
    icon: '$vcsSplitView',
    active: false,
    background: false,
    disabled: false,
    callback() {
      if (this.active) {
        if (this.background) {
          return app.windowManager.add(windowComponent, pluginName);
        } else {
          app.windowManager.remove(windowComponent.id);
          swipeTool.deactivate();
          this.active = false;
        }
        this.background = false;
      } else {
        swipeTool.activate();
        this.active = true;
        return app.windowManager.add(windowComponent, pluginName);
      }
      this.title = getToggleTitle(this);
      return null;
    },
  });

  const listeners = [
    app.windowManager.added.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        action.active = true;
        action.background = false;
        action.title = getToggleTitle(action);
      }
    }),
    app.windowManager.removed.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        action.background = true;
        action.title = getToggleTitle(action);
      }
    }),
    swipeTool.stateChanged.addEventListener((active) => {
      action.active = active;
      action.title = getToggleTitle(action);
    }),
    app.maps.mapActivated.addEventListener((map) => {
      if (map instanceof ObliqueMap) {
        swipeTool.deactivate();
        app.windowManager.remove(windowComponent.id);
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

  const destroy = () => {
    if (app.toolboxManager.has(pluginName)) {
      app.toolboxManager.remove(pluginName);
    }
    if (app.windowManager.has(windowComponent.id)) {
      app.windowManager.remove(windowComponent.id);
    }
    if (swipeElementDestroy) {
      swipeElementDestroy();
    }
    listeners.forEach((cb) => cb());
  };

  return destroy;
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
      if (this.active) {
        swipeTool.deactivate();
        this.active = false;
        this.title = 'swipeTool.toolStateTitles.activate';
      } else {
        swipeTool.activate();
        this.active = true;
        this.title = 'swipeTool.toolStateTitles.deactivate';
      }
      return null;
    },
  });

  const listener = swipeTool.stateChanged.addEventListener((active) => {
    action.active = active;
    action.title = getToggleTitle(action);
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

  const destroy = () => {
    if (app.toolboxManager.has(pluginName)) {
      app.toolboxManager.remove(pluginName);
    }
    listener();
  };

  return destroy;
}
