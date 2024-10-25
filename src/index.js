import { name, version, mapVersion } from '../package.json';
import SwipeTool from './swipeTool.js';
import { parseUrlPluginState, writeUrlPluginState } from './stateHelper.js';
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
 * @property {boolean?} active
 * @property {number?} splitPosition
 * @property {Object<string,SwipeLayerState>?} swipeLayerStates
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
  let app;

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
     * @param {import("@vcmap/ui").VcsUiApp} vcsUiApp
     * @param {SwipeToolState=} state
     * @returns {void}
     */
    initialize: (vcsUiApp, state) => {
      app = vcsUiApp;
      if (!swipeTool) {
        swipeTool = new SwipeTool(app, config);
      }
      const pluginState = parseUrlPluginState(state);
      if (pluginState?.splitPosition) {
        swipeTool.splitPosition = pluginState.splitPosition;
      }
      if (pluginState?.swipeLayerStates) {
        swipeTool.setState(pluginState.swipeLayerStates);
      }
      if (pluginState?.active) {
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
      return swipeTool ? swipeTool.toJSON() : {};
    },
    /**
     * @returns {SwipeToolConfig}
     */
    getDefaultOptions() {
      return SwipeTool.getDefaultOptions();
    },
    /**
     * should return the plugins state
     * @param {boolean} forUrl
     * @returns {SwipeToolState|import("./stateHelper.js").SwipeToolUrlState}
     */
    getState(forUrl) {
      const state = {
        active: swipeTool.active,
        splitPosition: swipeTool.splitPosition,
        swipeLayerStates: swipeTool.getState(),
      };
      if (forUrl) {
        return swipeTool.active ? writeUrlPluginState(state) : {};
      }
      return state;
    },
    getConfigEditors() {
      return [
        {
          component: SwipeToolConfigEditor,
          title: 'swipeTool.editor.title',
          infoUrlCallback: app?.getHelpUrlCallback(
            '/components/plugins/swipeToolConfig.html',
            'app-configurator',
          ),
        },
      ];
    },
    i18n: {
      en: {
        swipeTool: {
          title: 'Swipe content',
          hideController: 'Hide control',
          showController: 'Show control',
          treeTitle: "L {'|'} R",
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
            title: 'Swipe Tool Editor',
            general: 'General settings',
            showSwipeTree: 'Enable swipe tool ui',
            showSwipeElement: 'Show swipe element',
            splitPosition: 'Initial split position',
            swipeElementTitles: 'Swipe element titles',
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
          title: 'Inhalte vergleichen',
          hideController: 'Regler ausblenden',
          showController: 'Regler anzeigen',
          treeTitle: "L {'|'} R",
          emptyTree:
            'Aktivieren Sie das Splittenwerkzeug, um die verfügbaren Ebenen anzuzeigen.',
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
            title: 'Splittenwerkzeug Editor',
            general: 'Allgemeine Einstellungen',
            showSwipeTree: 'Zeige Benutzeroberfläche',
            showSwipeElement: 'Zeige Swipe Element',
            splitPosition: 'Anfangssplitposition',
            swipeElementTitles: 'Swipe Element Titel',
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
