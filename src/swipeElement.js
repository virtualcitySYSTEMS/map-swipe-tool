import { ScreenSpaceEventHandler, ScreenSpaceEventType } from '@vcmap/cesium';
import { checkMaybe } from '@vcsuite/check';
import { VcsEvent } from '@vcmap/core';


/**
 * @param {import("@vcmap/core").MapCollection} mapCollection
 * @returns {HTMLElement}
 */
function createSwipeElement(mapCollection) {
  const element = document.createElement('div');
  element.className = 'vcm-swipe-element';
  element.style.position = 'absolute';
  element.style.left = `${100.0 * mapCollection.splitScreen.position}%`;
  element.style.top = '0px';
  element.style.height = '100%';
  element.style.zIndex = '0';
  return element;
}

/**
 * @param {string} title
 * @param {string} direction - left or right
 * @returns {HTMLSpanElement}
 */
function createTitleElement(title, direction) {
  const element = document.createElement('span');
  element.classList.add('vcm-swipe-element-title', `vcm-swipe-element-title-${direction}`);
  element.style.position = 'absolute';
  element.style.top = '0px';
  if (direction === 'left') {
    element.style.right = '3px';
  } else {
    element.style.left = '3px';
  }
  element.style.zIndex = '9999';
  element.innerText = title;
  return element;
}

/**
 * Creates an element which sets the position on the {@link @vcmap/core.SplitScreen} when moved
 * @class
 * @api
 */
class SwipeElement {
  /**
   * @param {Object<string, string>|undefined} titles
   * @param {import("@vcmap/core").MapCollection|undefined} mapCollection
   */
  constructor(titles, mapCollection) {
    /**
     * @type {Object<string, string>|undefined}
     * @private
     */
    this._titles = titles;

    /** @type {import("@vcmap/core").MapCollection} */
    this.mapCollection = mapCollection;
    /**
     * @type {function():void|null}
     * @private
     */
    this._mapChangedListener = null;

    /**
     * @type {HTMLElement}
     * @api
     */
    this.element = createSwipeElement(mapCollection);
    /** @type {Cesium/ScreenSpaceEventHandler} */
    this.swipeEventHandler =
      new ScreenSpaceEventHandler(/** @type {HTMLCanvasElement} */ (this.element));
    /** @type {boolean} */
    this.swipeActive = false;
    /**
     * @type {boolean}
     * @api
     */
    this.active = false;
    /**
     * @type {VcsEvent<any>}
     */
    this.stateChanged = new VcsEvent();
    this._setTitles();
  }

  /**
   * The titles on the swipe element
   * @type {Object<string, string>|null}
   * @api
   */
  get titles() { return this._titles; }

  /**
   * @param {Object<string, string>|null} titles
   */
  set titles(titles) {
    checkMaybe(titles, Object);

    this._titles = titles;
    this._setTitles();
  }

  /**
   * set the title elements
   * @private
   */
  _setTitles() {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.lastChild);
    }
    if (this._titles) {
      if (this._titles.left) {
        this.element.appendChild(createTitleElement(this.titles.left, 'left'));
      }
      if (this._titles.right) {
        this.element.appendChild(createTitleElement(this.titles.right, 'right'));
      }
    }
  }

  /**
   * Adds the swipeElement to the map container
   * @api
   */
  activate() {
    if (!this.active) {
      this._addElementToMap();
      this.element.style.left = `${100.0 * this.mapCollection.splitScreen.position}%`;
      this.swipeEventHandler.setInputAction(() => { this.swipeActive = true; }, ScreenSpaceEventType.LEFT_DOWN);
      this.swipeEventHandler.setInputAction(() => { this.swipeActive = false; }, ScreenSpaceEventType.LEFT_UP);
      this.swipeEventHandler.setInputAction(this.onSwipingListener.bind(this), ScreenSpaceEventType.MOUSE_MOVE);
      this.active = true;
      this._mapChangedListener = this.mapCollection.mapActivated.addEventListener(this.handleMapChange.bind(this));
    }
    this.stateChanged.raiseEvent(this.active);
  }

  /**
   * Removes the swipeElement from the map container
   * @api
   */
  deactivate() {
    if (this.active) {
      this._removeElementFromMap();
      this.swipeEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOWN);
      this.swipeEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_UP);
      this.swipeEventHandler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
      this.active = false;
      if (this._mapChangedListener) {
        this._mapChangedListener();
      }
    }
    this.stateChanged.raiseEvent(this.active);
  }

  handleMapChange() {
    this._removeElementFromMap();
    if (this.active) {
      this._addElementToMap();
    }
  }

  _addElementToMap() {
    this.mapCollection.activeMap.mapElement.appendChild(this.element);
  }

  _removeElementFromMap() {
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }

  /**
   * sync the swipe position of the dom element and map layers
   * @param {Object} movement
   */
  onSwipingListener(movement) {
    if (this.swipeActive) {
      const relativeOffset = movement.endPosition.x;
      const splitPosition = (this.element.offsetLeft + relativeOffset) /
        this.element.parentElement.offsetWidth;
      if (splitPosition > 0.01 && splitPosition < 0.99) {
        const { splitScreen } = this.mapCollection;
        splitScreen.position = splitPosition;
        this.element.style.left = `${100.0 * splitScreen.position}%`;
      }
    }
  }

  destroy() {
    this.deactivate();
    if (this._mapChangedListener) {
      this._mapChangedListener();
    }
  }
}

export default SwipeElement;
