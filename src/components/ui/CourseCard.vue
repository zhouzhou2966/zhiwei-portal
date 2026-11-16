<!-- 课程卡 · v40 视觉稿 .course
     封面：有实拍图走 CourseCover 图片模式（自动降级排版封面）；
     底部：标题 / 讲师·人数 / 价格行。价格用 zw-num 保证数字对齐。 -->
<template>
  <div class="course" @click="$emit('open', data)">
    <CourseCover
      :name="data.name"
      :category="cateLabel"
      :src="data.coverUrl"
      ratio="16/9"
    />
    <div class="body">
      <h4 class="zw-clamp-2" v-html="data.name"></h4>
      <div class="meta">
        <span>{{ data.teacher || '知微讲师' }}</span>
        <i></i>
        <span>{{ soldText }}</span>
      </div>
      <div class="row">
        <span v-if="free" class="price free">免费</span>
        <span v-else class="price zw-num"><em>￥</em>{{ priceText }}</span>
        <span class="badge">{{ badge }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import CourseCover from './CourseCover.vue'

const props = defineProps({
  data: { type: Object, required: true }
})
defineEmits(['open'])

const free = computed(() => Number(props.data.price) === 0)
const priceText = computed(() => (Number(props.data.price) / 100).toFixed(2))

const soldText = computed(() => {
  const n = Number(props.data.sold) || 0
  return n >= 10000 ? `${(n / 10000).toFixed(1)} 万人在学` : `${n} 人在学`
})

const badge = computed(() => {
  if (free.value) return '入门'
  return Number(props.data.sections) > 20 ? '体系课' : '精选'
})

const cateLabel = computed(() => (props.data.categoryName || props.data.cateName || '课程'))
</script>
<style lang="scss" scoped>
.course {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  overflow: hidden;
  cursor: pointer;
  transition: 0.22s var(--ease-out);
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-3px);
    border-color: var(--line-strong);
    box-shadow: 0 14px 30px rgba(26, 29, 33, 0.08);
  }

  .body {
    padding: 13px 15px 15px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  h4 {
    font-size: 14.5px;
    font-weight: 500;
    line-height: 1.5;
    color: var(--ink);
    margin: 0;
    min-height: 2.9em;
  }

  .meta {
    font-size: 12px;
    color: var(--ink3);
    display: flex;
    gap: 7px;
    align-items: center;
    margin-top: 7px;

    i {
      width: 2px;
      height: 2px;
      border-radius: 50%;
      background: var(--ink3);
      opacity: 0.55;
    }
  }

  .row {
    display: flex;
    align-items: center;
    margin-top: auto;
    padding-top: 11px;
    border-top: 1px solid var(--line);
  }
}

.price {
  font-family: var(--font-serif);
  font-variant-numeric: lining-nums tabular-nums;
  font-size: 16px;
  color: var(--ink);

  em {
    font-style: normal;
    font-size: 11.5px;
    color: var(--ink3);
    margin-right: 1px;
  }

  &.free {
    color: var(--free);
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 500;
  }
}

.badge {
  font-size: 11px;
  color: var(--ink3);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 1px 6px;
  margin-left: auto;
}
</style>
