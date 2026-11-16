<!-- 知识卡 · v40 视觉稿 .kcard
     彩色渐变底（color-mix 领域色 9%）+ 左侧领域色带 + 领域色胶囊标签。
     kind=qa 渲染为问答形态（回复数/更新时间），否则为知识卡形态（时长/收藏）。 -->
<template>
  <div class="kcard" :style="{ '--k': color }">
    <span class="band"></span>
    <span class="kind">{{ kindLabel }}</span>
    <h4 class="zw-clamp-2">{{ card.title }}</h4>
    <p class="zw-clamp-2">{{ card.summary }}</p>
    <ul v-if="card.bullets && card.bullets.length">
      <li v-for="(b, i) in card.bullets" :key="i">{{ b }}</li>
    </ul>
    <div class="foot">
      <template v-if="card.kind === 'qa'">
        <span>{{ card.replies }} 条回复</span>
        <span>·</span>
        <span>{{ card.updated }}</span>
        <span class="go">看讨论 →</span>
      </template>
      <template v-else>
        <span>{{ card.read }}</span>
        <span>·</span>
        <span>{{ card.saves }}</span>
        <span class="go">读一读 →</span>
      </template>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { DOMAIN_COLORS } from '@/mock/knowledge'

const props = defineProps({
  card: { type: Object, required: true }
})

const color = computed(() => DOMAIN_COLORS[props.card.domain] || DOMAIN_COLORS.it)

const kindLabel = computed(() => {
  if (props.card.kind === 'qa') return '问答 · 已解决'
  return `知识卡 · ${props.card.tag}`
})
</script>
<style lang="scss" scoped>
.kcard {
  background: linear-gradient(180deg, color-mix(in srgb, var(--k) 9%, #fff) 0%, #fff 44%);
  border: 1px solid color-mix(in srgb, var(--k) 22%, var(--line));
  border-radius: var(--radius-card);
  padding: 16px 16px 14px;
  cursor: pointer;
  transition: 0.22s var(--ease-out);
  display: flex;
  flex-direction: column;
  min-height: 246px;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--k) 40%, var(--line));
    box-shadow: 0 14px 30px rgba(26, 29, 33, 0.08);
  }

  .band {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--k), color-mix(in srgb, var(--k) 45%, #fff));
  }

  .kind {
    font-size: 11px;
    letter-spacing: 1px;
    color: var(--k);
    display: flex;
    align-items: center;
    gap: 7px;
    background: color-mix(in srgb, var(--k) 11%, #fff);
    border-radius: 999px;
    padding: 3px 11px 3px 8px;
    align-self: flex-start;
    font-weight: 500;

    &::before {
      content: '';
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--k);
    }
  }

  h4 {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
    margin: 13px 0 8px;
    letter-spacing: -0.1px;
    color: var(--ink);
  }

  p {
    font-size: 12.5px;
    color: var(--ink2);
    line-height: 1.8;
    margin: 0;
  }

  ul {
    list-style: none;
    margin: 9px 0 0;
    padding: 0;
    flex: 1;

    li {
      font-size: 12px;
      color: var(--ink3);
      line-height: 1.9;
      padding-left: 11px;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 9px;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: var(--k);
        opacity: 0.7;
      }
    }
  }

  .foot {
    margin-top: auto;
    padding-top: 14px;
    font-size: 11.5px;
    color: var(--ink3);
    display: flex;
    align-items: center;
    gap: 6px;
    border-top: 1px solid var(--line);

    .go {
      margin-left: auto;
      color: var(--ink2);
    }
  }
}
</style>
