<!-- 支付 - 成功页面 -->
<template>
  <div class="successWrapper container bg-wt">
      <div class="successCont">
        <div><img src="@/assets/icon_success.png" width="72" height="72" alt=""></div>
        <div class="tit">支付成功</div>
        <div class="order" v-if="orderId">订单ID ：{{ orderId }}</div>
        <div @click="() => $router.push('/account/main/myOrder')"><span class="bt">查看订单详情</span></div>
      </div>
  </div>
</template>
<script setup>
/** 数据导入 **/
import { ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute()

// 订单号由支付页跳转时带过来，见 pages/pay/payment.vue
const orderId = ref(route.query.order || "")
</script>
<style lang="scss" src="./index.scss"> </style>
