import {
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from '@vcmap-cesium/engine';
import { check, maybe } from '@vcsuite/check';
import type { VcsUiApp } from '@vcmap/ui';
import { VcsEvent } from '@vcmap/core';
import { SplitDirectionKeys, SwipeElementTitles } from './index.js';
import { name as pluginName } from '../package.json';

function createSwipeElement(splitPosition: number): HTMLElement {
  const element = document.createElement('div');
  element.className = 'vcm-swipe-element';
  element.style.position = 'absolute';
  element.style.left = `${100.0 * splitPosition}%`;
  element.style.top = '0px';
  element.style.height = '100%';
  element.style.zIndex = '0';
  return element;
}

function createTitleElement(
  title: string,
  direction: SplitDirectionKeys,
): HTMLSpanElement {
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

/** Creates an element which sets the position on the {@link @vcmap/core.SplitScreen} when moved */
class SwipeElement {
  element: HTMLElement;

  swipeEventHandler: ScreenSpaceEventHandler;

  swipeActive = false;

  active = false;

  stateChanged: VcsEvent<boolean> = new VcsEvent();

  positionChanged: VcsEvent<number> = new VcsEvent();

  private _listeners: Array<() => void> = [];

  private _i18nChangedListener: () => void;

  constructor(
    private _app: VcsUiApp,
    private _titles?: SwipeElementTitles,
  ) {
    this.element = createSwipeElement(this._app.maps.splitPosition);
    this.swipeEventHandler = new ScreenSpaceEventHandler(
      this.element as HTMLCanvasElement,
    );
    this._i18nChangedListener = this._app.i18n.changed.addEventListener(
      ({ name }) => {
        if (name === pluginName) {
          this._setTitles();
        }
      },
    );
  }

  /** The titles on the swipe element */
  get titles(): SwipeElementTitles | undefined {
    return this._titles;
  }

  set titles(titles: SwipeElementTitles | undefined) {
    check(titles, maybe(Object));
    this._titles = titles;
    this._setTitles();
  }

  /** Set the title elements */
  private _setTitles(): void {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
    if (this.titles) {
      if (this.titles.left) {
        this.element.appendChild(
          createTitleElement(
            this._app.vueI18n.t(this.titles.left),
            SplitDirectionKeys.LEFT,
          ),
        );
      }
      if (this.titles.right) {
        this.element.appendChild(
          createTitleElement(
            this._app.vueI18n.t(this.titles.right),
            SplitDirectionKeys.RIGHT,
          ),
        );
      }
    }
  }

  /** Adds the swipeElement to the map container */
  activate(): void {
    if (!this.active) {
      this._addElementToMap();
      this._setTitles();
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

  /** Removes the swipeElement from the map container */
  deactivate(): void {
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

  handleMapChange(): void {
    this._removeElementFromMap();
    if (this.active) {
      this._addElementToMap();
    }
  }

  private _addElementToMap(): void {
    this._app.maps.target!.appendChild(this.element);
  }

  private _removeElementFromMap(): void {
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }

  /** Sync the swipe position of the dom element and map layers */
  onSwipingListener(movement: ScreenSpaceEventHandler.MotionEvent): void {
    if (this.swipeActive) {
      const relativeOffset = movement.endPosition.x;
      const splitPosition =
        (this.element.offsetLeft + relativeOffset) /
        this.element.parentElement!.offsetWidth;
      if (splitPosition > 0.01 && splitPosition < 0.99) {
        this._app.maps.splitPosition = splitPosition;
        this.element.style.left = `calc(${
          100.0 * this._app.maps.splitPosition
        }% - 2px)`;
        this.positionChanged.raiseEvent(splitPosition);
      }
    }
  }

  destroy(): void {
    this.deactivate();
    this._i18nChangedListener();
    this._listeners.forEach((cb) => cb());
    this._listeners.splice(0);
  }
}

export default SwipeElement;
