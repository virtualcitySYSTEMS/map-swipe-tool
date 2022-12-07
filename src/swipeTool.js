import { parseBoolean, parseNumber } from '@vcsuite/parsers';
import { check, checkMaybe } from '@vcsuite/check';
import { SplitDirection } from '@vcmap/cesium';
import { getLogger as getLoggerByName } from '@vcsuite/logger';
import SwipeElement from './swipeElement.js';
import { name as pluginName } from '../package.json';
import SwipeTreeItem from './swipeTreeItem.js';
import { setupSwipeToolActions } from './actionHelper.js';

/**
 * @returns {Logger}
 */
function getLogger() {
  return getLoggerByName(pluginName);
}

/**
 * @typedef {Object} SwipeToolOptions
 * @property {Array<SwipeToolItem>|undefined} layers - the layers to activate, with a given swipe direction // XXX replace by layer property swipe???
 * @property {boolean} [noUi=false] - only provide toggle capabilities
 * @property {boolean} [hideSwipeElement=false] - hide the swipe element
 * @property {number|undefined} splitPosition - the position between 0 and 1 to place the split at
 * @property {Object<string, string>|undefined} swipeElementTitles - an object with "left" and/or "right" keys representing string titles to be placed either side of the swipe element
 * @api
 */

/**
 * This widget allows to swipe split views of a {@link @vcmap/core.CesiumMap} or {@link @vcmap/core.OpenlayersMap} map.
 * {@link @vcmap/core.SplitLayer}s can be split
 * using their splitDirection property. This widget provides a {@link SwipeElement} to
 * swipe the split position. Changing the splitDirection property while the widget is active is tracked. Once
 * the widget is deactivated, the layer state previous its activation is reimplemented.
 * @class
 * @export
 * @api
 */
class SwipeTool {
  static get className() { return 'SwipeTool'; }

  /**
   * Returns the default options for this Widget
   * @api
   * @returns {SwipeToolOptions}
   */
  static getDefaultOptions() {
    return {
      noUi: false,
      hideSwipeElement: false,
      layers: undefined,
      splitPosition: 0.5,
      swipeElementTitles: undefined,
    };
  }

  /**
   * @param {import("@vcmap/ui").VcsUiApp} app
   * @param {SwipeToolOptions} options
   */
  constructor(app, options) {
    const defaultOptions = SwipeTool.getDefaultOptions();

    /**
     * @type {import("@vcmap/ui").VcsUiApp}
     * @private
     */
    this._app = app;
    /** @type {boolean} */
    this.noUi = parseBoolean(options.noUi, defaultOptions.noUi);
    /**
     * @type {Object<string, string>|undefined}
     * @private
     */
    this._swipeElementTitles = options.swipeElementTitles || defaultOptions.swipeElementTitles;
    /** @type {boolean} */
    this.hideSwipeElement = parseBoolean(options.hideSwipeElement, defaultOptions.hideSwipeElement);
    /** @type {number} */
    this.splitPosition = parseNumber(options.splitPosition, SwipeTool.getDefaultOptions().splitPosition);
    /**
     * @type {SwipeElement}
     */
    this.swipeElement = new SwipeElement(this._swipeElementTitles, app.maps);
    /**
     * @type {Array<SwipeToolItem>}
     */
    this.layersOptions = options.layers || [];
    /**
     * @type {Map<string,{splitDirection:SplitDirection,active:boolean}>}
     */
    this._initialSwipeState = new Map();
    /**
     * reactive ordered array of ids,
     * @type {Array<string>}
     */
    this.layerNames = [];
    /**
     * @type {Map<string, SwipeTreeItem>}
     * @private
     */
    this._swipeTree = new Map();
    /**
     * @type {function(): void}
     * @private
     */
    this._destroyActions = setupSwipeToolActions(this._app, this);
  }

  /**
   * The title present on the swipe element.
   * @type {Object<string, string>|undefined}
   * @api
   */
  get swipeElementTitles() {
    return this._swipeElementTitles;
  }

  /**
   * @param {Object<string, string>|undefined} titles
   */
  set swipeElementTitles(titles) {
    checkMaybe(titles, Object);

    this._swipeElementTitles = titles;
    if (this.swipeElement) {
      this.swipeElement.titles = this._swipeElementTitles;
    }
  }

  /**
   * @param {string} id
   * @returns {SwipeTreeItem}
   */
  get(id) {
    return this._swipeTree.get(id);
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return this._swipeTree.has(id);
  }

