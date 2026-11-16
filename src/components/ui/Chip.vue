<!-- 筛选胶囊

     两种形态：
     - 默认（实心）：用于分类/方向切换，选中用主色浅底，不做整块主色填充（避免整页发蓝）
     - ghost：用于「免费 / 入门 / 可试看」这类叠加过滤，选中只加深描边和文字色 -->
<template>
  <button
    type="button"
    class="chip"
    :class="[variant, { on: active }]"
    @click="$emit('click')"
  >
    <slot />
    <span v-if="count !== ''" class="n">{{ count }}</span>
  </button>
</template>
<script setup>
defineProps({
  active: { type: Boolean, default: false },
  variant: { type: String, default: 'solid' },
  count: { type: [Number, String], default: '' }
})
defineEmits(['click'])
</script>
<style lang="scss" scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: var(--fs-13);
  line-height: 1.4;
  color: var(--color-font2);
  background: var(--surface-sunken);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background-color 0.18s, color 0.18s, border-color 0.18s;
  font-family: inherit;
  white-space: nowrap;

  &:hover {
    color: var(--color-main);
    background: var(--color-main-light);
  }

  &.on {
    color: var(--color-main);
    background: var(--color-main-light);
    font-weight: 500;
  }

  &.ghost {
    background: transparent;
    border-color: var(--line);

    &:hover {
      border-color: var(--line-strong);
      background: transparent;
      color: var(--color-font1);
    }

    &.on {
      color: var(--color-main);
      border-color: var(--color-main-light2);
      background: transparent;
      font-weight: 500;
    }
  }
}

.n {
  font-family: var(--font-serif);
  font-size: 11px;
  color: var(--color-font3);
}
</style>
