<template>
  <div>
    <VcsFormSection
      :title="`${$t('swipeTool.layers')}`"
      :title-actions="titleActions"
      help-text="swipeTool.help"
    >
      <template #help>
        <p>{{ $t('swipeTool.help.general') }}</p>
        <h3><v-icon>$vcsSplitView</v-icon> {{ $t('swipeTool.help.toggleHeader') }}</h3>
        <p> {{ $t('swipeTool.help.toggle') }}</p>
        <h3><v-icon>$vcsEye</v-icon> {{ $t('swipeTool.help.swipeHeader') }}</h3>
        <p>{{ $t('swipeTool.help.swipe') }}</p>
        <h3><b>L</b> | <b>R</b>  {{ $t('swipeTool.help.selectHeader') }}</h3>
        <p>{{ $t('swipeTool.help.select') }}</p>
      </template>
      <template #default>
        <VcsTreeview
          v-if="tree.length > 0"
          :items="tree"
          item-children="visibleChildren"
        />
        <p v-else class="ma-2">
          {{ $t('swipeTool.emptyTree') }}
        </p>
      </template>
    </VcsFormSection>
  </div>
</template>
<style>
.vcm-swipe-element:before,
.vcm-swipe-element:after
{
  font-family: FontAwesome;
  font-size: 1em;
  color: #ffffff;
  text-decoration: none;
  top: 50%;
  position: absolute;
  padding: 5px 2px;
  background-color: #555555;
}

.vcm-swipe-element:before {
  right: 3px;
  content: "\f104";
  border-bottom-left-radius: 4px 4px;
  border-top-left-radius: 4px 4px;
}

.vcm-swipe-element:after {
  left: 3px;
  content: "\f105";
  border-bottom-right-radius: 4px 4px;
  border-top-right-radius: 4px 4px;
}

.vcm-swipe-element {
  vertical-align: middle;
  width: 5px;
  background-color: #555555;
  touch-action: none;
}

.vcm-swipe-element:hover {
  cursor: ew-resize;
}

.vcm-swipe-element-title {
  color: #ffffff;
  white-space: nowrap;
  padding: 5px;
  background-color: #555555;
}

.vcm-swipe-element-title-left {
  border-bottom-left-radius: 4px 4px;
  border-top-left-radius: 4px 4px;
}

.vcm-swipe-element-title-right {
  border-bottom-right-radius: 4px 4px;
  border-top-right-radius: 4px 4px;
}
</style>
<script>
  import { computed, inject, ref } from 'vue';
  import { VIcon } from 'vuetify/lib';
  import { VcsFormSection, VcsTreeview } from '@vcmap/ui';

  export default {
    name: 'SwipeTool',
    props: {
      titleActions: {
        type: Array,
        default: () => [],
      },
    },
    components: {
      VcsFormSection,
      VcsTreeview,
      VIcon,
    },
    setup(props) {
      const app = inject('vcsApp');
      const plugin = app.plugins.getByKey('swipe-tool');
      if (!props.titleActions[0].active) {
        props.titleActions[0].callback();
      }

      const layerNames = ref(plugin.swipeTool.layerNames);
      const tree = computed(() => {
        return plugin.swipeTool.getSwipeTree(layerNames.value);
      });

      return {
        layerNames,
        tree,
      };
    },
  };
</script>