  /**
   * Adds layerName as key to list of maintained layers.
   * If ui is used, also creates a SwipeTreeItem entry and adds it to swipeTree map.
   * Caches initial active and splitDirection state of layer.
   * @param {SwipeTreeItemOptions} swipeTreeItemOptions
   */
  add(swipeTreeItemOptions) {
    check(swipeTreeItemOptions.name, String);
    check(swipeTreeItemOptions.layerName, String);
    check(swipeTreeItemOptions.active, Boolean);
    check(swipeTreeItemOptions.splitDirection, Object.values(SplitDirection));
    const { layerName } = swipeTreeItemOptions;

    if (this.layersOptions.length > 0) {
      const configuredItem = this.layersOptions.find(i => i.layerName === layerName);
      if (!configuredItem) {
        getLogger().debug(`SwipeTool Layers are configured, but ${layerName} is not part of it and will be ignored`);
        return;
      }
      Object.assign(swipeTreeItemOptions, configuredItem);
    }
    if (!this.noUi) {
      this._swipeTree.set(layerName, new SwipeTreeItem(swipeTreeItemOptions, this._app));
    }
    this.layerNames.push(layerName);
    const { active, splitDirection } = swipeTreeItemOptions;
    this._initialSwipeState[layerName] = { active, splitDirection };
  }

  /**
   * Removes a layerName from list of maintained layers.
   * If ui is used, also removes and destroys SwipeTreeItem.
   * Resets the layer's active and splitDirections to its initial state.
   * @param {string} layerName
   */
  remove(layerName) {
    check(layerName, String);
    const layer = this._app.maps.layerCollection.getByKey(layerName);
    if (layer) {
      const { active, splitDirection } = this._initialSwipeState[layerName];
      layer.splitDirection = splitDirection;
      if (!layer.active && active) {
        layer.activate();
      } else if (layer.active && !active) {
        layer.deactivate();
      }
    }
    if (!this.noUi) {
      const swipeTreeItem = this._swipeTree.get(layerName);
      if (swipeTreeItem) {
        swipeTreeItem.destroy();
        this._swipeTree.delete(layerName);
      }
    }
    const index = this.layerNames.indexOf(layerName);
    this.layerNames.splice(index, 1);
  }

  getSwipeTree() {
    return this.layerNames
      .map(layerName => this._swipeTree.get(layerName))
      .filter(item => item.visible)
      .map(item => item.getTreeViewItem());
  }

  // TODO implement setTree
  // derive from SwipeToolItem name
  // - split name
  // - if !parent create parent NodeContentTreeItem
  // - create LayerContentTreeItem
  // - push toplevel or as child
  getTree(layerNames) {
    /** @type {Map<string, ParentTreeViewItem>} */
    const baseTreeMap = new Map();
    const items = layerNames.map(name => this._swipeTree.get(name));
    // .sort((a, b) => {
    //   const depthA = a.name.split('.').length;
    //   const depthB = b.name.split('.').length;
    //   if (depthA === depthB) {
    //     if (a.weight === b.weight) {
    //       return 0;
    //     }
    //     return a.weight > b.weight ? -1 : 1;
    //   }
    //   return depthA > depthB ? 1 : -1;
    // })
    items.forEach((item) => {
      const layerContentTreeItem = new SwipeTreeItem(item, this._app);
      const treeViewItem = layerContentTreeItem.getTreeViewItem();
      const namespace = treeViewItem.name.split('.');
      const name = namespace.pop();
      let parentItem = { children: baseTreeMap };
      namespace.forEach((parentName) => {
        if (!parentItem) {
          return;
          // const nodeContentTreeItem = new NodeContentTreeItem({ name: parentName }, this._app);
          // parentItem = { treeViewItem: nodeContentTreeItem.getTreeViewItem(), children: new Map() };
        }
        parentItem = parentItem.children.get(parentName);
      });

      if (parentItem) {
        parentItem.children.set(name, { treeViewItem, children: new Map() });
      }
    });

    const setChildren = ({ treeViewItem, children }) => {
      const childMaps = [...children.values()];
      childMaps.forEach(setChildren);
      treeViewItem.children.splice(0);
      treeViewItem.children.push(...childMaps.map(c => c.treeViewItem));
      return treeViewItem;
    };

    const topLevelItems = [...baseTreeMap.values()]
      .map(setChildren);

    return topLevelItems;
  }


  // handleURLParameter(parameter) {
  //   super.handleURLParameter(parameter);
  //
  //   if (parameter.split) {
  //     this.assignConfig(parameter.split.l);
  //     this._app.maps.splitScreen.position = parameter.split.p;
  //     this.hideSwipeElement = parameter.split.hE;
  //     this.activate();
  //   }
  // }

  // getLink(url) {
  //   // if (this.active) {
  //   const l = {};
  //   const paramObject = {
  //     l,
  //     p: this._app.maps.splitScreen.position,
  //     hE: !this.swipeElement.active,
  //   };
  //   this.layerNames.forEach((layerName) => {
  //     const layer = this._app.maps.layerCollection.getByKey(layerName);
  //     if (layer.active) {
  //       l[layerName] = layer.splitDirection;
  //     }
  //   });
  // url.addQueryParams({
  //   split: JSON.stringify(paramObject),
  // });
  // }
  // }

  /**
   * clears swipeTool by removing all items of managed layers
   */
  clear() {
    const layerNames = [...this.layerNames];
    layerNames.forEach(layerName => this.remove(layerName));
  }

  destroy() {
    if (this._destroyActions) {
      this._destroyActions();
    }
    this.swipeElement.destroy();
  }
}

export default SwipeTool;
