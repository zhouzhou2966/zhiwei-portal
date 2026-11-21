<!-- 概览 · 学习报告摘要（3 个数字 + 近 30 天迷你柱）
     数据：learning-records/summary?days=30（与报告页同一接口，这里是 30 天窗口）。
     和学习报告页的分工：概览只给结论数字，明细都在报告页。 -->
<template>
  <div class="reportStrip" v-if="status === 'ok'">
    <div class="rsNums">
      <div>
        <b>{{ total }}</b>
        <i>累计学习（节）</i>
      </div>
      <div>
        <b>{{ activeDays }}</b>
        <i>活跃天数（天）</i>
      </div>
      <div>
        <b>{{ longest }}</b>
        <i>最长连续（天）</i>
      </div>
    </div>
    <div class="rsSpark" v-if="daily.length">
      <div class="rsBars">
        <i v-for="(d, i) in daily" :key="i" :class="lvClass(d)"
           :style="{ height: barH(d) + 'px' }" :title="`${d.statDate} · ${d.finished || 0} 节`"></i>
      </div>
      <p><span>近 30 天 · 每天完成的小节</span><span>少 → 多</span></p>
    </div>
    <span class="rsGo" @click="$router.push({ name: 'learningReport' })">完整报告 →</span>
  </div>

  <div class="rsState" v-else-if="status === 'error'">
    <InlineError title="学习数据加载失败" :msg="errorMsg" @retry="load" />
  </div>
  <div class="rsState" v-else>
    <span class="rsTip fadeInDelay">正在加载…</span>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { getLearningSummary } from '@/api/learningStat'
import { errMsg, catchMsg } from '@/utils/request'
import InlineError from '@/components/InlineError.vue'

const summary = ref({})
const status = ref('loading')
const errorMsg = ref('')

const load = async () => {
  status.value = 'loading'
  try {
    const res = await getLearningSummary(30)
    if (res.code == 200 && res.data) {
      summary.value = res.data
      status.value = 'ok'
      return
    }
    // 网关 code:0（后端没上）按空态处理，不报错
    errorMsg.value = errMsg(res, '学习数据加载失败')
    status.value = res && res.code == 0 ? 'ok' : 'error'
    if (status.value === 'ok') summary.value = {}
  } catch (err) {
    errorMsg.value = catchMsg(err, '学习数据加载失败') || '请稍后重试'
    status.value = 'error'
  }
}
onMounted(load)

const daily = computed(() => summary.value.daily || [])
const total = computed(() => Number(summary.value.totalSections) || 0)
const activeDays = computed(() => Number(summary.value.activeDays) || 0)

// 最长连续：summary 是「每天一行、按天补 0」，数连续 finished>0 的最长段
const longest = computed(() => {
  let best = 0
  let cur = 0
  daily.value.forEach((d) => {
    if ((Number(d.finished) || 0) > 0) {
      cur += 1
      best = Math.max(best, cur)
    } else {
      cur = 0
    }
  })
  return best
})

const maxFinished = computed(() => Math.max(1, ...daily.value.map(d => Number(d.finished) || 0)))
const barH = (d) => {
  const v = Number(d.finished) || 0
  if (v <= 0) return 2
  return Math.max(6, Math.round(v / maxFinished.value * 46))
}
const lvClass = (d) => {
  const v = Number(d.finished) || 0
  if (v <= 0) return ''
  if (v >= maxFinished.value) return 'v2'
  return 'v'
}
</script>
<style lang="scss" scoped>
.reportStrip {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 34px;
}
.rsNums {
  display: flex;
  gap: 40px;
  flex: none;
  div {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  b {
    font-family: var(--font-serif);
    font-variant-numeric: lining-nums;
    font-size: 28px;
    font-weight: 400;
    line-height: 1.1;
    color: var(--ink);
  }
  i {
    font-style: normal;
    font-size: 12px;
    color: var(--ink3);
  }
}
.rsSpark {
  flex: 1;
  min-width: 0;
}
.rsBars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 48px;
  i {
    flex: 1;
    min-width: 3px;
    border-radius: 2px 2px 0 0;
    background: #EDF1F4;
    min-height: 2px;
    &.v {
      background: #A3BFD0;
    }
    &.v2 {
      background: var(--main);
    }
  }
}
.rsSpark p {
  margin-top: 9px;
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--ink3);
}
.rsGo {
  flex: none;
  height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--ink2);
  font-size: 12.5px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  &:hover {
    color: var(--main);
    border-color: var(--main);
  }
}
.rsState {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  > .inlineErr {
    flex: 1;
    align-self: stretch;
  }
}
.rsTip {
  font-size: 13px;
  color: var(--ink3);
}
</style>
