<!--
  子页的返回箭头（只有一个圆形箭头按钮，不带文字）。

  用法：放进页面标题行里，让箭头贴在标题左边，例如
    <div class="title withBack"><BackArrow />优惠券使用说明</div>
    <CardsTitle title="学霸天梯榜" back />
  `.withBack` 是 flex + 居中 + 12px 间距（定义在 pages/personal/index.scss）。

  为什么不带文字：原来是一行「我的优惠券 / 优惠券说明」的面包屑，和下方大标题重复，
  而且文字看不出能点。现在箭头就是出口，页面名由标题本身承担。
-->
<template>
  <button class="backArrow" type="button" title="返回上一级" @click="goBack">
    <svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
  </button>
</template>
<script setup>
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 不能直接用 router.go(-1)：从收藏夹/新标签页直接打开这个地址时历史栈里没有上一页，
// 一点就退出站外。有上一页才 back，否则回所属一级页（meta.active 就是那一页的 path）
const goBack = () => {
  if (window.history.state && window.history.state.back) {
    router.back()
    return
  }
  if (route.meta.active) {
    router.push(`/personal/main/${route.meta.active}`)
  }
}
</script>
<style lang="scss" scoped>
.backArrow{
  width: 34px;
  height: 34px;
  padding: 0;
  flex: none;
  border-radius: 50%;
  border: 1px solid var(--color-background3);
  background: #fff;
  color: var(--color-font2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color .2s, color .2s, border-color .2s;
  &:hover{
    background: var(--color-main-light);
    border-color: var(--color-main-light2);
    color: var(--color-main);
  }
  &:active{
    background: var(--color-main-light2);
  }
  svg{
    width: 16px;
    height: 16px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.9;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}
</style>
