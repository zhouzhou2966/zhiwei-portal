<!-- 专题卡 · v40 视觉稿 .topic
     顶部色带条代替实拍图（专题不落库、无图源）：
     同一靛蓝罩色家族 + 领域色渐变，三张并排视觉同源。 -->
<template>
  <div class="topic" @click="$emit('open', topic)">
    <div class="tcover" :style="{ background: gradient }">
      <span class="cno">{{ topic.no }}</span>
    </div>
    <span class="no">专题 · {{ topic.no }}</span>
    <h4>{{ topic.title }}</h4>
    <div class="meta zw-clamp-2">{{ topic.desc }}</div>
    <div class="mix">
      <b v-for="(m, i) in topic.mix" :key="i" :class="{ hl: i === 0 }">{{ m }}</b>
    </div>
    <div class="pct">
      <span>含课程：{{ topic.course }}</span>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'

const props = defineProps({
  topic: { type: Object, required: true }
})
defineEmits(['open'])

// 三条专题用同家族的靛蓝系渐变，只有倾角与深浅差异
const GRADIENTS = {
  tp01: 'linear-gradient(135deg, #1B4B6B 0%, #4A7089 60%, #7A95A9 100%)',
  tp02: 'linear-gradient(135deg, #17415C 0%, #31505F 65%, #4A7089 100%)',
  tp03: 'linear-gradient(135deg, #23455C 0%, #1B4B6B 55%, #2E6E96 100%)'
}

const gradient = computed(() => GRADIENTS[props.topic.id] || GRADIENTS.tp01)
</script>
<style lang="scss" scoped>
.topic {
  padding: 18px 18px 16px;
  cursor: pointer;
  transition: 0.22s var(--ease-out);
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    border-color: var(--line-strong);
    box-shadow: 0 10px 26px rgba(26, 29, 33, 0.07);
  }

  .tcover {
    margin: -18px -18px 14px;
    height: 72px;
    position: relative;

    .cno {
      position: absolute;
      right: 14px;
      bottom: 8px;
      font-family: var(--font-serif);
      font-variant-numeric: lining-nums;
      font-size: 26px;
      color: rgba(243, 238, 226, 0.55);
    }
  }

  .no {
    font-family: var(--font-serif);
    font-variant-numeric: lining-nums;
    font-size: 11px;
    color: var(--ink3);
    letter-spacing: 1px;
  }

  h4 {
    font-size: 16px;
    font-weight: 600;
    margin: 8px 0 4px;
    color: var(--ink);
  }

  .meta {
    font-size: 12px;
    color: var(--ink3);
    line-height: 1.7;
  }

  .mix {
    display: flex;
    gap: 5px;
    margin-top: 10px;

    b {
      font-size: 10.5px;
      font-weight: 400;
      color: var(--ink3);
      border: 1px solid var(--line);
      border-radius: 4px;
      padding: 1px 6px;

      &.hl {
        color: var(--accent);
        border-color: #ebd9bb;
        background: var(--accent-soft);
      }
    }
  }

  .pct {
    font-size: 11px;
    color: var(--ink3);
    margin-top: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
