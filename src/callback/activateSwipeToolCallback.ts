import { getLogger } from '@vcsuite/logger';
import { VcsCallback } from '@vcmap/ui';
import type { VcsCallbackOptions, VcsUiApp } from '@vcmap/ui';
import type { SwipeLayerState } from '../swipeTool.js';
import type { SwipeToolState, SwipeToolPlugin } from '../index.js';
import { parseUrlPluginState, type SwipeToolUrlState } from '../stateHelper.js';
import { name as pluginName } from '../../package.json';

export type ActivateSwipeToolCallbackOptions = VcsCallbackOptions &
  (Omit<SwipeToolState, 'active'> | Omit<SwipeToolUrlState, 'a'>);

class ActivateSwipeToolCallback extends VcsCallback {
  static get className(): string {
    return 'ActivateSwipeToolCallback';
  }

  private _splitPosition: number | undefined;

  private _swipeLayerStates: Record<string, SwipeLayerState> | undefined;

  constructor(options: ActivateSwipeToolCallbackOptions, app: VcsUiApp) {
    super(options, app);
    const parsed = parseUrlPluginState(
      options as SwipeToolState | SwipeToolUrlState,
    );
    this._splitPosition = parsed.splitPosition;
    this._swipeLayerStates = parsed.swipeLayerStates;
  }

  callback(): void {
    const plugin = (this._app as VcsUiApp).plugins.getByKey(pluginName) as
      | SwipeToolPlugin
      | undefined;
    if (!plugin) {
      getLogger('ActivateSwipeToolCallback').warning(
        `Plugin ${pluginName} not found`,
      );
      return;
    }
    if (this._splitPosition != null) {
      plugin.swipeTool.splitPosition = this._splitPosition;
    }
    if (this._swipeLayerStates) {
      plugin.swipeTool.setState(this._swipeLayerStates);
    }
    plugin.activate();
  }

  toJSON(): ActivateSwipeToolCallbackOptions {
    const config = super.toJSON() as VcsCallbackOptions &
      Omit<SwipeToolState, 'active'>;
    if (this._splitPosition !== undefined) {
      config.splitPosition = this._splitPosition;
    }
    if (this._swipeLayerStates) {
      config.swipeLayerStates = structuredClone(this._swipeLayerStates);
    }
    return config;
  }
}

export default ActivateSwipeToolCallback;
