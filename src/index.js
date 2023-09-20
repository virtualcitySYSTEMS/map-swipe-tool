import { name, version, mapVersion } from '../package.json';
import SwipeTool from './swipeTool.js';
import SwipeToolConfigEditor from './SwipeToolConfigEditor.vue';

/**
 * @typedef {Object} SwipeLayerOptions
 * @property {boolean} active
 * @property {string} [splitDirection] - either 'left' or 'right', if omitted none is applied
 */

/**
 * @typedef {Object} SwipeElementTitles
 * @property {string} left
 * @property {string} right
 */

/**
 * @typedef {Object} SwipeToolConfig
 * @property {boolean} [showSwipeTree=true] - If true, show tree of swipe layers. If false, only provide toggle capabilities
 * @property {boolean} [showSwipeElement=true] - hide the swipe element
 * @property {number|undefined} [splitPosition] - the position between 0 and 1 to place the split at
 * @property {SwipeElementTitles|undefined} [swipeElementTitles] - an object with "left" and/or "right" keys representing string titles to be placed either side of the swipe element
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
    get mapVersion() {
      return mapVersion;
    },
    get swipeTool() {
      return swipeTool;
    },
    get active() {
      return swipeTool?.active;
    },
    activate() {
      swipeTool?.activate();
    },
    deactivate() {
      swipeTool?.deactivate();
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
     * @returns {SwipeToolConfig}
     */
    getDefaultOptions() {
      return SwipeTool.getDefaultOptions();
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
    getConfigEditors() {
      return [{ component: SwipeToolConfigEditor }];
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
          swipeElementTitles: {
            left: 'Left',
            right: 'Right',
          },
          editor: {
            general: 'General settings',
            showSwipeTree: 'Enable swipe tool ui',
            showSwipeElement: 'Show swipe element',
            splitPosition: 'Initial split position',
            swipeElementTitles: 'Swipe element titles',
            swipeLayerStates: 'Swipe layer states',
            swipeLayer: {
              title: 'Define initial state for layers',
              name: 'Select layer',
              add: 'Add initial state',
              remove: 'Remove initial state',
              splitLeft: 'Toggle split left',
              splitRight: 'Toggle split right',
            },
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
          swipeElementTitles: {
            left: 'Links',
            right: 'Rechts',
          },
          editor: {
            general: 'Allgemeine Einstellungen',
            showSwipeTree: 'Zeige Benutzeroberfläche',
            showSwipeElement: 'Zeige Swipe Element',
            splitPosition: 'Anfangssplitposition',
            swipeElementTitles: 'Swipe Element Titel',
            swipeLayerStates: 'Zustände der Ebenen',
            swipeLayer: {
              title: 'Definition von Anfangszuständen für Ebenen',
              name: 'Ebene auswählen',
              add: 'Anfangszustand hinzufügen',
              remove: 'Anfangszustand entfernen',
              splitLeft: 'Splitten links umschalten',
              splitRight: 'Splitten rechts umschalten',
            },
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
