<!-- 探索页 · 专题路径
     一条线 = 课程起点 + 若干知识卡节点，点线而不是封面大图。
     与首页 TopicCard 的区别：首页是「挑一个专题」，这里是「看清这条路怎么走」。 -->
<template>
  <div class="prow" @click="$emit('open', topic)">
    <div class="l">
      <div class="no">{{ topic.no }}</div>
      <div class="txt">
        <div class="t">{{ topic.title }}</div>
        <div class="m">{{ topic.desc }}</div>
      </div>
    </div>

    <div class="rail">
      <span class="node start"></span>
      <span class="link"></span>
      <template v-for="(c, i) in topic.cards" :key="c">
        <span class="node"></span>
        <span class="link" v-if="i < topic.cards.length - 1"></span>
      </template>
      <span class="cnt">{{ topic.course ? '课程起点' : '' }} · 共 {{ topic.cards.length + 1 }} 步</span>
    </div>

    <span class="go">开始这条线 →</span>
  </div>
</template>
<script setup>
defineProps({
  topic: { type: Object, required: true }
})
defineEmits(['open'])
</script>
<style lang="scss" scoped>
.prow {
  display: grid;
  grid-template-columns: 300px 1fr 120px;
  align-items: center;
  gap: 24px;
  padding: 16px 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.18s;

  & + .prow {
    border-top: 1px dashed var(--line);
  }

  &:hover {
    background: var(--paper);

    .go {
      color: var(--main);
    }

    .node.start {
      box-shadow: 0 0 0 4px var(--main-soft);
    }
  }

  .l {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    min-width: 0;
  }

  .no {
    font-size: 11px;
    color: var(--main);
    background: var(--main-soft);
    border-radius: 5px;
    padding: 2px 7px;
    font-variant-numeric: tabular-nums;
    flex: none;
    margin-top: 1px;
  }

  .t {
    font-size: 14.5px;
    font-weight: 500;
    color: var(--ink);
    line-height: 1.45;
  }

  .m {
    font-size: 12px;
    color: var(--ink3);
    margin-top: 4px;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .rail {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .node {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--main) 45%, var(--line));
    flex: none;
    transition: 0.2s var(--ease-out);

    &.start {
      width: 9px;
      height: 9px;
      background: var(--main);
      border-color: var(--main);
    }
  }

  .link {
    flex: 1;
    min-width: 14px;
    height: 1px;
    background: var(--line-strong);
    margin: 0 6px;
  }

  .cnt {
    font-size: 11.5px;
    color: var(--ink3);
    margin-left: 14px;
    white-space: nowrap;
    flex: none;
  }

  .go {
    font-size: 12.5px;
    color: var(--ink3);
    text-align: right;
    transition: color 0.18s;
    white-space: nowrap;
  }
}
</style>
