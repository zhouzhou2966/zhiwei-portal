<!-- 探索页 · 笔记条目
     真实数据来自 GET /ls/notes/page?onlyMine=false（全局公开笔记，含作者名/头像），
     库里内容少时由页面传入「精选示例」，这里的渲染方式完全一致。 -->
<template>
  <div class="note" @click="$emit('open', note)">
    <div class="av">
      <img v-if="note.authorIcon" :src="note.authorIcon" alt="" @error="broken = true" />
      <span v-else>{{ initial }}</span>
    </div>
    <div class="body">
      <div class="who">
        <span class="name">{{ note.authorName || '知微学员' }}</span>
        <span class="dot">·</span>
        <span>{{ note.createTime || '刚刚' }}</span>
        <span class="at" v-if="note.noteMoment">视频 {{ moment }}</span>
      </div>
      <p>{{ note.content }}</p>
      <div class="from" v-if="note.courseName">《{{ note.courseName }}》</div>
    </div>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  note: { type: Object, required: true }
})
defineEmits(['open'])

const broken = ref(false)
const initial = computed(() => (props.note.authorName || '知').slice(0, 1))
// noteMoment 是笔记所在的视频秒数
const moment = computed(() => {
  const s = Number(props.note.noteMoment) || 0
  const m = Math.floor(s / 60)
  const sec = String(s % 60).padStart(2, '0')
  return `${String(m).padStart(2, '0')}:${sec}`
})
</script>
<style lang="scss" scoped>
.note {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  cursor: pointer;

  &:last-child {
    border-bottom: 0;
  }

  &:hover p {
    color: var(--ink);
  }

  .av {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--tint);
    display: grid;
    place-items: center;
    font-size: 12px;
    color: var(--ink2);
    flex: none;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .body {
    min-width: 0;
  }

  .who {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    color: var(--ink3);

    .name {
      color: var(--ink2);
      font-weight: 500;
    }

    .dot {
      opacity: 0.6;
    }

    .at {
      margin-left: auto;
      background: var(--paper);
      border-radius: 4px;
      padding: 1px 6px;
      font-variant-numeric: tabular-nums;
    }
  }

  p {
    margin: 6px 0 0;
    font-size: 13.5px;
    line-height: 1.7;
    color: var(--ink2);
    transition: color 0.18s;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .from {
    margin-top: 6px;
    font-size: 11.5px;
    color: var(--ink3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
