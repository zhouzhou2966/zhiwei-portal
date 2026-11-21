<!-- 区域壳层（学习中心 /personal 与 个人中心 /account 共用）
     LeftNav 按「当前路由 matched[1].children」生成导航：
     挂在哪个分支下就自动显示哪组页面，两个区不需要各自复制一份壳 -->
<template>
  <div class="personalWrapper container">
    <div class="personal">
      <!-- personalMain = 本页唯一的滚动容器。
           必须包一层 div 而不是把 class 直接写在 router-view 上：router-view 的 class
           会合并到子组件根元素上，那些页面根节点本身带 background:#fff + padding:30px
           （.content），滚动条会跑到白卡内部、白底还会被撑满整屏 -->
      <LeftNav></LeftNav>
      <div class="personalMain">
        <router-view class="fx-1"></router-view>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useRoute } from "vue-router";
import LeftNav from "./components/LeftNav.vue";

const route = useRoute();
// 原来这里有一个 hideLeftNav：mySet 之前是「头像下拉进入、不挂导航」的隐藏页。
// 拆区之后个人设置进了个人中心导航（它是这个区里的一员，不是体系外），逻辑随之删除
</script>
<style lang="scss" src="./index.scss"></style>
