import { version, name } from '../package.json';
import SwipeTool from './swipeTool.js';

/**
 * @typedef {Object} PluginState
 * @property {any} prop
 */

/**
 * @param {SwipeToolOptions} config - the configuration of this plugin instance, passed in from the app.
 * @returns {import("@vcmap/ui/src/vcsUiApp").VcsPlugin<SwipeToolOptions, PluginState>}
 * @template {Object} SplitViewOptions
 */
export default function splitView(config) {
  /**
   * @type {SwipeTool}
   */
  let swipeTool;

  return {
    get name() { return name; },
    get version() { return version; },
    get swipeTool() { return swipeTool; },
    /**
     * @param {import("@vcmap/ui").VcsUiApp} app
     * @param {PluginState=} state
     * @returns {Promise<void>}
     */
    initialize: async (app, state) => {
      swipeTool = new SwipeTool(app, config);
      if (state?.active) {
        swipeTool.activate();
      }
      // if (state.layers) {
      //   swipeTool.setState();
      // }
    },
    /**
     * @param {import("@vcmap/ui").VcsUiApp} app
     * @returns {Promise<void>}
     */
    // onVcsAppMounted: async (app) => {
    //
    // },
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
      return {
        active: swipeTool.active,
        layers: swipeTool.layers,
      };
    },
    i18n: {
      en: {
        swipeTool: {
          title: 'Swipe Tool',
          activateToolTitle: 'Swipe Tool aktivieren',
          deactivateToolTitle: 'Swipe Tool deaktivieren',
          hideLeft: 'Hide layer to the left',
          hideRight: 'Hide layer to the right',
          showLeft: 'Show layer to the left',
          showRight: 'Show layer to the right',
          layers: 'Layers (L|R)',
          emptyTree: 'Activate Swipe Tool to show available layers to be split.',
          help: {
            general: 'SwipeTool of VC Map allows to compare two different states.',
            toggleHeader: 'Toggle on and off',
            toggle: 'Durch Klicken auf "Splitten Werkzeug aktivieren" bzw. "Splitten Werkzeug deaktivieren" lässt sich das Werkzeug aktivieren und nach der Bearbeitung deaktivieren.',
            swipeHeader: 'Split View Controler',
            swipe: 'Clicking on button "Split View Controler" a seamless transition between both views can be created.',
            selectHeader: 'Select Layer',
            select: 'You can decide for each layer individually whether the layer should be shown on the left, on the right, on both sides or not at all.',
          },
        },
      },
      de: {
        swipeTool: {
          title: 'Swipe Tool',
          activateToolTitle: 'Swipe Tool aktivieren',
          deactivateToolTitle: 'Swipe Tool deaktivieren',
          hideLeft: 'Ebene links verstecken',
          hideRight: 'Ebene rechts verstecken',
          showLeft: 'Ebene links anzeigen',
          showRight: 'Ebene rechts anzeigen',
          layers: 'Ebenen (L|R)',
          emptyTree: 'Aktivieren Sie das Swipe Tool um die verfügbaren Split Layer anzuzeigen.',
          help: {
            general: 'Das Splitten Werkzeug der VC Map ermöglicht den Vergleich zwischen zwei Zuständen.',
            toggleHeader: 'Ein- und Ausschalten',
            toggle: 'Durch Klicken auf "Splitten Werkzeug aktivieren" bzw. "Splitten Werkzeug deaktivieren" lässt sich das Werkzeug aktivieren und nach der Bearbeitung deaktivieren.',
            swipeHeader: 'Split View Controler',
            swipe: 'Durch Klicken auf den Button "Split View Controler ausblenden" lässt sich ein nahtloser Übergang zwischen beiden Ansichten herstellen.',
            selectHeader: 'Layer selektieren',
            select: 'Sie können für jede Ebene einzelnen entscheiden, ob der Layer links, rechts, auf beiden Seiten oder gar nicht gezeigt werden soll.',
          },
        },
      },
    },
    destroy: () => {
      if (swipeTool) {
        swipeTool.destroy();
        swipeTool = null;
      }
    },
  };
}
