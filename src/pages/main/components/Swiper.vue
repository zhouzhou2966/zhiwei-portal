<!-- 顶部 Banner 幻灯片
     高度交给外层（首页 .heroSwiper 定 360px），这里只负责铺满：
     图片用 object-fit: cover 撑满卡片，避免 1080×430 的图在 934×360 的槽位里被拉变形。 -->
<template>
  <div class="swiperWrapper">
    <swiper
      :modules="[Autoplay, Pagination]"
      :autoplay="{
        delay: 5000,
        disableOnInteraction: false,
      }"
      :loop="true"
      :pagination="{ clickable: true }"
    >
      <swiper-slide class="swiper-slide" v-for="(item, i) in data" :key="i">
        <img :src="item" class="banImg" alt="" />
      </swiper-slide>
    </swiper>
  </div>
</template>
<script setup>
import { Swiper, SwiperSlide } from "swiper/vue";
import { Autoplay, Pagination } from "swiper";

defineProps({
  data: {
    type: Array,
    default: () => []
  }
})
</script>
<style lang="scss" scoped>
.swiperWrapper {
  height: 100%;
  border-radius: 14px;
  overflow: hidden;

  :deep(.swiper) {
    height: 100%;
    border-radius: 14px;
  }

  .banImg {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  :deep(.swiper-pagination-bullet) {
    width: 24px;
    height: 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, .45);
    opacity: 1;
    transition: background .2s, width .2s;
  }

  :deep(.swiper-pagination-bullets.swiper-pagination-horizontal) {
    bottom: 16px;
  }

  :deep(.swiper-pagination-bullet-active) {
    width: 32px;
    background: linear-gradient(90deg, #EBCB84, #D9A441);
  }
}
</style>
