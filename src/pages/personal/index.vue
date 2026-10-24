<!-- 个人中心 - 核心架构页面 -->
<template>
  <div class="personalWrapper container">
    <div class="personal">
      <!-- 个人设置是从头像下拉进入的「账号设置」页，不属于个人中心导航体系，进入时不渲染左侧导航 -->
      <LeftNav v-if="!hideLeftNav"></LeftNav>
      <!-- personalMain = 本页唯一的滚动容器。
           必须包一层 div 而不是把 class 直接写在 router-view 上：router-view 的 class
           会合并到子组件根元素上，那些页面根节点本身带 background:#fff + padding:30px
           （.content），滚动条会跑到白卡内部、白底还会被撑满整屏 -->
      <div class="personalMain">
        <router-view class="fx-1"></router-view>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import LeftNav from "./components/LeftNav.vue";

const route = useRoute();
// mySet（个人设置）不再挂左侧导航：隐藏后 router-view 作为唯一 flex 子项自动占满整行
const hideLeftNav = computed(() => route.name === 'mySet');
</script>
<style lang="scss" src="./index.scss"></style>
