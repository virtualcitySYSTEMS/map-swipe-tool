import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from '@vcmap-cesium/engine';
import { checkMaybe } from '@vcsuite/check';
import { VcsEvent } from '@vcmap/core';
import { name as pluginName } from '../package.json';

/**
 * @param {number} splitPosition
 * @returns {HTMLElement}
 */
function createSwipeElement(splitPosition) {
  const element = document.createElement('div');
  element.className = 'vcm-swipe-element';
  element.style.position = 'absolute';
  element.style.left = `${100.0 * splitPosition}%`;
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
  element.classList.add(
    'vcm-swipe-element-title',
    `vcm-swipe-element-title-${direction}`,
  );
  element.style.position = 'absolute';
  element.style.bottom = '3px';
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
   * @param {import("@vcmap/ui").VcsUiApp} app
   * @param {Object<string, string>|undefined} titles
   */
  constructor(app, titles) {
    /**
     * @type {import("@vcmap/ui").VcsUiApp}
     * @private
     */
    this._app = app;
    /**
     * @type {HTMLElement}
     * @api
     */
    this.element = createSwipeElement(this._app.maps.splitPosition);
    /**
      @type {import("@vcmap-cesium/engine").ScreenSpaceEventHandler}
     */
    this.swipeEventHandler = new ScreenSpaceEventHandler(
      /** @type {HTMLCanvasElement} */ (this.element),
    );
    /**
     * @type {boolean}
     */
    this.swipeActive = false;
    /**
     * @type {boolean}
     */
    this.active = false;
    /**
     * @type {import("@vcmap/core").VcsEvent<boolean>}
     */
    this.stateChanged = new VcsEvent();
    /**
     * @type {import("@vcmap/core").VcsEvent<number>}
     */
    this.positionChanged = new VcsEvent();
    /**
     * @type {Object<string, string>|undefined}
     * @private
     */
    this._titles = titles;
    /**
     *
     * @type {Array<function():void>}
     * @private
     */
    this._listeners = [];

    this._i18nChangedListener = this._app.i18n.changed.addEventListener(
      ({ name }) => {
        if (name === pluginName) {
          this._setTitles();
        }
      },
    );
  }

  /**
   * The titles on the swipe element
   * @type {Object<string, string>|undefined}
   */
  get titles() {
    return this._titles;
  }

  /**
   * @param {Object<string, string>|undefined} titles
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
        this.element.appendChild(
          createTitleElement(this._app.vueI18n.t(this.titles.left), 'left'),
        );
      }
      if (this._titles.right) {
        this.element.appendChild(
          createTitleElement(this._app.vueI18n.t(this.titles.right), 'right'),
        );
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
      this.element.style.left = `calc(${
        100.0 * this._app.maps.splitPosition
      }% - 2px)`;
      this.swipeEventHandler.setInputAction(() => {
        this.swipeActive = true;
      }, ScreenSpaceEventType.LEFT_DOWN);
      this.swipeEventHandler.setInputAction(() => {
        this.swipeActive = false;
      }, ScreenSpaceEventType.LEFT_UP);
      this.swipeEventHandler.setInputAction(
        this.onSwipingListener.bind(this),
        ScreenSpaceEventType.MOUSE_MOVE,
      );
      this.active = true;
      this._listeners = [
        this._app.localeChanged.addEventListener(this._setTitles.bind(this)),
        this._app.maps.mapActivated.addEventListener(
          this.handleMapChange.bind(this),
        ),
      ];
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
      this._listeners.forEach((cb) => cb());
      this._listeners.splice(0);
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
    this._app.maps.activeMap.mapElement.appendChild(this.element);
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
      const splitPosition =
        (this.element.offsetLeft + relativeOffset) /
        this.element.parentElement.offsetWidth;
      if (splitPosition > 0.01 && splitPosition < 0.99) {
        this._app.maps.splitPosition = splitPosition;
        this.element.style.left = `calc(${
          100.0 * this._app.maps.splitPosition
        }% - 2px)`;
        this.positionChanged.raiseEvent(splitPosition);
      }
    }
  }

  destroy() {
    this.deactivate();
    this._i18nChangedListener();
    this._listeners.forEach((cb) => cb());
    this._listeners.splice(0);
  }
}

export default SwipeElement;
