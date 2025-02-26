import type { SplitDirection } from '@vcmap-cesium/engine';
import type { SwipeToolState } from './index.js';
import type { SwipeLayerState } from './swipeTool.js';

type SwipeLayerUrlState = {
  sd: SplitDirection;
  a: boolean;
};

export type SwipeToolUrlState = {
  a?: boolean;
  sp?: number;
  swl?: Record<string, SwipeLayerUrlState>;
};

export function writeUrlPluginState(state: SwipeToolState): SwipeToolUrlState {
  return {
    a: state.active,
    sp: state.splitPosition,
    ...(state.swipeLayerStates && {
      swl: Object.entries(state.swipeLayerStates).reduce(
        (
          acc: Record<string, SwipeLayerUrlState>,
          [key, { active, splitDirection }],
        ) => {
          acc[key] = { a: active, sd: splitDirection };
          return acc;
        },
        {},
      ),
    }),
  };
}

export function parseUrlPluginState(
  state: SwipeToolState | SwipeToolUrlState | undefined,
): SwipeToolState {
  const parsed = {
    active:
      (state as SwipeToolState)?.active ?? (state as SwipeToolUrlState)?.a,
    splitPosition:
      (state as SwipeToolState)?.splitPosition ||
      (state as SwipeToolUrlState)?.sp,
    swipeLayerStates: (state as SwipeToolState)?.swipeLayerStates,
  };
  if ((state as SwipeToolUrlState)?.swl) {
    parsed.swipeLayerStates = Object.entries(
      (state as SwipeToolUrlState).swl!,
    ).reduce((acc: Record<string, SwipeLayerState>, [key, { a, sd }]) => {
      acc[key] = { active: a, splitDirection: sd };
      return acc;
    }, {});
  }
  return parsed;
}
