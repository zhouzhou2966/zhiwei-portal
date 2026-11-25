<!-- 我的优化券 - 使用说明 -->
<template>
  <div class="couponWrapperExplain">
    <div class="personalCards">
        <!-- 返回箭头贴在标题左边（.withBack 是 flex + 居中 + 12px 间距，见 index.scss） -->
        <div class="title withBack"><BackArrow />优惠券使用说明</div>
        <div class="cont">
          <p class="tit">1.怎样获取优惠券？</p>
          <p>知微会不定期推出课程优惠活动，通过优惠活动可以领取优惠券。</p>
          <p class="tit">2.怎样使用优惠券？</p>
          <p>先领取一张优惠券，然后在对应的课程页面，点击「立即购买」，在支付页面中选择需要使用的优惠券。使用优惠券后，付款「价格」会出现对应的变化。</p>
          <p class="tit">3.如果优惠券面额大于课程的价格，可以使用吗？</p>
          <p>不可以，优惠券面额≤课程价格时才能使用，购买时最低需支付0.02元。</p>
          <p class="tit">4.每个人可以领取多少张优惠券？</p>
          <p>每个人可以领取多张优惠券，但同一门课程的相同的优惠券，一个用户只能领取一张。</p>
        </div>
    </div>
  </div>
</template>
<script setup>
/**
 * 这页是纯静态文案，不需要任何接口。
 * 原来这里是从「我的优惠券」复制过来的整套列表逻辑（onMounted 里就调 getMyCoupon），
 * 于是进说明页也会请求 promotion 服务 —— 优惠券服务没起来时，一个纯说明页会莫名弹出
 * 「服务不存在」的红条，看着像说明页坏了。全部删掉，只留返回箭头。
 */
import BackArrow from './components/BackArrow.vue'
</script>
<style lang="scss" src="./index.scss"> </style>
