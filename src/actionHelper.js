import { createToggleAction, ToolboxType, WindowSlot } from '@vcmap/ui';
import { reactive } from 'vue';
import SwipeToolComponent from './swipeToolComponent.vue';
import { name as pluginName } from '../package.json';

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
export default function setupSwipeToolActions(app, swipeTool) {
  const swipeToolAction = reactive({
    name: 'swipe-action',
    title: 'swipeTool.title',
    icon: '$vcsSplitView',
    active: false,
    callback() {
      if (this.active) {
        swipeTool.deactivate();
        this.active = false;
        this.title = 'swipeTool.activateToolTitle';
      } else {
        swipeTool.activate();
        this.active = true;
        this.title = 'swipeTool.deactivateToolTitle';
      }
    },
  });

  let toggle;
  let swipeElementAction;
  if (swipeTool.showSwipeTree) {
    swipeElementAction = createSwipeElementAction(swipeTool.swipeElement);

    const windowComponent = {
      id: 'swipe-tool-window',
      component: SwipeToolComponent,
      slot: WindowSlot.DYNAMIC_LEFT,
      state: {
        headerTitle: 'swipeTool.title',
        headerIcon: '$vcsSplitView',
        // infoUrl: 'https://vc.systems',
      },
      props: {
        swipeToolAction,
        swipeElementAction: swipeElementAction.action,
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

  if (app.toolboxManager.has(pluginName)) {
    app.toolboxManager.remove(pluginName);
  }
  app.toolboxManager.add(
    {
      id: pluginName,
      type: ToolboxType.SINGLE,
      action: swipeTool.showSwipeTree ? toggle.action : swipeToolAction,
    },
    pluginName,
  );

  const destroy = () => {
    if (app.windowManager.has('swipe-tool-window')) {
      app.windowManager.remove('swipe-tool-window');
    }
    if (toggle) {
      toggle.destroy();
    }
    if (swipeElementAction) {
      swipeElementAction.destroy();
    }
  };

  return destroy;
}
