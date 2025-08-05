import type { PluginConfigEditor, VcsPlugin, VcsUiApp } from '@vcmap/ui';
import SwipeTool, { type SwipeLayerState } from './swipeTool.js';
import {
  parseUrlPluginState,
  writeUrlPluginState,
  type SwipeToolUrlState,
} from './stateHelper.js';
import SwipeToolConfigEditor from './SwipeToolConfigEditor.vue';
import { name, version, mapVersion } from '../package.json';

export type SplitDirectionKeys = 'left' | 'right';
export type LayerStateOptions = {
  active: boolean;
  /** if omitted none is applied */
  splitDirection?: SplitDirectionKeys;
};

export type SwipeElementTitles = {
  left: string;
  right: string;
};

export type SwipeToolConfig = {
  /** If true, show tree of swipe layers. If false, only provide toggle capabilities */
  showSwipeTree?: boolean;
  /** hide the swipe element */
  showSwipeElement?: boolean;
  /** the position between 0 and 1 to place the split at */
  splitPosition?: number;
  /** an object with "left" and/or "right" keys representing string titles to be placed either side of the swipe element */
  swipeElementTitles?: SwipeElementTitles;
  /** the layers to activate, with a given swipe direction */
  swipeLayerStates?: Record<string, LayerStateOptions>;
};

export type SwipeToolState = {
  active?: boolean;
  splitPosition?: number;
  swipeLayerStates?: Record<string, SwipeLayerState>;
};

export type SwipeToolPlugin = VcsPlugin<
  SwipeToolConfig,
  SwipeToolState | SwipeToolUrlState
> & {
  swipeTool: SwipeTool;
  active: boolean;
  activate: () => void;
  deactivate: () => void;
};

export default function plugin(config: SwipeToolConfig): SwipeToolPlugin {
  let swipeTool: SwipeTool | undefined;
  let app: VcsUiApp | undefined;
  let listener: (() => void) | undefined;
  return {
    get name(): string {
      return name;
    },
    get version(): string {
      return version;
    },
    get mapVersion(): string {
      return mapVersion;
    },
    get swipeTool(): SwipeTool {
      if (!swipeTool) {
        if (!app) {
          throw new Error('VcsUiApp not yet initialized');
        }
        swipeTool = new SwipeTool(app, config);
      }
      return swipeTool;
    },
    get active(): boolean {
      return swipeTool?.active ?? false;
    },
    activate(): void {
      swipeTool?.activate();
    },
    deactivate(): void {
      swipeTool?.deactivate();
    },
    initialize(
      vcsUiApp: VcsUiApp,
      state?: SwipeToolState | SwipeToolUrlState,
    ): Promise<void> {
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
          listener?.();
          listener = undefined;
        });
      }
      return Promise.resolve();
    },
    getDefaultOptions(): SwipeToolConfig {
      return SwipeTool.getDefaultOptions();
    },
    toJSON(): SwipeToolConfig {
      return swipeTool ? swipeTool.toJSON() : {};
    },
    getState(forUrl?: boolean): SwipeToolState | SwipeToolUrlState {
      const state = {
        active: swipeTool?.active,
        splitPosition: swipeTool?.splitPosition,
        swipeLayerStates: swipeTool?.getState(),
      };
      if (forUrl) {
        return swipeTool?.active ? writeUrlPluginState(state) : {};
      }
      return state;
    },
    getConfigEditors(): PluginConfigEditor<object>[] {
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
            splitPositionInvalid:
              'Invalid entry: value must be between 0 and 1',
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
            splitPositionInvalid:
              'Ungültige Eingabe: Der Wert muss zwischen 0 und 1 liegen',
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
    destroy(): void {
      if (swipeTool) {
        swipeTool.destroy();
        swipeTool = undefined;
      }
      if (listener) {
        listener();
        listener = undefined;
      }
    },
  };
}
