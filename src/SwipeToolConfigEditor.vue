<template>
  <AbstractConfigEditor @submit="apply" v-bind="{ ...$attrs, ...$props }">
    <VcsFormSection
      heading="swipeTool.editor.general"
      expandable
      :start-open="true"
      v-if="localConfig"
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
              :true-value="true"
              :false-value="false"
              v-model="localConfig.showSwipeTree"
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
              :true-value="true"
              :false-value="false"
              v-model="localConfig.showSwipeElement"
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
              type="number"
              step="0.1"
              min="0.0"
              max="1.0"
              v-model.number="localConfig.splitPosition"
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
              v-model="localConfig.swipeElementTitles"
              :true-value="{
                right: swipeElementTitles.right,
                left: swipeElementTitles.left,
              }"
              :false-value="undefined"
            />
          </v-col>
        </v-row>
        <v-row v-if="localConfig.swipeElementTitles" no-gutters>
          <v-col>
            <VcsTextField
              clearable
              :prefix="$t('swipeTool.swipeElementTitles.left')"
              v-model.trim="swipeElementTitles.left"
            />
          </v-col>
          <v-col>
            <VcsTextField
              clearable
              :prefix="$t('swipeTool.swipeElementTitles.right')"
              v-model.trim="swipeElementTitles.right"
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
              :placeholder="$t('swipeTool.editor.swipeLayer.name')"
              :items="splitLayers"
              :item-text="(item) => item.title"
              :item-value="(item) => item.name"
              v-model="swipeLayerName"
            />
          </v-col>
          <v-col>
            <VcsFormButton @click="addSwipeLayer" :disabled="!swipeLayerName">{{
              $t('swipeTool.editor.swipeLayer.add')
            }}</VcsFormButton>
          </v-col>
        </v-row>
      </v-container>
      <VcsList :items="swipeLayerItems" :show-title="false" />
    </VcsFormSection>
  </AbstractConfigEditor>
</template>

<script>
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
  } from '@vcmap/ui';
  import { computed, inject, reactive, ref } from 'vue';
  import { moduleIdSymbol, volatileModuleId } from '@vcmap/core';
  import SwipeTool from './swipeTool.js';

  function getState({ left, right }) {
    if (left && right) {
      return { active: true };
    } else if (left) {
      return { active: true, splitDirection: 'left' };
    } else if (right) {
      return { active: true, splitDirection: 'right' };
    }
    return { active: false };
  }

  function getSwipeLayerNames(swipeLayerStates) {
    if (swipeLayerStates) {
      return Object.keys(swipeLayerStates);
    }
    return [];
  }

  function getTitle(app, layerName) {
    return app.layers.getByKey(layerName)?.properties?.title || layerName;
  }

  function createItem(name, title, swipeLayerStates, swipeLayerItems) {
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
          callback() {
            const idx = swipeLayerItems.value.findIndex((i) => i.name === name);
            swipeLayerItems.value.splice(idx, 1);
            delete swipeLayerStates[name];
          },
        },
      ],
    };
  }

  export default {
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
        type: Function,
        required: true,
      },
      setConfig: {
        type: Function,
        required: true,
      },
    },
    setup(props) {
      const app = inject('vcsApp');
      const swipeElementTitles = ref({});
      const swipeLayerNames = ref([]);
      const swipeLayerItems = ref([]);
      const swipeLayerName = ref('');
      const splitLayers = computed(() =>
        [...app.layers]
          .filter(
            (l) =>
              l[moduleIdSymbol] !== volatileModuleId &&
              l.splitDirection !== undefined &&
              !swipeLayerNames.value.includes(l.name),
          )
          .map((l) => ({ name: l.name, title: l.properties?.title || l.name })),
      );

      const localConfig = ref({});
      const defaultOptions = SwipeTool.getDefaultOptions();
      const config = props.getConfig();
      localConfig.value = Object.assign(defaultOptions, config);
      swipeElementTitles.value = localConfig.value.swipeElementTitles || {};
      swipeLayerNames.value = getSwipeLayerNames(config.swipeLayerStates);
      swipeLayerItems.value = swipeLayerNames.value.map((name) =>
        createItem(
          name,
          getTitle(app, name),
          localConfig.value.swipeLayerStates,
          swipeLayerItems,
        ),
      );

      const addSwipeLayer = () => {
        if (!localConfig.value.swipeLayerStates) {
          localConfig.value.swipeLayerStates = {};
        }
        localConfig.value.swipeLayerStates[swipeLayerName.value] = {
          active: app.layers.getByKey(swipeLayerName.value)?.active,
        };
        swipeLayerNames.value = getSwipeLayerNames(
          localConfig.value.swipeLayerStates,
        );
        swipeLayerItems.value = swipeLayerNames.value.map((name) =>
          createItem(
            name,
            getTitle(app, name),
            localConfig.value.swipeLayerStates,
            swipeLayerItems,
          ),
        );
        swipeLayerName.value = '';
      };

      const apply = () => {
        if (localConfig.value.swipeElementTitles) {
          localConfig.value.swipeElementTitles = swipeElementTitles.value;
        }
        if (swipeLayerNames.value.length < 1) {
          localConfig.value.swipeLayerStates = undefined;
        }
        props.setConfig(localConfig.value);
      };

      return {
        localConfig,
        swipeElementTitles,
        splitLayers,
        swipeLayerName,
        swipeLayerItems,
        apply,
        addSwipeLayer,
      };
    },
  };
</script>

<style scoped></style>
