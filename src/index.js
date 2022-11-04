import { createToggleAction, ToolboxType } from '@vcmap/ui';
import { version, name } from '../package.json';
import { createSwipeSession } from './swipeTool.js';
import SwipeTool from './swipeTool.vue';
import swipeToolHeader from './swipeToolHeader.vue';

/**
 * @typedef {Object} SwipeToolOptions
 * @property {SwipeToolLayer>|undefined} layers - the layers to activate, with a given swipe direction // XXX replace by layer property swipe???
 * @property {boolean} [noUi=false] - only provide toggle capabilities
 * @property {boolean} [hideSwipeElement=false] - hide the swipe element
 * @property {number|undefined} splitPosition - the position between 0 and 1 to place the split at
 * @property {Object<string, string>|undefined} swipeElementTitles - an object with "left" and/or "right" keys representing string titles to be placed either side of the swipe element
 * @api
 */

/**
 * @typedef {Object} PluginState
 * @property {any} prop
 */

/** @type {SwipeSession|null} */
let session = null;

/**
 * @param {VcsUiApp} app
 * @param {SwipeToolOptions} options
 */
export function setupSwipeTool(app, options) {
  let toggleAction;
  if (!options.noUi) {
    const windowComponent = {
      id: name,
      component: SwipeTool,
      headerComponent: swipeToolHeader,
      state: {
        headerTitle: 'swipeTool.title',
      },
    };
    toggleAction = createToggleAction(
      {
        name,
        icon: '$vcsSplitView',
      },
      windowComponent,
      app.windowManager,
      name,
    );
  }

  const action = {
    name,
    title: 'swipeTool.title',
    icon: '$vcsSplitView',
    active: false,
    callback() {
      toggleAction?.action.callback();
      if (session) {
        session.stop();
        this.title = 'swipeTool.activateToolTitle';
      } else {
        session = createSwipeSession(app, options);
        session.stopped.addEventListener(() => {
          this.active = false;
          session = null;
        });
        this.active = true;
        this.title = 'swipeTool.deactivateToolTitle';
      }
    },
  };

  app.toolboxManager.add(
    {
      id: name,
      type: ToolboxType.SINGLE,
      action,
    },
    name,
  );
}

/**
 * @param {SwipeToolOptions} config - the configuration of this plugin instance, passed in from the app.
 * @returns {import("@vcmap/ui/src/vcsUiApp").VcsPlugin<SwipeToolOptions, PluginState>}
 * @template {Object} SplitViewOptions
 */
export default function splitView(config) {
  return {
    get name() { return name; },
    get version() { return version; },
    /**
     * @param {import("@vcmap/ui").VcsUiApp} vcsUiApp
     * @param {PluginState=} state
     * @returns {Promise<void>}
     */
    initialize: async (vcsUiApp, state) => {
      // eslint-disable-next-line no-console
      console.log('Called before loading the rest of the current context. Passed in the containing Vcs UI App ', vcsUiApp, state);
    },
    /**
     * @param {import("@vcmap/ui").VcsUiApp} app
     * @returns {Promise<void>}
     */
    onVcsAppMounted: async (app) => {
      // setupSwipeTool(app, { ...defaultConfig, ...config });
      setupSwipeTool(app, config);
    },
    /**
     * @returns {Promise<T>}
     */
    toJSON: async () => {
      // eslint-disable-next-line no-console
      console.log('Called when serializing this plugin instance');
    },
    /**
     * should return the plugins state
     * @param {boolean} forUrl
     * @returns {Promise<PluginState>}
     */
    getState: async (forUrl) => {
      // eslint-disable-next-line no-console
      console.log(forUrl);
      return {};
    },
    i18n: {
      en: {
        swipeTool: {
          title: 'Swipe Tool',
          activateToolTitle: 'Swipe Tool aktivieren',
          deactivateToolTitle: 'Swipe Tool deaktivieren',
        },
      },
      de: {
        swipeTool: {
          title: 'Swipe Tool',
          activateToolTitle: 'Activate Swipe Tool',
          deactivateToolTitle: 'Deactivate Swipe Tool',
          help: {
            general: 'Das Splitten Werkzeug der VC Map ermöglicht den Vergleich zwischen zwei Zuständen.',
            toggleHeader: 'Ein- und Ausschalten',
            toggle: 'Durch Klicken auf "Splitten Werkzeug aktivieren" bzw. "Splitten Werkzeug deaktivieren" lässt sich das Werkzeug aktivieren und nach der Bearbeitung deaktivieren.',
            swipeHeader: 'Split View Controler',
            swipe: 'Durch Klicken auf den Button "Split View Controler ausblenden" lässt sich ein nahtloser Übergang zwischen beiden Ansichten herstellen.',
            selectHeader: 'Layer selektieren',
            select: 'Sowohl die verfügbaren "Basislayer" als auch die verschiedenen "3D Objektlayer" befinden sich in der Legende und lassen sich durch einen Klick auf "L" oder "R" auf der entsprechenden linken oder rechten Seite einblenden.',
          },
        },
      },
    },
    destroy() {
      if (session) {
        session.stop();
        session = null;
      }
    },
  };
}
