<!-- 探索页 · 四个门
     Spotify Browse 的做法：先用一排「门」把这一页有什么讲清楚，
     用户不用回忆课名，认得出来就能进。点击只做页内锚点跳转。 -->
<template>
  <div class="gates">
    <div class="gate" v-for="g in items" :key="g.key" @click="$emit('pick', g.key)">
      <span class="dot" :style="{ background: g.color }"></span>
      <div class="body">
        <div class="t">{{ g.title }}</div>
        <div class="m">{{ g.meta }}</div>
      </div>
      <span class="arrow">→</span>
    </div>
  </div>
</template>
<script setup>
defineProps({
  items: { type: Array, default: () => [] }
})
defineEmits(['pick'])
</script>
<style lang="scss" scoped>
.gates {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.gate {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  padding: 16px 16px 16px 15px;
  cursor: pointer;
  transition: 0.22s var(--ease-out);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--line-strong);
    box-shadow: var(--shadow-2);

    .arrow {
      color: var(--main);
      transform: translateX(2px);
    }
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: none;
  }

  .body {
    min-width: 0;
  }

  .t {
    font-size: 14px;
    font-weight: 500;
    color: var(--ink);
    letter-spacing: -0.1px;
  }

  .m {
    font-size: 11.5px;
    color: var(--ink3);
    margin-top: 3px;
  }

  .arrow {
    margin-left: auto;
    font-size: 13px;
    color: var(--ink3);
    transition: 0.22s var(--ease-out);
    flex: none;
  }
}
</style>
