<!-- 首屏右侧「热门专题」卡
     静态内容，不依赖登录态（原来这一列想放「继续学习」，未登录时是空的）。
     两个专题取自现有 banner 的文案，点进去落到课程库。 -->
<template>
  <div class="topicCard" :class="topic.tone" @click="go">
    <span class="k">{{ topic.tag }}</span>
    <h4 class="t">{{ topic.title }}</h4>
    <p class="d">{{ topic.desc }}</p>
    <span class="cta">查看相关课程<i class="arr"></i></span>
  </div>
</template>
<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  topic: {
    type: Object,
    default: () => ({})
  }
})

const router = useRouter()
const go = () => router.push({ path: '/search/index' })
</script>
<style lang="scss" scoped>
.topicCard {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid rgba(232, 197, 119, .20);
  background: rgba(255, 255, 255, .06);
  cursor: pointer;
  transition: background .2s, border-color .2s, transform .2s;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(232, 197, 119, .5);
    background: rgba(255, 255, 255, .10);

    .cta {
      color: #EBCB84;
    }
  }

  // 金色调：两张卡一深一浅，避免两块一样的灰玻璃
  &.gold {
    border-color: rgba(232, 197, 119, .45);
    background: linear-gradient(150deg, rgba(217, 164, 65, .22), rgba(217, 164, 65, .06));
  }

  .k {
    font-size: 12px;
    letter-spacing: 2px;
    color: #E8C577;
  }

  .t {
    margin-top: 8px;
    font-size: 15px;
    font-weight: 600;
    line-height: 22px;
    color: #fff;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  .d {
    margin-top: 6px;
    font-size: 12px;
    line-height: 18px;
    color: rgba(255, 255, 255, .58);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  .cta {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: auto;
    padding-top: 10px;
    font-size: 12px;
    color: rgba(255, 255, 255, .72);
    transition: color .18s;

    .arr {
      width: 5px;
      height: 5px;
      border-top: 1px solid currentColor;
      border-right: 1px solid currentColor;
      transform: rotate(45deg);
    }
  }
}
</style>
