<!-- 首页课程卡片
     竖卡：封面在上 16:9，标题 / 讲师·节数·人数 / 价格在下。
     首页三个栏目统一按 4 列铺（列数固定在 OpenClass 里），所以这里只有一种形态 ——
     不再保留「单门课切整行横卡」的分支，否则同一屏里会出现两种卡片尺寸。
     角标（badge + index）由父组件给：精品好课前三名 TOP1/2/3，精品新课前两个 NEW -->
<template>
  <article class="courseCard" @click="goDetails">
    <div class="cover">
      <img
        v-if="data.coverUrl && !coverFailed"
        :src="data.coverUrl"
        :alt="data.name"
        @error="coverFailed = true"
      />
      <div class="fallback" v-else><span>{{ initial }}</span></div>

      <span class="corner" :class="corner.tone" v-if="corner">{{ corner.text }}</span>
      <span class="corner free" v-else-if="isFree">免费</span>
    </div>

    <div class="body">
      <h3 class="name">{{ data.name || '未命名课程' }}</h3>
      <p class="meta">
        <span>{{ data.teacher || '匿名讲师' }}</span>
        <i class="dot"></i>
        <span>{{ data.sections || 0 }} 节</span>
        <i class="dot"></i>
        <span>{{ data.sold || 0 }} 人在学</span>
      </p>
      <div class="foot">
        <span class="price" :class="{ free: isFree }">{{ priceText }}</span>
        <span class="cta">查看课程<i class="arr"></i></span>
      </div>
    </div>
  </article>
</template>
<script setup>
import { computed, ref } from 'vue'
import router from '@/router'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  // 角标类型：'top' 按名次出 TOP1/2/3，'new' 出 NEW，null 不出
  badge: {
    type: String,
    default: null
  },
  index: {
    type: Number,
    default: 0
  }
})

const coverFailed = ref(false)

/**
 * 价格统一按「分」转「元」。
 * Number(undefined) 是 NaN，而 `NaN != 0` 为 true，原来那种写法会渲染出「￥NaN」，
 * 这里先兜成 0 再判断。
 */
const price = computed(() => Number(props.data.price) || 0)
const isFree = computed(() => price.value === 0)
const priceText = computed(() =>
  isFree.value ? '免费' : `￥${(price.value / 100).toFixed(2)}`
)

// 封面缺失/加载失败时的占位字：取课程名首字，比一块破图有辨识度
const initial = computed(() => (props.data.name || '课').trim().charAt(0))

// TOP 只给前三名（金银铜），NEW 只给前两个 —— 全都挂角标等于没有角标
const corner = computed(() => {
  if (props.badge === 'top' && props.index < 3) {
    return { text: `TOP ${props.index + 1}`, tone: ['gold', 'silver', 'bronze'][props.index] }
  }
  if (props.badge === 'new' && props.index < 2) {
    return { text: 'NEW', tone: 'new' }
  }
  return null
})

const goDetails = () => {
  if (!props.data.id) return
  router.push({ path: '/details', query: { id: props.data.id } })
}
</script>
<style lang="scss" scoped>
.courseCard {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border: 1px solid #EDE7DB;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: #E0D6C3;
    box-shadow: 0 16px 32px rgba(18, 55, 79, .10);

    .cover img {
      transform: scale(1.06);
    }

    .cta {
      color: var(--color-main);
    }
  }

  .cover {
    position: relative;
    flex: none;
    aspect-ratio: 16 / 9;
    background: linear-gradient(135deg, #E5EDF2, #C8D8E2);
    overflow: hidden;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform .45s ease;
    }

    .fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;

      span {
        font-size: 40px;
        font-weight: 600;
        color: rgba(27, 75, 107, .28);
      }
    }

    // 左上角标：TOP 名次 / NEW / 免费
    .corner {
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 2px 9px;
      font-size: 11px;
      font-weight: 600;
      line-height: 18px;
      letter-spacing: .5px;
      color: #12374F;
      border-radius: 6px;

      &.gold {
        background: linear-gradient(135deg, #F2DC9C, #D9A441);
      }

      &.silver {
        background: linear-gradient(135deg, #EDF1F4, #B9C3CB);
      }

      &.bronze {
        background: linear-gradient(135deg, #EDCBA9, #C08A5A);
      }

      &.new {
        color: #fff;
        background: linear-gradient(135deg, #3E9B88, #2E7D6F);
      }

      &.free {
        background: linear-gradient(135deg, #EBCB84, #D9A441);
      }
    }
  }

  .body {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 14px 16px 16px;
  }

  .name {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    min-height: 44px;
    font-size: 15px;
    font-weight: 500;
    line-height: 22px;
    color: var(--color-font1);
  }

  .meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
    margin: 8px 0 12px;
    font-size: 12px;
    color: var(--color-font3);

    .dot {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #C8C2B6;
    }
  }

  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
  }

  .price {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-error);

    &.free {
      font-size: 15px;
      color: #B07D1E;
    }
  }

  .cta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-font3);
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
