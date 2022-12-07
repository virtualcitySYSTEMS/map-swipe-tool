import { VcsEvent } from '@vcmap/core';
import { createToggleAction, ToolboxType } from '@vcmap/ui';
import SwipeToolComponent from './swipeToolComponent.vue';
import { name as pluginName } from '../package.json';

/**
 * @param {import("@vcmap/ui").VcsUiApp} app
 * @param {SwipeTool} swipeTool
 * @returns {SwipeSession}
 */
function createSwipeSession(app, swipeTool) {
  app.maps.splitScreen.position = swipeTool.splitPosition;

  if (!swipeTool.hideSwipeElement) {
    swipeTool.swipeElement.activate();
  }

  function setSwipeLayer(l) {
    if (l.splitDirection !== undefined && !swipeTool.has(l.name)) {
      swipeTool.add({
        name: l.name,
        layerName: l.name,
        active: l.active,
        splitDirection: l.splitDirection,
      });
    }
  }

  [...app.maps.layerCollection].forEach(setSwipeLayer);

  const listeners = [
    app.maps.layerCollection.added.addEventListener(setSwipeLayer),
    app.maps.layerCollection.removed.addEventListener((l) => {
      if (swipeTool.has(l.name)) {
        swipeTool.remove(l.name);
      }
    }),
  ];

  const stopped = new VcsEvent();
  /** @type {function():void} */
  const stop = () => {
    swipeTool.swipeElement.deactivate();
    swipeTool.clear();
    stopped.raiseEvent();
    stopped.destroy();
    listeners.forEach(cb => cb());
  };

  return {
    stopped,
    stop,
  };
}

export function createSwipeAction() {

}

/**
 *
 * @param {SwipeElement} swipeElement
 * @returns {{action: import("@vcmap/ui").VcsAction, destroy: Function}}
 */
function createSwipeHideAction(swipeElement) {
  const action = {
    name: 'hide-swipe-action',
    title: 'swipeTool.hide',
    icon: '$vcsEye',
    active: false,
    callback() {
      if (swipeElement.active) {
        swipeElement.deactivate();
        // this.active = false;
        this.title = 'swipeTool.activateHide';
      } else {
        swipeElement.activate();
        // this.active = true;
        this.title = 'swipeTool.deactivateHide';
      }
    },
  };

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
  /**
   * @type {SwipeSession|null}
   */
  let session;

  const swipeAction = {
    name: 'swipe-action',
    title: 'swipeTool.title',
    icon: '$vcsSplitView',
    active: false,
    callback() {
      if (session) {
        session.stop();
        this.title = 'swipeTool.activateToolTitle';
      } else {
        session = createSwipeSession(app, swipeTool);
        session.stopped.addEventListener(() => {
          this.active = false;
          session = null;
        });
        this.active = true;
        this.title = 'swipeTool.deactivateToolTitle';
      }
    },
  };

  let toggle;
  let hide;
  if (!swipeTool.noUi) {
    hide = createSwipeHideAction(swipeTool.swipeElement);

    const windowComponent = {
      id: 'swipe-tool-window',
      component: SwipeToolComponent,
      props: {
        titleActions: [swipeAction, hide.action],
      },
      state: {
        headerTitle: 'swipeTool.title',
      },
    };
    toggle = createToggleAction(
      {
        name: 'swipe-tool-toggle',
        icon: '$vcsSplitView',
      },
      windowComponent,
      app.windowManager,
      pluginName,
    );
  }

  app.toolboxManager.add(
    {
      id: pluginName,
      type: ToolboxType.SINGLE,
      action: swipeTool.noUi ? swipeAction : toggle.action,
    },
    pluginName,
  );

  const destroy = () => {
    if (toggle) {
      toggle.destroy();
    }
    if (hide) {
      hide.destroy();
    }
  };

  return destroy;
}
