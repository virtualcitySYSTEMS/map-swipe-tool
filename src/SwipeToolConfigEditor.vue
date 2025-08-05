<template>
  <AbstractConfigEditor @submit="apply">
    <VcsFormSection
      v-if="localConfig"
      heading="swipeTool.editor.general"
      expandable
      :start-open="true"
    >
      <v-container class="py-0 px-1">
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="showSwipeTree">
              {{ $t('swipeTool.editor.showSwipeTree') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsCheckbox
              id="showSwipeTree"
              v-model="localConfig.showSwipeTree"
              :true-value="true"
              :false-value="false"
            />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="showSwipeElement">
              {{ $t('swipeTool.editor.showSwipeElement') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsCheckbox
              id="showSwipeElement"
              v-model="localConfig.showSwipeElement"
              :true-value="true"
              :false-value="false"
            />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="splitPosition">
              {{ $t('swipeTool.editor.splitPosition') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              id="splitPosition"
              v-model.number="localConfig.splitPosition"
              type="number"
              step="0.1"
              min="0.0"
              max="1.0"
              :rules="[
                (v: number) =>
                  (v >= 0 && v <= 1) || 'swipeTool.editor.splitPositionInvalid',
              ]"
            />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="swipeElementTitles">
              {{ $st('swipeTool.editor.swipeElementTitles') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsCheckbox
              id="swipeElementTitles"
              v-model="enableSwipeElementTitle"
            />
          </v-col>
        </v-row>
        <v-row v-if="enableSwipeElementTitle" no-gutters>
          <v-col>
            <VcsTextField
              v-model.trim="swipeElementTitles.left"
              clearable
              :prefix="$t('swipeTool.swipeElementTitles.left')"
            />
          </v-col>
          <v-col>
            <VcsTextField
              v-model.trim="swipeElementTitles.right"
              clearable
              :prefix="$t('swipeTool.swipeElementTitles.right')"
            />
          </v-col>
        </v-row>
      </v-container>
    </VcsFormSection>
    <VcsFormSection
      heading="swipeTool.editor.swipeLayer.title"
      expandable
      :start-open="true"
    >
      <v-container class="py-1 px-2">
        <v-row no-gutters>
          <v-col>
            <VcsSelect
              id="name"
              v-model="swipeLayerName"
              :placeholder="$t('swipeTool.editor.swipeLayer.name')"
              :items="splitLayers"
              :item-text="(item: LayerItem) => item.title"
              :item-value="(item: LayerItem) => item.name"
            />
          </v-col>
          <v-col>
            <VcsFormButton :disabled="!swipeLayerName" @click="addSwipeLayer">{{
              $t('swipeTool.editor.swipeLayer.add')
            }}</VcsFormButton>
          </v-col>
        </v-row>
      </v-container>
      <VcsList :items="swipeLayerItems" :show-title="false" />
    </VcsFormSection>
  </AbstractConfigEditor>
</template>

<script lang="ts">
  import { VContainer, VRow, VCol } from 'vuetify/components';
  import {
    AbstractConfigEditor,
    VcsFormSection,
    VcsLabel,
    VcsTextField,
    VcsSelect,
    VcsCheckbox,
    VcsList,
    VcsFormButton,
    type VcsUiApp,
    type VcsListItem,
  } from '@vcmap/ui';
  import {
    type Ref,
    computed,
    defineComponent,
    inject,
    reactive,
    ref,
    type PropType,
  } from 'vue';
  import { moduleIdSymbol, volatileModuleId } from '@vcmap/core';
  import SwipeTool from './swipeTool.js';
  import type { LayerStateOptions, SwipeToolConfig } from './index.js';

  function getState(state: {
    left: boolean;
    right: boolean;
  }): LayerStateOptions {
    if (state.left && state.right) {
      return { active: true };
    } else if (state.left) {
      return { active: true, splitDirection: 'left' };
    } else if (state.right) {
      return { active: true, splitDirection: 'right' };
    }
    return { active: false };
  }

  function getSwipeLayerNames(
    swipeLayerStates: Record<string, LayerStateOptions> | undefined,
  ): string[] {
    if (swipeLayerStates) {
      return Object.keys(swipeLayerStates);
    }
    return [];
  }

  function getTitle(app: VcsUiApp, layerName: string): string {
    return (
      (app.layers.getByKey(layerName)?.properties?.title as string) || layerName
    );
  }

  function createItem(
    name: string,
    title: string,
    swipeLayerStates: Record<string, LayerStateOptions>,
    swipeLayerItems: Ref<VcsListItem[]>,
  ): VcsListItem {
    const state = {
      left:
        swipeLayerStates[name].active &&
        swipeLayerStates[name].splitDirection === 'left',
      right:
        swipeLayerStates[name].active &&
        swipeLayerStates[name].splitDirection === 'right',
    };
    return {
      name,
      title,
      actions: [
        reactive({
          name: 'split-left',
          title: 'swipeTool.editor.swipeLayer.splitLeft',
          icon: 'mdi-arrow-expand-left',
          active: state.left,
          callback() {
            state.left = !state.left;
            this.active = state.left;
            swipeLayerStates[name] = getState(state);
          },
        }),
        reactive({
          name: 'split-right',
          title: 'swipeTool.editor.swipeLayer.splitRight',
          icon: 'mdi-arrow-expand-right',
          active: state.right,
          callback() {
            state.right = !state.right;
            this.active = state.right;
            swipeLayerStates[name] = getState(state);
          },
        }),
        {
          name: 'swipeTool.editor.swipeLayer.remove',
          callback(): void {
            const idx = swipeLayerItems.value.findIndex((i) => i.name === name);
            swipeLayerItems.value.splice(idx, 1);
            delete swipeLayerStates[name];
          },
        },
      ],
    };
  }

  type LayerItem = { name: string; title: string };

  export default defineComponent({
    name: 'SwipeToolConfigEditor',
    components: {
      VContainer,
      VRow,
      VCol,
      AbstractConfigEditor,
      VcsFormSection,
      VcsLabel,
      VcsSelect,
      VcsTextField,
      VcsCheckbox,
      VcsList,
      VcsFormButton,
    },
    props: {
      getConfig: {
        type: Function as PropType<() => SwipeToolConfig>,
        required: true,
      },
      setConfig: {
        type: Function as PropType<(config: object | undefined) => void>,
        required: true,
      },
    },
    setup(props) {
      const app = inject('vcsApp') as VcsUiApp;
      const defaultOptions = SwipeTool.getDefaultOptions();
      const config = props.getConfig();
      const localConfig = ref<SwipeToolConfig>(
        Object.assign(defaultOptions, config),
      );

      const swipeElementTitles = ref(
        localConfig.value.swipeElementTitles || { left: '', right: '' },
      );
      const enableSwipeElementTitle = ref(
        !!Object.values(swipeElementTitles.value).some((t) => !!t),
      );
      const swipeLayerNames = ref<string[]>([]);
      const swipeLayerItems = ref<VcsListItem[]>([]);
      const swipeLayerName = ref('');
      const splitLayers = computed<LayerItem[]>(() =>
        [...app.layers]
          .filter(
            (l) =>
              l[moduleIdSymbol] !== volatileModuleId &&
              !('vectorClusterGroup' in l) &&
              'splitDirection' in l &&
              l.splitDirection !== undefined &&
              !swipeLayerNames.value.includes(l.name),
          )
          .map((l) => ({
            name: l.name,
            title: (l.properties?.title as string) || l.name,
          })),
      );

      swipeLayerNames.value = getSwipeLayerNames(config.swipeLayerStates);
      swipeLayerItems.value = swipeLayerNames.value.map((name) =>
        createItem(
          name,
          getTitle(app, name),
          localConfig.value.swipeLayerStates!,
          swipeLayerItems,
        ),
      );

      return {
        localConfig,
        enableSwipeElementTitle,
        swipeElementTitles,
        splitLayers,
        swipeLayerName,
        swipeLayerItems,
        addSwipeLayer(): void {
          if (!localConfig.value.swipeLayerStates) {
            localConfig.value.swipeLayerStates = {};
          }
          localConfig.value.swipeLayerStates[swipeLayerName.value] = {
            active: !!app.layers.getByKey(swipeLayerName.value)?.active,
          };
          swipeLayerNames.value = getSwipeLayerNames(
            localConfig.value.swipeLayerStates,
          );
          swipeLayerItems.value = swipeLayerNames.value.map((name) =>
            createItem(
              name,
              getTitle(app, name),
              localConfig.value.swipeLayerStates!,
              swipeLayerItems,
            ),
          );
          swipeLayerName.value = '';
        },
        apply(): void {
          if (enableSwipeElementTitle.value) {
            localConfig.value.swipeElementTitles = swipeElementTitles.value;
          } else {
            delete localConfig.value.swipeElementTitles;
          }
          if (swipeLayerNames.value.length < 1) {
            localConfig.value.swipeLayerStates = undefined;
          }
          props.setConfig(localConfig.value);
        },
      };
    },
  });
</script>

<style scoped></style>
