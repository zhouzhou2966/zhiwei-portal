<!-- 错误面板的「重新加载」：裸刷新图标（圆形箭头）
     为什么不用 el-button 的 plain 变体：
     全局样式 `.el-button{ background: var(--color-main) !important }` 会把 plain 的
     底色也刷成主色，而 plain 的文字色同样是主色 —— 文字和底色同色，
     按钮就变成一块没有字的蓝色色块（用户截图反馈的就是这个）。
     形态按用户指定：只留图标本身，不加圆形边框容器、不加底色。
     点击热区仍按 32×32 给足，图标 22px。 -->
<template>
  <button class="retryBtn" type="button" title="重新加载" aria-label="重新加载" @click="$emit('retry')">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  </button>
</template>
<script setup>
defineEmits(['retry'])
</script>
<style lang="scss" scoped>
.retryBtn{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  svg{
    width: 22px;
    height: 22px;
    stroke: var(--main);
    fill: none;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: stroke .18s;
  }
  // 图标固定不动：不旋转、不缩放，只做颜色变化（用户明确要求「固定的」）
  &:hover{
    svg{
      stroke: var(--main-deep);
    }
  }
  &:active{
    svg{
      stroke: var(--main-deep);
    }
  }
}
</style>
