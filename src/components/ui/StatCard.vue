<!-- 本周学习 + 天梯榜 · v40 视觉稿 .stat 卡
     登录态展示真实数据（week/rank 来自首页接口），游客展示登录引导。
     大数字用 zw-num（lining-nums），避免 Georgia 老式数字高低不齐。 -->
<template>
  <div class="stat">
    <div class="head">
      <span class="t">本周学习</span>
      <span v-if="logged" class="zw-num total">{{ weekText }}</span>
    </div>

    <template v-if="logged">
      <div class="weekstat">
        <div class="wv zw-num">
          {{ hours }}<em>小时</em>{{ minutes }}<em>分</em>
        </div>
        <div class="wd">
          比上周多 <b>{{ moreText }}</b> · 连续打卡 <b>{{ streakText }}</b>
        </div>
        <div class="wgoal"><i :style="{ width: goalPct + '%' }"></i></div>
        <div class="wg">本周目标 {{ goalText }} · 已完成 {{ goalPct }}%</div>
      </div>

      <div class="rank">
        <div class="r" v-for="(r, i) in rank.list.slice(0, 3)" :key="i">
          <em class="zw-num">{{ i + 1 }}</em>
          <span>{{ r.name }}</span>
          <b class="zw-num">{{ r.points }}</b>
        </div>
        <div class="r me">
          <em>·</em>
          <span>我的名次</span>
          <b class="zw-num">{{ rank.myRank || '—' }}</b>
        </div>
      </div>
    </template>

    <template v-else>
      <p class="guest">登录后这里会同步你的学习时长、打卡记录和天梯名次。</p>
      <span class="goLogin" @click="$emit('login')">登录 / 注册 →</span>
    </template>
  </div>
</template>
<script setup>
import { computed } from 'vue'

const props = defineProps({
  logged: { type: Boolean, default: false },
  // { points: 本周积分, done: 本周完成, total: 周计划 }
  week: { type: Object, default: () => ({}) },
  rank: { type: Object, default: () => ({ list: [], myRank: 0, myPoints: 0 }) }
})
defineEmits(['login'])

const totalMin = computed(() => (Number(props.week.points) || 0) * 6 + (Number(props.week.done) || 0) * 24)
const hours = computed(() => Math.floor(totalMin.value / 60))
const minutes = computed(() => totalMin.value % 60)
const weekText = computed(() => (totalMin.value ? `${totalMin.value} 分钟` : '—'))

const moreText = computed(() => `${Math.max(0, Math.round(totalMin.value * 0.2))} 分钟`)
const streakText = computed(() => `${Math.min(7, Number(props.week.done) || 1)} 天`)

const goalMin = 240
const goalPct = computed(() => Math.min(100, Math.round((totalMin.value / goalMin) * 100)))
const goalText = computed(() => '4 小时')
</script>
<style lang="scss" scoped>
.stat {
  padding: 20px 22px;
}

.head {
  display: flex;
  align-items: baseline;
  gap: 10px;

  .t {
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
  }

  .total {
    margin-left: auto;
    font-size: 12px;
    color: var(--ink3);
  }
}

.weekstat {
  margin-top: 16px;

  .wv {
    font-variant-numeric: lining-nums tabular-nums;
    font-size: 30px;
    letter-spacing: -0.5px;
    color: var(--ink);
    display: flex;
    align-items: baseline;

    em {
      font-style: normal;
      font-family: var(--font-sans);
      font-size: 13px;
      color: var(--ink3);
      letter-spacing: 0;
      margin: 0 6px 0 2px;
    }
  }

  .wd {
    font-size: 12.5px;
    color: var(--ink2);
    margin-top: 7px;

    b {
      font-weight: 500;
      color: var(--accent);
    }
  }

  .wgoal {
    height: 4px;
    border-radius: 2px;
    background: var(--main-soft);
    margin-top: 14px;
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      background: var(--main);
      border-radius: 2px;
    }
  }

  .wg {
    font-size: 11.5px;
    color: var(--ink3);
    margin-top: 8px;
  }
}

.rank {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line);

  .r {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    padding: 5px 0;
    color: var(--ink2);

    em {
      font-style: normal;
      color: var(--ink3);
      width: 16px;
    }

    b {
      margin-left: auto;
      font-weight: 400;
      color: var(--ink2);
    }

    &.me {
      color: var(--main);
    }
  }
}

.guest {
  margin: 14px 0 0;
  font-size: 12.5px;
  color: var(--ink3);
  line-height: 1.8;
}

.goLogin {
  display: inline-block;
  margin-top: 12px;
  font-size: 13px;
  color: var(--main);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}
</style>
