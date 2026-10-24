<!-- 个人中心 - 页面内返回 / 退出 -->
<template>
  <div class="pageNav">
    <!-- back=false 用于一级页（我的课程）：它没有上一级，fallback 又正好是首页，
         返回箭头和旁边的首页按钮完全重复，去掉一个 -->
    <button v-if="back" class="navBtn" type="button" title="返回上一页" @click="goBack">
      <svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
    </button>
    <button class="navBtn" type="button" title="退出到首页" @click="goHome">
      <svg viewBox="0 0 24 24"><path d="M4 10.6L12 4l8 6.6V20a1 1 0 0 1-1 1h-4.2v-6.2H9.2V21H5a1 1 0 0 1-1-1z"/></svg>
    </button>
  </div>
</template>
<script setup>
import { useRouter } from 'vue-router'

// 没有站内来源时要退到哪：子页面传父页面，其他页面默认首页
const props = defineProps({
  fallback: { type: String, default: '/' },
  // 一级页传 false：不显示返回箭头
  back: { type: Boolean, default: true }
})

const router = useRouter()

/**
 * 返回上一页。
 *
 * 不能直接 router.back()：从收藏夹、地址栏、刷新进来时历史栈里没有上一页，
 * back() 会把人送出站外（等于按浏览器返回键），用户会以为页面坏了。
 * vue-router 4 会把来源路径写进 history.state.back，为 null 就说明没有站内来源，
 * 这种情况按 fallback 走。
 */
const goBack = () => {
  const state = window.history.state
  if (state && state.back) {
    router.back()
  } else {
    router.push(props.fallback)
  }
}

const goHome = () => router.push('/')
</script>
<style lang="scss" scoped>
.pageNav{
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.navBtn{
  width: 34px;
  height: 34px;
  padding: 0;
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
