<!-- 统一课程封面渲染器

     为什么要有这个东西：
     课程表里 cover_url 大多指向同一张默认图 / 少数几张高饱和 3D 招生图，
     一门讲「JVM 调优」的课配一张 3D 小人举手，和整站的米纸+靛蓝完全不搭，
     而且同一张图会在多门课上重复出现 —— 这是页面「丑」和「假」的最大单点来源。

     做法：不依赖任何图片，按「课程名 + 分类」哈希出一组低饱和配色，
     渲染成一张排版封面（分类标签 / 大号字标 / 细线 / 元信息）。
     同一分类落在同一色系，一屏扫过去能看出内容体系，且永远不会 404。

     真的想用真实封面时传 `src`（课程详情页的大图会用），加载失败自动退回排版封面。 -->
<template>
  <div class="cover" :class="[`tone-${tone}`, `r-${ratio}`, { 'has-pic': src && !broken }]">
<!-- 有实拍图：锁 16/9 统一尺寸，整图缩放填满（轻微裁切）
     object-position 靠左：库里 JavaEE 宽图（2:1）标题在左侧，裁切只裁右侧不伤标题 -->
<img v-if="src && !broken" class="pic" :src="src" :alt="name" @error="broken = true" />
    <template v-if="!(src && !broken)">
      <div class="top">
        <span class="cate">{{ category || '知微' }}</span>
        <span class="mark">ZW</span>
      </div>

      <div class="mono">{{ monogram }}</div>

      <div class="bot">
        <i class="rule"></i>
        <span class="meta">{{ meta || '课程' }}</span>
      </div>
    </template>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  category: { type: String, default: '' },
  meta: { type: String, default: '' },
  src: { type: String, default: '' },
  // 16/9 用于课程卡，4/3 用于专题与知识卡，1/1 用于头像式小图
  ratio: { type: String, default: '16/9' },
  // 手动指定色系 0-5；不传就按内容哈希
  tone: { type: Number, default: -1 }
})

const broken = ref(false)

const TONES = 6

/**
 * 哈希只取「分类优先」：
 * 同一分类的课必然同色，同名的课也稳定同色（刷新不会跳色）。
 */
const hash = computed(() => {
  const s = `${props.category || ''}|${props.name || ''}`
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000
  return h
})

const tone = computed(() =>
  props.tone >= 0 ? props.tone % TONES : hash.value % TONES
)

/**
 * 字标取课程名里第一个「有信息量」的字：
 * 跳过《》「」、数字和英文字母前缀，避免满屏都是「J」「0」。
 */
const monogram = computed(() => {
  const raw = (props.name || '知微').replace(/[《》「」【】\s]/g, '')
  const cn = raw.match(/[\u4e00-\u9fa5]/)
  if (cn) return cn[0]
  return raw.slice(0, 1).toUpperCase() || '知'
})

const styleVars = computed(() => ({}))
</script>
<style lang="scss" scoped>
.cover {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--cv-bg);
  color: var(--cv-ink);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 14px;
  user-select: none;

  &.r-16\/9 {
    aspect-ratio: 16 / 9;
  }

  &.r-4\/3 {
    aspect-ratio: 4 / 3;
  }

  &.r-1\/1 {
    aspect-ratio: 1 / 1;
  }

  /* 有实拍图：统一锁 16/9，全站封面尺寸一致（r-16/9 的 aspect-ratio 继续生效） */
  &.has-pic {
    padding: 0;
  }
}

/* 填满 16/9 容器：左右不裁（库内宽图标题靠左），上下对称裁 */
.pic {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: left center;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.cate {
  font-size: 11px;
  letter-spacing: 1.4px;
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 76%;
}

.mark {
  font-family: var(--font-serif);
  font-size: 10px;
  letter-spacing: 1px;
  opacity: 0.42;
}

/* 字标是封面唯一的“图”，靠它建立辨识度；透明度压低，避免和标题抢注意力 */
.mono {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-46%);
  font-family: var(--font-serif);
  font-size: 76px;
  line-height: 1;
  opacity: 0.16;
  pointer-events: none;
}

.bot {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule {
  flex: 1;
  height: 1px;
  background: currentColor;
  opacity: 0.22;
}

.meta {
  font-size: 11px;
  opacity: 0.62;
  white-space: nowrap;
}

/* 六个低饱和色系，全部落在米纸底上不打架 */
.tone-0 {
  --cv-bg: #e4ecf1;
  --cv-ink: #1b4b6b;
}
.tone-1 {
  --cv-bg: #f4e8d6;
  --cv-ink: #8a5a2b;
}
.tone-2 {
  --cv-bg: #e2ede7;
  --cv-ink: #2e5a4b;
}
.tone-3 {
  --cv-bg: #ede4ee;
  --cv-ink: #5b3a5e;
}
.tone-4 {
  --cv-bg: #f6e5de;
  --cv-ink: #9c4a3c;
}
.tone-5 {
  --cv-bg: #e6ebee;
  --cv-ink: #31505f;
}
</style>
