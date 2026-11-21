<!-- 架构页面 -->
<template>
<div class="layoutsWrapper fx-fd-col" :class="{'personalBg': isPersonal}">
  <Header></Header>
    <router-view class="fx-1"/>
  <!-- 学习中心不挂页脚：整页锁一屏后，页脚会常驻底部吃掉近 180px 高度，
       内容区只剩 600px 出头，卡片被切在半截上。学习中心是「应用型」页面，去掉页脚更干净。
       个人中心（/account）借用同一套侧栏壳，但走普通文档流、页脚保留 -->
  <Footer v-if="!isPersonal"></Footer>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Footer from '@/components/Footer.vue';
import Header from '@/components/Header.vue';

const route = useRoute();
/**
 * 学习中心专属的雾蓝背景带。
 *
 * 为什么不直接改 body：全站每一页都会跟着变（首页、搜索、详情都是米色系）。
 * 挂在外壳上按路由加类，只影响 /personal/**。
 * 为什么不用冷白底方案：那要把 --color-background1 一起改冷，
 * 而卡片、输入框、分隔线的底色全在用它，等于全站换肤。
 */
const isPersonal = computed(() => route.path.startsWith('/personal'));
</script>
<style lang="scss" scoped>
.layoutsWrapper {
  min-height: 100vh;
}
// 学习中心：整页锁定一屏，文档不滚。
// 滚动交给内容区自己（见 pages/personal/index.scss 的 .personalMain），
// 这样左侧导航是真正固定不动的，不会出现「滚到底侧栏跟着走、顶部留一条空白」。
// 页脚留在原位（不隐藏），只是不再随文档滚动。
.layoutsWrapper.personalBg {
  height: 100vh;
  overflow: hidden;
  background-color: #F5F4F0;
  background-image:
    linear-gradient(180deg, rgba(74, 127, 165, .22) 0, rgba(74, 127, 165, .09) 210px, rgba(74, 127, 165, 0) 440px),
    linear-gradient(180deg, #FCFBF7 0%, #EFEDE6 100%);
  background-repeat: no-repeat;
}
</style>
