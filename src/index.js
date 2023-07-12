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
    get name() {
      return name;
    },
    get version() {
      return version;
    },
    get swipeTool() {
      return swipeTool;
    },
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
          toolStateTitles: {
            activate: 'Enable Swipe Tool',
            deactivate: 'Disable Swipe Tool',
            open: 'Open Swipe Tool window',
          },
          hideController: 'Hide split view control',
          showController: 'Show split view control',
          treeTitle: 'L | R',
          emptyTree: 'Enable Swipe Tool to show available layers to be split.',
          stateActionTitles: {
            inactiveLeft: 'Show layer on the left side',
            inactiveRight: 'Show layer on the right side',
            activeLeft: 'Hide layer on the left side',
            activeRight: 'Hide layer on the right side',
            indeterminateLeft: 'Show all layers on the left side',
            indeterminateRight: 'Show all layers on the right side',
          },
        },
      },
      de: {
        swipeTool: {
          title: 'Swipe Tool',
          toolStateTitles: {
            activate: 'Swipe Tool aktivieren',
            deactivate: 'Swipe Tool deaktivieren',
            open: 'Swipe Tool Fenster öffnen',
          },
          hideController: 'Split View Regler ausblenden',
          showController: 'Split View Regler anzeigen',
          treeTitle: 'L | R',
          emptyTree:
            'Aktivieren Sie das Swipe Tool, um die verfügbaren Ebenen anzuzeigen.',
          stateActionTitles: {
            inactiveLeft: 'Ebene links anzeigen',
            inactiveRight: 'Ebene rechts anzeigen',
            activeLeft: 'Ebene links verstecken',
            activeRight: 'Ebene rechts verstecken',
            indeterminateLeft: 'Alle Ebenen links anzeigen',
            indeterminateRight: 'Alle Ebenen rechts anzeigen',
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
