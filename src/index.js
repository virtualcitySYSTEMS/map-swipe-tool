import { version, name } from '../package.json';
import SwipeTool from './swipeTool.js';

/**
 * @typedef {Object} SwipeLayerOptions
 * @property {boolean} active
 * @property {string} splitDirection - either 'left' or 'right', if omitted none is applied
 */

/**
 * @typedef {Object} SwipeToolConfig
 * @property {boolean} [showSwipeTree=true] - If true, show tree of swipe layers. If false, only provide toggle capabilities
 * @property {boolean} [showSwipeElement=true] - hide the swipe element
 * @property {number|undefined} [splitPosition] - the position between 0 and 1 to place the split at
 * @property {Object<string, string>|undefined} [swipeElementTitles] - an object with "left" and/or "right" keys representing string titles to be placed either side of the swipe element
 * @property {Object<string,SwipeLayerOptions>} [swipeLayerStates] - the layers to activate, with a given swipe direction
 * @api
 */

/**
 * @typedef {Object} SwipeToolState
 * @property {boolean} active
 * @property {number|undefined} splitPosition
 * @property {Object<string,SwipeLayerState>} swipeLayerStates
 */

/**
 * @param {SwipeToolConfig} config - the configuration of this plugin instance, passed in from the app.
 * @returns {import("@vcmap/ui/src/vcsUiApp").VcsPlugin<SwipeToolConfig, SwipeToolState>}
 */
export default function splitView(config) {
  /**
   * @type {SwipeTool}
   */
  let swipeTool;
  let listener;

  return {
    get name() { return name; },
    get version() { return version; },
    get swipeTool() { return swipeTool; },
    /**
     * @param {import("@vcmap/ui").VcsUiApp} app
     * @param {SwipeToolState=} state
     * @returns {Promise<void>}
     */
    initialize: async (app, state) => {
      if (!swipeTool) {
        swipeTool = new SwipeTool(app, config);
      }
      if (state?.splitPosition) {
        swipeTool.splitPosition = state.splitPosition;
      }
      if (state?.swipeLayerStates) {
        swipeTool.setState(state.swipeLayerStates);
      }
      if (state?.active) {
        const activate = swipeTool.activate.bind(swipeTool);
        // mapElement must be available to add swipeElement
        listener = app.maps.mapActivated.addEventListener(() => {
          activate();
          listener();
          listener = null;
        });
      }
    },
    /**
     * @returns {SwipeToolConfig}
     */
    toJSON() {
      return swipeTool.toJSON();
    },
    /**
     * should return the plugins state
     * @returns {SwipeToolState}
     */
    getState() {
      return {
        active: swipeTool.active,
        splitPosition: swipeTool.splitPosition,
        swipeLayerStates: swipeTool.getState(),
      };
    },
    i18n: {
      en: {
        swipeTool: {
          title: 'Swipe Tool',
          activateToolTitle: 'Activate Swipe Tool',
          deactivateToolTitle: 'Deactivate Swipe Tool',
          hideController: 'Hide Split View Controller',
          showController: 'Show Split View Controller',
          treeTitle: 'L | R',
          emptyTree: 'Activate Swipe Tool to show available layers to be split.',
          stateAction: {
            titleInactiveLeft: 'Show layer to the left',
            titleInactiveRight: 'Show layer to the right',
            titleActiveLeft: 'Hide layer to the left',
            titleActiveRight: 'Hide layer to the right',
            titleIndeterminateLeft: 'Show all layers to the left',
            titleIndeterminateRight: 'Show all layers to the right',
          },
        },
      },
      de: {
        swipeTool: {
          title: 'Swipe Tool',
          activateToolTitle: 'Swipe Tool aktivieren',
          deactivateToolTitle: 'Swipe Tool deaktivieren',
          hideController: 'Split View Regler ausblenden',
          showController: 'Split View Regler anzeigen',
          treeTitle: 'L | R',
          emptyTree: 'Aktivieren Sie das Swipe Tool um die verfügbaren Split Layer anzuzeigen.',
          stateAction: {
            titleInactiveLeft: 'Ebene links anzeigen',
            titleInactiveRight: 'Ebene rechts anzeigen',
            titleActiveLeft: 'Ebene links verstecken',
            titleActiveRight: 'Ebene rechts verstecken',
            titleIndeterminateLeft: 'Alle Ebenen links anzeigen',
            titleIndeterminateRight: 'Alle Ebenen rechts anzeigen',
          },
        },
      },
    },
    destroy: () => {
      if (swipeTool) {
        swipeTool.destroy();
        swipeTool = null;
      }
      if (listener) {
        listener();
        listener = null;
      }
    },
  };
}
