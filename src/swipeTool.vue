<template>
  <div>
    <VcsFormSection
      v-for="({id, items, title }) in trees"
      :key="id"
      :title="`${title} (left | right)`"
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
          :items="items"
          item-children="visibleChildren"
        />
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
  import { inject, ref } from 'vue';
  import { VIcon } from 'vuetify/lib';
  import { VcsFormSection, VcsTreeview } from '@vcmap/ui';

  /**
   * @param {import("@vcmap/ui").LayerContentTreeItem} layerItem
   * @returns {import("@vcmap/ui").VcsAction}
   */
  function createSplitActions(layerItem) {
    const splitState = ref(0);

    return [
      {
        name: `split-${layerItem.name}-right`,
        icon: '$vcsCheckbox',
        title: 'swipeTool.splitRight',
        active: false,
        callback() {
          splitState.value -= 1;
          this.icon = '$vcsCheckboxChecked';
        },
      },
      {
        name: `split-${layerItem.name}-left`,
        icon: '$vcsCheckboxChecked',
        title: 'swipeTool.splitLeft',
        active: false,
        callback() {
          splitState.value -= 1;
          this.icon = '$vcsCheckbox';
        },
      },
    ];
  }

  /**
   * deriving swipeTool tree from content tree
   * // TODO better way of getting items. items of splittable layers need to be filtered
   * @param {Array<TreeViewItem>} items
   * @returns {Array<TreeViewItem>}
   */
  export function getSwipeTreeItems(items) {
    return items.map((item) => {
      const { ...swipeItem } = { ...item };
      swipeItem.clickable = false;
      swipeItem.actions = createSplitActions(item);
      swipeItem.children = getSwipeTreeItems(swipeItem.children);
      swipeItem.visibleChildren = getSwipeTreeItems(swipeItem.visibleChildren);
      return swipeItem;
    });
  }

  export default {
    name: 'SwipeTool',
    components: {
      VcsFormSection,
      VcsTreeview,
      VIcon,
    },
    setup() {
      const app = inject('vcsApp');

      const { subTreeIds } = app.contentTree;
      const trees = subTreeIds.map(id => ({
        id,
        items: getSwipeTreeItems(app.contentTree.getComputedVisibleTree(id).value),
        // eslint-disable-next-line no-underscore-dangle
        title: app.contentTree._subTreeViewItems.value.get(id).title,
      }));

      return {
        subTreeIds,
        trees,
      };
    },
  };
</script>
