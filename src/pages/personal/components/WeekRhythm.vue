<!-- 概览 · 本周节奏（7 天柱 + 日均目标虚线 + 右侧三个统计）
     数据：learning-records/summary?days=7（后端已补 0，最后一天是今天）。
     周目标来自 useClassOverview 单例，不重复请求。 -->
<template>
  <div class="weekRhythm" v-if="status === 'ok' && hasData">
    <div class="wrChart">
      <!-- 日均目标线：按「周目标 ÷ 7」折算到柱高比例。
           周目标不足 7 节时日均不到 1 节，这条线「日均目标 0.1 节」既看不懂也没有行动意义，
           对着空柱画一条 0.1 的虚线纯属噪音 —— 只在 perDay ≥ 1 时才显示 -->
      <div class="wrTarget" v-if="targetY > 0 && perDay >= 1" :style="{ bottom: targetY + 'px' }">
        <span>日均 {{ perDay }} 节</span>
      </div>
      <div class="wrCols">
        <div class="wrCol" v-for="(d, i) in daily" :key="d.statDate">
          <span class="wrV">{{ Number(d.sections) || '' }}</span>
          <div class="wrBar" :class="{ today: i === daily.length - 1 }"
               :style="{ height: barPx(d) + 'px' }"></div>
          <span class="wrD" :class="{ today: i === daily.length - 1 }">{{ dayLabel(d.statDate, i) }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 7 天全 0：不画空坐标轴 -->
  <div class="wrEmpty" v-else-if="status === 'ok'">
    <p>本周还没开始，从今天开始</p>
  </div>
  <div class="wrState" v-else-if="status === 'error'">
    <InlineError title="本周节奏加载失败" :msg="errorMsg" @retry="load" />
  </div>
  <div class="wrState" v-else>
    <span class="wrTip fadeInDelay">正在加载…</span>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { getLearningSummary } from '@/api/learningStat'
import { errMsg, catchMsg } from '@/utils/request'
import { dayjs } from '@/utils/date'
import { useClassOverview } from '../useClassOverview'
import InlineError from '@/components/InlineError.vue'

const overview = useClassOverview()
const daily = ref([])
const status = ref('loading')
const errorMsg = ref('')

const load = async () => {
  status.value = 'loading'
  try {
    const res = await getLearningSummary(7)
    if (res.code == 200 && res.data) {
      daily.value = res.data.daily || []
      status.value = 'ok'
      return
    }
    // 新接口返回 404 / 网关 code:0（后端没上）时按空态处理：模块显示但无数据，不报错
    errorMsg.value = errMsg(res, '本周节奏加载失败')
    status.value = res && res.code == 0 ? 'ok' : 'error'
    if (status.value === 'ok') daily.value = []
  } catch (err) {
    errorMsg.value = catchMsg(err, '本周节奏加载失败') || '请稍后重试'
    status.value = 'error'
  }
}
onMounted(load)

const hasData = computed(() => daily.value.some(d => (Number(d.sections) || 0) > 0))

// 柱高的分母是「当周最大值」而不是目标 —— 目标是虚线的事，柱子之间要能互相比较
const maxValue = computed(() => Math.max(0, ...daily.value.map(d => Number(d.sections) || 0)))
const BAR_MAX = 136
const barPx = (d) => {
  if (maxValue.value <= 0) return 3
  const v = Number(d.sections) || 0
  if (v <= 0) return 3
  return Math.max(6, Math.round(v / maxValue.value * BAR_MAX))
}

// 日均目标：周目标 ÷ 7，再折成柱区像素。折不出（目标 0 / 柱区为 0）就不画
const perDay = computed(() => {
  const plan = Number(overview.weekPlan) || 0
  if (plan <= 0) return 0
  return Math.round(plan / 7 * 10) / 10
})
const targetY = computed(() => {
  if (perDay.value <= 0 || maxValue.value <= 0) return 0
  const y = perDay.value / maxValue.value * BAR_MAX
  return y > BAR_MAX ? 0 : Math.round(y)
})

// 标签用真实星期（summary 是「最近 7 天」窗口，不是自然周），最后一天是今天
const dayLabel = (statDate, i) => {
  if (i === daily.value.length - 1) return '今日'
  return '周' + ['日', '一', '二', '三', '四', '五', '六'][dayjs(statDate).day()]
}
</script>
<style lang="scss" scoped>
.weekRhythm {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 22px 24px;
}
.wrChart {
  flex: 1;
  min-width: 0;
  position: relative;
  padding-top: 8px;
}
.wrCols {
  display: flex;
  align-items: flex-end;
  gap: 44px;
  height: 188px;
  padding-top: 6px;
}
.wrCol {
  flex: 1;
  max-width: 92px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}
.wrV {
  font-family: var(--font-serif);
  font-size: 13px;
  color: var(--ink2);
  height: 18px;
  margin-bottom: 8px;
}
.wrBar {
  width: 64px;
  border-radius: 8px 8px 0 0;
  background: #D5E2EA;
  min-height: 3px;
  &.today {
    background: var(--accent);
  }
}
.wrD {
  margin-top: 9px;
  font-size: 12px;
  color: var(--ink3);
  &.today {
    color: var(--accent);
    font-weight: 600;
  }
}
.wrTarget {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed var(--line-strong);
  margin-bottom: 26px;
  span {
    position: absolute;
    right: 0;
    top: -18px;
    font-size: 11px;
    color: var(--ink3);
    background: #fff;
    padding-left: 8px;
  }
}
.wrEmpty {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 46px 24px;
  text-align: center;
  font-size: 13px;
  color: var(--ink3);
}
.wrState {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  min-height: 232px;
  display: flex;
  align-items: center;
  justify-content: center;
  > .inlineErr {
    flex: 1;
    align-self: stretch;
  }
}
.wrTip {
  font-size: 13px;
  color: var(--ink3);
}
</style>
