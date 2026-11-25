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
    <!-- 迷你柱已移除：概览页同屏已有一张走势图（考试卡），
         两处迷你图表是「每个统计卡都配一张 sparkline」的 AI 味形态；
         这里只给结论数字，明细去报告页 -->
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

// 迷你柱已移除（概览页只留一张走势图），这里不再需要柱子高度换算
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
.rsGo {
  flex: none;
  margin-left: auto;
  height: 32px;
  padding: 0 16px;
  // 次要按钮 8px 圆角（主 CTA 才用 pill）
  border-radius: 8px;
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
