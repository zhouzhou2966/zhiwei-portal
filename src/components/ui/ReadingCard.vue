<!-- 探索页 · 知识卡阅读条
     与首页的方块卡区分：这里是「双列阅读流」，一行一条，
     左侧领域色带 + 摘要 + 要点，扫读时视线是横向的，不是挑封面。 -->
<template>
  <article class="rcard" :style="{ '--k': color }" @click="$emit('open', card)">
    <span class="band"></span>
    <div class="head">
      <span class="kind">{{ kindLabel }}</span>
      <span class="meta">{{ card.read }}</span>
    </div>
    <h4>{{ card.title }}</h4>
    <p>{{ card.summary }}</p>
    <ul v-if="card.bullets && card.bullets.length">
      <li v-for="(b, i) in card.bullets.slice(0, 2)" :key="i">{{ b }}</li>
    </ul>
    <div class="foot">
      <span>{{ card.saves }}</span>
      <span v-if="card.course" class="course" @click.stop="$emit('course', card.course)">
        关联课程 · {{ card.course }} →
      </span>
      <span v-else class="read">读一读 →</span>
    </div>
  </article>
</template>
<script setup>
import { computed } from 'vue'
import { DOMAIN_COLORS } from '@/mock/knowledge'

const props = defineProps({
  card: { type: Object, required: true }
})
defineEmits(['open', 'course'])

const color = computed(() => DOMAIN_COLORS[props.card.domain] || DOMAIN_COLORS.it)
const kindLabel = computed(() =>
  props.card.kind === 'qa' ? `问答 · ${props.card.tag}` : `知识卡 · ${props.card.tag}`
)
</script>
<style lang="scss" scoped>
.rcard {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  padding: 16px 20px 14px 22px;
  cursor: pointer;
  transition: 0.22s var(--ease-out);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &:hover {
    border-color: color-mix(in srgb, var(--k) 38%, var(--line));
    box-shadow: var(--shadow-2);

    h4 {
      color: var(--main);
    }

    .band {
      width: 5px;
    }
  }

  .band {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--k);
    transition: width 0.22s var(--ease-out);
  }

  .head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .kind {
    font-size: 11px;
    letter-spacing: 0.6px;
    color: var(--k);
    background: color-mix(in srgb, var(--k) 10%, #fff);
    border-radius: 999px;
    padding: 2px 10px;
    font-weight: 500;
  }

  .meta {
    font-size: 11.5px;
    color: var(--ink3);
    margin-left: auto;
  }

  h4 {
    font-size: 15.5px;
    font-weight: 600;
    line-height: 1.5;
    margin: 10px 0 6px;
    color: var(--ink);
    transition: color 0.18s;
    letter-spacing: -0.1px;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.75;
    color: var(--ink2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 8px 0 0;

    li {
      position: relative;
      padding-left: 12px;
      font-size: 12px;
      line-height: 1.9;
      color: var(--ink3);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

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
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: auto;
    padding-top: 12px;
    font-size: 11.5px;
    color: var(--ink3);

    .course {
      margin-left: auto;
      max-width: 62%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--ink2);
      transition: color 0.18s;

      &:hover {
        color: var(--main);
      }
    }

    .read {
      margin-left: auto;
      color: var(--ink2);
    }
  }
}
</style>
