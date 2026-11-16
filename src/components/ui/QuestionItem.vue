<!-- 探索页 · 待解问题条目
     真实数据来自 GET /ls/questions/page（目前后端要求必须带 courseId，
     全局查询由页面按课程聚合后传入；回答数为 0 的排前面）。 -->
<template>
  <div class="q" @click="$emit('open', q)">
    <span class="st" :class="{ open: !q.answerTimes }">{{ q.answerTimes ? `${q.answerTimes} 回答` : '待解答' }}</span>
    <div class="body">
      <div class="t">{{ q.title }}</div>
      <div class="m">
        <span>{{ q.userName || '匿名同学' }}</span>
        <span class="dot">·</span>
        <span>{{ q.createTime || '刚刚' }}</span>
        <span class="ans" v-if="!q.answerTimes">我来答 →</span>
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps({
  q: { type: Object, required: true }
})
defineEmits(['open'])
</script>
<style lang="scss" scoped>
.q {
  display: flex;
  gap: 10px;
  padding: 13px 0;
  border-bottom: 1px solid var(--line);
  cursor: pointer;

  &:last-child {
    border-bottom: 0;
  }

  &:hover .t {
    color: var(--main);
  }

  .st {
    flex: none;
    font-size: 10.5px;
    line-height: 1.6;
    padding: 1px 7px;
    border-radius: 4px;
    height: fit-content;
    margin-top: 2px;
    color: var(--ink3);
    border: 1px solid var(--line);
    white-space: nowrap;

    &.open {
      color: var(--accent);
      border-color: color-mix(in srgb, var(--accent) 40%, var(--line));
      background: var(--accent-soft);
    }
  }

  .body {
    min-width: 0;
  }

  .t {
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--ink);
    transition: color 0.18s;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .m {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    color: var(--ink3);
    margin-top: 5px;

    .dot {
      opacity: 0.6;
    }

    .ans {
      margin-left: auto;
      color: var(--main);
      white-space: nowrap;
    }
  }
}
</style>
