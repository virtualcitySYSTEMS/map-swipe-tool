<template>
  <div>
    <div v-if="trees.length > 0">
      <VcsFormSection v-for="(tree, idx) in trees" :key="subTreeIds[idx]">
        <template #header v-if="tree">
          <article class="pa-2 vcm-tree-header">
            <div
              class="form-section-header d-flex align-center swipe-tree-header"
            >
              <div class="d-inline-flex">
                <v-icon>
                  {{ tree.icon }}
                </v-icon>
              </div>
              <div>
                <strong class="px-1">{{ $t(tree.title) }}</strong>
              </div>
              <div class="ml-auto mr-10">
                <strong>{{ $st('swipeTool.treeTitle') }}</strong>
              </div>
            </div>
          </article>
        </template>
        <template #default>
          <VcsTreeview
            :items="tree.visibleChildren"
            v-model:opened="opened"
            item-children="visibleChildren"
            open-on-click
          />
        </template>
      </VcsFormSection>
    </div>
    <p v-else class="ma-2">
      {{ $t('swipeTool.emptyTree') }}
    </p>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, inject, ref } from 'vue';
  import { VIcon } from 'vuetify/components';
  import { openStateMapSymbol, VcsFormSection, VcsTreeview } from '@vcmap/ui';
  import type { VcsUiApp } from '@vcmap/ui';
  import type { SwipeToolPlugin } from './index.js';
  import { name } from '../package.json';

  /**
   * Component rendering a swipe tree with split actions derived from the content tree.
   * Contains css styling for the SwipeElement.
   */
  export default defineComponent({
    name: 'SwipeToolComponent',
    components: {
      VcsFormSection,
      VcsTreeview,
      VIcon,
    },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const plugin = app.plugins.getByKey(name) as SwipeToolPlugin;
      const { subTreeIds } = plugin.swipeTool;
      const opened = ref();

      // @ts-expect-error - the openStateMapSymbol is not exposed
      const openStateMap = app.contentTree[openStateMapSymbol] as Map<
        string,
        string[]
      >;
      if (openStateMap && openStateMap.has(app.maps.activeMap!.name)) {
        opened.value = openStateMap.get(app.maps.activeMap!.name);
      } else {
        opened.value = subTreeIds.value.flatMap((id) =>
          app.contentTree.getTreeOpenState(id),
        );
      }

      const trees = computed(() => {
        return subTreeIds.value.flatMap(
          (id) => plugin.swipeTool.getComputedVisibleTree(id).value,
        );
      });

      return {
        subTreeIds,
        trees,
        opened,
      };
    },
  });
</script>

<style lang="scss">
  .swipe-tree-header {
    height: 17px;
  }

  .vcm-swipe-element:before,
  .vcm-swipe-element:after {
    text-decoration: none;
    top: 48%;
    position: absolute;
  }

  .vcm-swipe-element:before {
    right: calc(-1 * (var(--v-vcs-font-size) * 0.7875));
    // -10px;
    content: '';
    background-color: rgb(var(--v-theme-primary));
    border-radius: 50%;
    width: calc((var(--v-vcs-font-size) * 2) - 2px);
    height: calc((var(--v-vcs-font-size) * 2) - 2px);
  }

  .vcm-swipe-element:after {
    left: calc(-1 * ((var(--v-vcs-font-size) * 2) * 0.625 - 7px));
    // -9px;
    content: '';
    width: calc(var(--v-vcs-font-size) * 2 - 2px);
    height: calc(var(--v-vcs-font-size) * 2 - 2px);
    background-color: rgb(var(--v-theme-base-lighten-5));
    -webkit-mask-image: url('data:image/svg+xml;utf8,<svg height="24px" width="24px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m14.53,6.72c-.29.29-.29.77,0,1.06,0,0,0,0,0,0l3.86,3.86c.06.06.06.15,0,.21l-3.86,3.86c-.29.29-.29.77,0,1.06.29.29.77.29,1.06,0l4.5-4.5c.29-.29.29-.77,0-1.06,0,0,0,0,0,0l-4.5-4.5c-.29-.29-.77-.29-1.06,0,0,0,0,0,0,0h0Zm-5,10.33c.29-.29.29-.77,0-1.06,0,0,0,0,0,0l-3.86-3.86c-.06-.06-.06-.15,0-.21l3.86-3.86c.29-.29.29-.77,0-1.06-.29-.29-.77-.29-1.06,0l-4.5,4.5c-.29.29-.29.77,0,1.06,0,0,0,0,0,0l4.5,4.5c.29.29.77.29,1.06,0,0,0,0,0,0,0h0Z" fill="currentColor" /></svg>');
    mask-image: url('data:image/svg+xml;utf8,<svg height="24px" width="24px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m14.53,6.72c-.29.29-.29.77,0,1.06,0,0,0,0,0,0l3.86,3.86c.06.06.06.15,0,.21l-3.86,3.86c-.29.29-.29.77,0,1.06.29.29.77.29,1.06,0l4.5-4.5c.29-.29.29-.77,0-1.06,0,0,0,0,0,0l-4.5-4.5c-.29-.29-.77-.29-1.06,0,0,0,0,0,0,0h0Zm-5,10.33c.29-.29.29-.77,0-1.06,0,0,0,0,0,0l-3.86-3.86c-.06-.06-.06-.15,0-.21l3.86-3.86c.29-.29.29-.77,0-1.06-.29-.29-.77-.29-1.06,0l-4.5,4.5c-.29.29-.29.77,0,1.06,0,0,0,0,0,0l4.5,4.5c.29.29.77.29,1.06,0,0,0,0,0,0,0h0Z" fill="currentColor" /></svg>');
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
  }

  .vcm-swipe-element {
    vertical-align: middle;
    width: 5px;
    background-color: rgb(var(--v-theme-primary));
    touch-action: none;
  }

  .vcm-swipe-element:hover {
    cursor: ew-resize;
  }

  .vcm-swipe-element-title {
    color: rgb(var(--v-theme-base-lighten-5));
    white-space: nowrap;
    padding: 5px;
    background-color: rgb(var(--v-theme-primary));
  }

  .vcm-swipe-element-title-left {
    border-bottom-left-radius: 4px 4px;
    border-top-left-radius: 4px 4px;
  }

  .vcm-swipe-element-title-right {
    border-bottom-right-radius: 4px 4px;
    border-top-right-radius: 4px 4px;
  }
  .vcm-tree-header {
    background-color: rgb(var(--v-theme-base-lighten-3));
  }
</style>
