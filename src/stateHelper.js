/**
 * @typedef {Object} SwipeLayerUrlState
 * @property {import("@vcmap-cesium/engine").SplitDirection} sd
 * @property {boolean} a
 */

/**
 * @typedef {Object} SwipeToolUrlState
 * @property {boolean?} a
 * @property {number?} sp
 * @property {Object<string,SwipeLayerUrlState>?} swl
 */

/**
 *
 * @param {import("./index.js").SwipeToolState} state
 * @returns {SwipeToolUrlState}
 */
export function writeUrlPluginState(state) {
  return {
    a: state.active,
    sp: state.splitPosition,
    swl: Object.entries(state.swipeLayerStates).reduce(
      (acc, [key, { active, splitDirection }]) => {
        acc[key] = { a: active, sp: splitDirection };
        return acc;
      },
      {},
    ),
  };
}

/**
 *
 * @param {import("./index.js").SwipeToolState|SwipeToolUrlState} state
 * @returns {import("./index.js").SwipeToolState}
 */
export function parseUrlPluginState(state) {
  const parsed = {
    active: state?.active || state?.a,
    splitPosition: state?.splitPosition || state?.sp,
    swipeLayerStates: state?.swipeLayerStates,
  };
  if (state?.swl) {
    parsed.swipeLayerStates = Object.entries(state.swl).reduce(
      (acc, [key, { a, sp }]) => {
        acc[key] = { active: a, splitDirection: sp };
        return acc;
      },
      {},
    );
  }
  return parsed;
}
