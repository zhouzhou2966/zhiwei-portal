<!-- 我的课程 - 标题  -->
<template>
  <div class="cardsTitle fx-sb ft-20 ft-wt-600">
    <!-- back：子页用，把返回箭头贴在标题左边（箭头见 BackArrow.vue），不额外占一行 -->
    <div class="ttLeft">
      <BackArrow v-if="back" />
      <div>{{title}}</div>
    </div>
    <slot />
  </div>
</template>
<script setup>
import BackArrow from './BackArrow.vue'

// 介绍父组件传来的标题
defineProps({
  title:{
    type: String,
    default: '最近学习'
  },
  // 是否在标题左边显示返回箭头（只有个人中心的子页需要）
  back:{
    type: Boolean,
    default: false
  }
})
</script>
<style lang="scss" scoped>
.cardsTitle{
  font-weight: 600;
  font-size: 20px;
  .ttLeft{
    display: flex;
    align-items: center;
    gap: 12px;
  }
}
</style>
