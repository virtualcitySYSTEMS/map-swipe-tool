import { VcsEvent } from '@vcmap/core';
import SwipeElement from './swipeElement.js';

// /**
//  * @namespace vcs.vcm.widgets.swipeTool
//  * @api
//  */
//
// /**
//  * @typedef {Object} vcs.vcm.widgets.SwipeToolLayer
//  * @property {string} layerName
//  * @property {Cesium/ImagerySplitDirection} splitDirection
//  * @api
//  */
//
// /**
//  * @typedef {vcs.vcm.widgets.Widget.Options} vcs.vcm.widgets.swipeTool.SwipeTool.Options
//  * @property {Array<vcs.vcm.widgets.SwipeToolLayer>|undefined} layers - the layers to activate, with a given swipe direction
//  * @property {boolean} [noUi=false] - only provide toggle capabilities
//  * @property {boolean} [hideSwipeElement=false] - hide the swipe element
//  * @property {number|undefined} splitPosition - the position between 0 and 1 to place the split at
//  * @property {Object<string, string>|undefined} swipeElementTitles - an object with "left" and/or "right" keys representing string titles to be placed either side of the swipe element
//  * @api
//  */
//
// /**
//  * @typedef {Object} vcs.vcm.widgets.swipeTool.LayerState
//  * @property {boolean} active
//  * @property {Cesium/ImagerySplitDirection} splitDirection
//  * @property {string} type - either 'imagery' or 'cesium3DTileset'
//  * @api
//  */
//
// /**
//  * This widget allows to swipe split views of a {@link vcs.vcm.maps.CesiumMap} or {@link vcs.vcm.maps.Openlayers} map.
//  * {@link vcs.vcm.layer.SplitLayer}s can be split
//  * using their splitDirection property. This widget provides a {@link vcs.vcm.widgets.swipeTool.SwipeElement} to
//  * swipe the split position. Changing the splitDirection property while the widget is active is tracked. Once
//  * the widget is deactivated, the layer state previous its activation is reimplemented.
//  * @class
//  * @export
//  * @extends {vcs.vcm.widgets.Widget}
//  * @memberOf vcs.vcm.widgets.swipeTool
//  * @api
//  */
// class SwipeTool {
//   static get className() { return 'vcs.vcm.widgets.swipeTool.SwipeTool'; }
//
//   /**
//    * Returns the default options for this Widget
//    * @api
//    * @returns {vcs.vcm.widgets.swipeTool.SwipeTool.Options}
//    */
//   static getDefaultOptions() {
//     return {
//       supportedMaps: ['ALL'],
//       noUi: false,
//       hideSwipeElement: false,
//       layers: undefined,
//       splitPosition: 0.5,
//       swipeElementTitles: undefined,
//     };
//   }
//
//   /**
//    * @param {vcs.vcm.widgets.swipeTool.SwipeTool.Options} options
//    * @param {import("@vcmap/core").MapCollection|undefined} mapCollection
//    * @param {import("@vcmap/core").LayerCollection|undefined} layerCollection
//    */
//   constructor(options, mapCollection, layerCollection) {
//     const defaultOptions = SwipeTool.getDefaultOptions();
//
//     /** @type {import("@vcmap/core").MapCollection} */
//     this.mapCollection = mapCollection;
//
//     /** @type {import("@vcmap/core").LayerCollection} */
//     this.layerCollection = layerCollection;
//
//     /** @type {Array<string>} */
//     this.supportedMaps = [
//       'vcs.vcm.maps.Cesium',
//       'vcs.vcm.maps.Openlayers',
//     ];
//     /**
//      * @type {Object<string, vcs.vcm.widgets.swipeTool.LayerState>}
//      * @api
//      */
//     this.activeLayerState = {};
//
//     /**
//      * @type {Object<string, vcs.vcm.widgets.swipeTool.LayerState>}
//      * @private
//      */
//     this._initialLayerState = {};
//     /**
//      * @type {boolean}
//      * @private
//      */
//     this._firstActivation = true;
//     /** @type {boolean} */
//     this.noUi = parseBoolean(options.noUi, defaultOptions.noUi);
//     /**
//      * @type {Object<string, string>|undefined}
//      * @private
//      */
//     this._swipeElementTitles = options.swipeElementTitles || defaultOptions.swipeElementTitles;
//     /** @type {boolean} */
//     this.hideSwipeElement = parseBoolean(options.hideSwipeElement, defaultOptions.hideSwipeElement);
//     /** @type {vcs.vcm.widgets.swipeTool.SwipeElement} */
//     this.swipeElement = null;
//     /** @type {Array<number>} */
//     this._listeners = [];
//     /**
//      * @type {Array<Function>}
//      * @private
//      */
//     this._layerListeners = [];
//     /** @type {Set<vcs.vcm.layer.SplitLayer>} */
//     this._unsupportedLayerToActivate = new Set();
//
//     /** @type {number} */
//     this.splitPosition = parseNumber(options.splitPosition, SwipeTool.getDefaultOptions().splitPosition);
//
//     let layerConfig;
//     if (Array.isArray(options.layers)) {
//       layerConfig = {};
//       options.layers.forEach(({ layerName, splitDirection }) => {
//         layerConfig[layerName] = splitDirection;
//       });
//     }
//
//     /**
//      * @type {Object<string, Cesium/ImagerySplitDirection>|undefined}
//      * @private
//      */
//     this._layersOptions = layerConfig || undefined;
//   }
//
//   /**
//    * The title present on the swipe element.
//    * @type {Object<string, string>|undefined}
//    * @api
//    */
//   get swipeElementTitles() {
//     return this._swipeElementTitles;
//   }
//
//   /**
//    * @param {Object<string, string>|undefined} titles
//    */
//   set swipeElementTitles(titles) {
//     checkMaybe(titles, Object);
//
//     this._swipeElementTitles = titles;
//     if (this.swipeElement) {
//       this.swipeElement.titles = this._swipeElementTitles;
//     }
//   }
//
//   /**
//    * @inheritDoc
//    */
//   initialize() {
//     if (!this.initialized) {
//       this.mapCollection.splitScreen.position = this.splitPosition;
//       this.swipeElement = new SwipeElement(this._swipeElementTitles, this.mapCollection);
//       /** @type {Array<vcs.vcm.layer.SplitLayer>} */
//       this.availableLayers = /** @type {Array<vcs.vcm.layer.SplitLayer>} */ ([...this.layerCollection]
//         .filter(l => l instanceof CesiumTilesetLayer ||
//           l instanceof RasterLayer ||
//           l instanceof OpenStreetMapLayer));
//
//       if (this._layersOptions) {
//         this.assignConfig(this._layersOptions);
//       }
//       this.availableLayers.forEach((l) => {
//         if (this.activeLayerState[l.name] === undefined) {
//           this.activeLayerState[l.name] = null;
//         }
//       });
//
//       this.initialized = true;
//     }
//     return true;
//   }
//
//   /**
//    * @param {vcs.vcm.maps.VcsMap} map
//    */
//   handleMapChangeEvent(map) {
//     if (this._unsupportedLayerToActivate.size > 0) {
//       this._unsupportedLayerToActivate.forEach((l) => {
//         if (l.isSupported(map)) {
//           l.activate();
//           this._unsupportedLayerToActivate.delete(l);
//         }
//       });
//     }
//     super.handleMapChangeEvent(map);
//     if (this.active) {
//       this.swipeElement.handleMapChange();
//     }
//   }
//
//   /**
//    * @inheritDoc
//    */
//   activate() {
//     if (!this.active) {
//       if (!this.hideSwipeElement) {
//         this.swipeElement.activate();
//       }
//       this._setCurrentState(this._initialLayerState);
//
//       if (this._firstActivation) {
//         Object.entries(this._initialLayerState).forEach(([layerName, state]) => {
//           if (this.activeLayerState[layerName] == null) {
//             this.activeLayerState[layerName] = { ...state };
//           }
//         });
//         this._firstActivation = false;
//       }
//
//       this._applyState(this.activeLayerState);
//
//       /*
//       this._listeners.push(getFramework()
//         .subscribe(EventType.LAYER_CHANGED, this.handleLayerChanged, this));
//       this._layerListeners = this.availableLayers.map(l => l.splitDirectionChanged.addEventListener((direction) => {
//         this.handleSplitDirectionChanged(l, direction);
//       }));
//       this._listeners.push(getFramework()
//         .subscribe(EventType.WIDGET_ACTIVATED, (widget) => {
//           if (
//             widget.className === 'vcs.vcm.widgets.ClippingTool' ||
//             widget.className === 'vcs.vcm.widgets.TransparentTerrainMode'
//           ) {
//             this.deactivate();
//           }
//         }));
//
//       super.activate();
//        */
//     }
//   }
//
//   /**
//    * @param {vcs.vcm.layer.Layer} layer
//    */
//   handleLayerChanged(layer) {
//     if (this.activeLayerState[layer.name] != null) {
//       this.activeLayerState[layer.name].active = layer.active;
//     }
//   }
//
//   /**
//    * @param {vcs.vcm.layer.SplitLayer} layer
//    * @param {Cesium/ImagerySplitDirection} direction
//    */
//   handleSplitDirectionChanged(layer, direction) {
//     if (this.activeLayerState[layer.name] != null) {
//       this.activeLayerState[layer.name].splitDirection = direction;
//     }
//   }
//
//   /**
//    * @private
//    */
//   _removeListeners() {
//     //  this._listeners.forEach((key) => { getFramework().unsubscribeByKey(key); });
//     this._listeners = [];
//     this._layerListeners.forEach((cb) => { cb(); });
//     this._layerListeners = [];
//   }
//
//   /**
//    * @inheritDoc
//    */
//   deactivate() {
//     if (this.active) {
//       super.deactivate();
//       this._removeListeners();
//       this._applyState(this._initialLayerState);
//       this.swipeElement.deactivate();
//     }
//   }
//
//   /**
//    * @param {Object<string, vcs.vcm.widgets.swipeTool.LayerState>} stateObject
//    * @private
//    */
//   _applyState(stateObject) {
//     this._unsupportedLayerToActivate.clear();
//     const map = this.mapCollection.activeMap;
//     Object.entries(stateObject).forEach(([layerName, state]) => {
//       const layer = /** @type {vcs.vcm.layer.SplitLayer} */ (this.layerCollection.getByKey(layerName));
//       if (layer) {
//         if (state.active) {
//           if (layer.isSupported(map)) {
//             layer.activate();
//           } else {
//             this._unsupportedLayerToActivate.add(layer);
//           }
//         } else {
//           layer.deactivate();
//         }
//         layer.splitDirection = state.splitDirection;
//       }
//     });
//   }
//
//   /**
//    * @param {Object<string, vcs.vcm.widgets.swipeTool.LayerState>} stateObject
//    * @private
//    */
//   _setCurrentState(stateObject) {
//     this.availableLayers.forEach((l) => {
//       stateObject[l.name] = {
//         active: l.active || l.loading,
//         splitDirection: l.splitDirection,
//         type: l instanceof CesiumTilesetLayer ? 'cesium3DTileset' : 'imagery',
//       };
//     });
//     this._unsupportedLayerToActivate.forEach((l) => {
//       stateObject[l.name] = {
//         active: true,
//         splitDirection: l.splitDirection,
//         type: l instanceof CesiumTilesetLayer ? 'cesium3DTileset' : 'imagery',
//       };
//     });
//   }
//
//   /**
//    * Assign a config object. Key is the layerName, each layer will be activated, the value is the split direction to
//    * be set
//    * @param {Object<string, Cesium/ImagerySplitDirection>} config
//    * @api
//    */
//   assignConfig(config) {
//     check(config, Object);
//
//     Object.entries(config).forEach(([layerName, state]) => {
//       const layer = this.availableLayers.find(l => l.name === layerName);
//       if (layer) {
//         this.activeLayerState[layerName] = {
//           active: true,
//           splitDirection: state,
//           type: layer instanceof CesiumTilesetLayer ? 'cesium3DTileset' : 'imagery',
//         };
//       }
//     });
//   }
//
//   handleURLParameter(parameter) {
//     super.handleURLParameter(parameter);
//
//     if (parameter.split) {
//       this.assignConfig(parameter.split.l);
//       this.mapCollection.splitScreen.position = parameter.split.p;
//       this.hideSwipeElement = parameter.split.hE;
//       this.activate();
//     }
//   }
//
//   getLink(url) {
//     if (this.active) {
//       const l = {};
//       const paramObject = {
//         l,
//         p: this.mapCollection.splitScreen.position,
//         hE: !this.swipeElement.active,
//       };
//       Object.entries(this.activeLayerState).forEach(([layerName, { active, splitDirection }]) => {
//         if (active) {
//           l[layerName] = splitDirection;
//         }
//       });
//       url.addQueryParams({
//         split: JSON.stringify(paramObject),
//       });
//     }
//   }
//
//   destroy() {
//     super.destroy();
//     this._removeListeners();
//     if (this.swipeElement) {
//       this.swipeElement.deactivate();
//     }
//     this.swipeElement = null;
//     this.availableLayers = [];
//     this.activeLayerState = {};
//     this._initialLayerState = {};
//     this._firstActivation = true;
//     this.initialized = false;
//     this.active = false;
//   }
// }
//
// export default SwipeTool;

/**
 * @param {VcsUiApp} app
 * @param {Object} options
 * @returns {SwipeSession}
 */
// eslint-disable-next-line import/prefer-default-export
export function createSwipeSession(app, options) {
  const swipeElement = new SwipeElement(options.titles, app.maps);
  swipeElement.activate();


  const stopped = new VcsEvent();
  /** @type {function():void} */
  const stop = () => {
    swipeElement.deactivate();
    // listener();
    swipeElement.destroy();
    stopped.raiseEvent();
    stopped.destroy();
  };

  return {
    stopped,
    stop,
  };
}
