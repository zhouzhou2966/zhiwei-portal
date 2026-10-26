<template>
  <div class="result-container">
    <div class="result-bg-img">
      <component :is="dynamicComponent"></component>
    </div>
    <div class="result-title">{{ title }}</div>
    <div class="result-tip">{{ tip }}</div>
    <slot />
  </div>
</template>
<script setup>
import { computed } from 'vue';
import Result403Icon from '@/assets/assets-result-403.svg?component';
import Result404Icon from '@/assets/assets-result-404.svg?component';
import Result500Icon from '@/assets/assets-result-500.svg?component';
import ResultIeIcon from '@/assets/assets-result-ie.svg?component';
import ResultWifiIcon from '@/assets/assets-result-wifi.svg?component';
import ResultMaintenanceIcon from '@/assets/assets-result-maintenance.svg?component';

const props = defineProps({
  bgUrl: String,
  title: String,
  tip: String,
  type: String,
});

const dynamicComponent = computed(() => {
  switch (props.type) {
    case '403':
      return Result403Icon;
    case '404':
      return Result404Icon;
    case '500':
      return Result500Icon;
    case 'ie':
      return ResultIeIcon;
    case 'wifi':
      return ResultWifiIcon;
    case 'maintenance':
      return ResultMaintenanceIcon;
    default:
      return Result403Icon;
  }
});
</script>
<style lang="scss" scoped>
// 原来这里有一句 `@import '@/style/theme'`，属于死代码，已删除：
// theme.scss 输出的是 `:root { --color-* }` 全局 CSS 变量，而本块是 scoped，
// Vue 会给 `:root` 加上 [data-v-xxx] 属性选择器，永远匹配不到 html，引入等于没引；
// 而且 theme.scss 已经在 main.js 的全局样式里引入过了。
// 下面这条空规则保留，留给以后补样式。
.result {

}
</style>
