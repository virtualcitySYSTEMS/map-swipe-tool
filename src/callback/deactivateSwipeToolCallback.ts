import { getLogger } from '@vcsuite/logger';
import { VcsCallback } from '@vcmap/ui';
import type { VcsUiApp } from '@vcmap/ui';
import type { SwipeToolPlugin } from '../index.js';
import { name as pluginName } from '../../package.json';

class DeactivateSwipeToolCallback extends VcsCallback {
  static get className(): string {
    return 'DeactivateSwipeToolCallback';
  }

  callback(): void {
    const plugin = (this._app as VcsUiApp).plugins.getByKey(pluginName) as
      | SwipeToolPlugin
      | undefined;
    if (!plugin) {
      getLogger('DeactivateSwipeToolCallback').warning(
        `Plugin ${pluginName} not found`,
      );
      return;
    }
    plugin.deactivate();
  }
}

export default DeactivateSwipeToolCallback;
