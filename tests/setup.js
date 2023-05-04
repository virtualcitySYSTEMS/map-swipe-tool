/* eslint-disable import/no-extraneous-dependencies, import/first */
import { vi } from 'vitest';
import CanvasRenderingContext2D from 'jest-canvas-mock/lib/classes/CanvasRenderingContext2D.js';
import Path2D from 'jest-canvas-mock/lib/classes/Path2D.js';
import ResizeObserver from 'resize-observer-polyfill';

global.jest = vi;
global.CanvasRenderingContext2D = CanvasRenderingContext2D;
global.Path2D = Path2D;
global.ResizeObserver = ResizeObserver;

import 'jest-canvas-mock';
import Vue from 'vue';

Vue.config.productionTip = false;

window.CESIUM_BASE_URL = '/node_modules/@vcmap-cesium/engine/Build/';
