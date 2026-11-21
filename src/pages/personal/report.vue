<!-- 学习报告（学习中心 · v2）
     数据：learning-records/summary（按天聚合，后端补 0）+ exams/page（均分/趋势）
          + lessons/page（完成课程数 / 课程投入分布，前端算）。
     时间范围 30/90 天落 URL query，刷新不丢。 -->
<template>
  <div class="rpWrap">
    <header class="rpHead">
      <div>
        <h1>学习报告</h1>
        <p>近 {{ days }} 天 · 完成小节按天聚合，目标口径按当前周计划</p>
      </div>
      <div class="rpRange">
        <span :class="{ on: days === 30 }" @click="setDays(30)">近 30 天</span>
        <span :class="{ on: days === 90 }" @click="setDays(90)">近 90 天</span>
      </div>
    </header>

    <!-- 无数据：不摆一排 0 假装有报告 -->
    <div class="rpEmpty" v-if="status === 'ok' && isEmpty">
      <p>还没有足够的学习数据</p>
      <span>学完一节再来看，活跃度和趋势就有内容了</span>
    </div>

    <template v-else-if="status === 'ok'">
      <!-- KPI -->
      <div class="rpKpis">
        <div class="rpKpi">
          <span class="kLabel">累计学习</span>
          <b>{{ totalSections }}<em>节</em></b>
          <span class="kSub">{{ days }} 天内完成</span>
        </div>
        <div class="rpKpi">
          <span class="kLabel">活跃天数</span>
          <b>{{ activeDays }}<em>天</em></b>
          <span class="kSub">最长连续 {{ longest }} 天</span>
        </div>
        <div class="rpKpi">
          <span class="kLabel">完成课程</span>
          <b>{{ finishedCourses }}<em>门</em></b>
          <span class="kSub">在学 {{ learningCourses }} 门</span>
        </div>
        <div class="rpKpi">
          <span class="kLabel">考试均分</span>
          <b>{{ examAvg == null ? '-' : examAvg }}<em>分</em></b>
          <span class="kSub">共 {{ examCount }} 次 · 最高 {{ examMax == null ? '-' : examMax }}</span>
        </div>
      </div>

      <!-- 01 活跃度 -->
      <section class="rpSec">
        <SectionHead index="01" title="学习活跃度" subtitle="每天完成的小节，一周一列" />
        <div class="rpHeatWrap">
          <div class="rpHeat">
            <div class="hm" :style="{ gridTemplateColumns: `repeat(${cols}, 26px)` }">
              <span class="hmCell" v-for="(c, i) in cells" :key="i"
                    :class="'lv' + c.level" :title="`${c.date} · 完成 ${c.finished} 节`"></span>
            </div>
            <div class="hmFoot">
              <span>最近 {{ cols }} 周</span>
              <span class="hmLegend">
                少 <i class="lv0"></i><i class="lv1"></i><i class="lv2"></i><i class="lv3"></i><i class="lv4"></i> 多
              </span>
            </div>
          </div>
          <div class="rpSide">
            <div><span>区间完成</span><b>{{ totalSections }} 节</b></div>
            <div><span>日均</span><b>{{ avgPerDay }} 节</b></div>
            <div><span>最长连续</span><b>{{ longest }} 天</b></div>
            <div><span>活跃率</span><b>{{ activeRate }}%</b></div>
            <p class="rpTip">活跃率 = 有学习记录的天数 / 统计区间天数。没记录的日子是空格，不补成灰色。</p>
          </div>
        </div>
      </section>

      <!-- 02 周目标 -->
      <section class="rpSec">
        <SectionHead index="02" title="周目标达成" subtitle="最近 4 周，目标按当前周计划回看">
          <template #action>
            <span class="rpNote">达标 {{ hitCount }} / 4 周</span>
          </template>
        </SectionHead>
        <div class="rpWeeks" v-if="weekPlan > 0">
          <div class="rpWeek" v-for="(w, i) in weekBlocks" :key="i">
            <span class="wLabel">{{ w.label }}</span>
            <div class="wBar"><i :style="{ width: w.pct + '%' }"></i></div>
            <span class="wNum">{{ w.finished }} <em>/ {{ weekPlan }}</em></span>
            <span class="wHit" :class="{ on: w.finished >= weekPlan }">
              {{ w.finished >= weekPlan ? '达成' : (i === weekBlocks.length - 1 ? '本周' : '未达成') }}
            </span>
          </div>
          <p class="rpWeekTip">最近 4 周达标 {{ hitCount }} / 4 周 · 目标来自「我的课程」里设定的每周学习计划</p>
        </div>
        <div class="rpEmptyBlock" v-else>还没有设定每周目标，在「我的课程」里给课程定个每周目标吧</div>
      </section>

      <!-- 03 考试趋势 -->
      <section class="rpSec">
        <SectionHead index="03" title="考试分数趋势" subtitle="最近 8 次，虚线是均分">
          <template #action>
            <span class="rpNote">共 {{ examCount }} 次考试</span>
          </template>
        </SectionHead>
        <div class="rpTrend" v-if="trendBars.length > 0">
          <div class="trendChart">
            <div class="avgLine" v-if="examAvg != null" :style="{ bottom: avgLineY + 'px' }"></div>
            <div class="tc" v-for="(b, i) in trendBars" :key="i" :class="{ last: i === trendBars.length - 1 }">
              <span class="tv">{{ b.score }}</span>
              <div class="tb" :style="{ height: b.pct + '%' }"></div>
              <span class="td">{{ b.date }}</span>
            </div>
          </div>
          <div class="trendSide">
            <div><span>均分</span><b>{{ examAvg == null ? '-' : examAvg }}</b></div>
            <div><span>最高</span><b>{{ examMax == null ? '-' : examMax }}</b></div>
            <div><span>最近</span><b>{{ examLatest == null ? '-' : examLatest }}</b></div>
          </div>
        </div>
        <div class="rpEmptyBlock" v-else>还没有考试记录</div>
      </section>

      <!-- 04 课程投入分布 -->
      <section class="rpSec">
        <SectionHead index="04" title="课程投入分布" subtitle="按已学小节排序，浅色是还没学的部分">
          <template #action>
            <span class="rpNote" @click="$router.push({ name: 'myClass' })">去我的课程 →</span>
          </template>
        </SectionHead>
        <div class="rpDist" v-if="dist.length > 0">
          <div class="dr" v-for="c in dist" :key="c.id">
            <span class="dName" :title="c.name">{{ c.name }}</span>
            <div class="dBar"><i :style="{ width: c.pct + '%' }"></i></div>
            <span class="dNum"><b>{{ c.learned }}</b> / {{ c.sections }} 节</span>
          </div>
        </div>
        <div class="rpEmptyBlock" v-else>还没有在学的课程</div>
      </section>
    </template>

    <div class="rpState" v-else-if="status === 'error'">
      <InlineError title="学习报告加载失败" :msg="errorMsg" @retry="load" />
    </div>
    <div class="rpState" v-else>
      <span class="rpLoadTip fadeInDelay">正在加载…</span>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLearningSummary } from '@/api/learningStat'
import { getExamList, getMylessons } from '@/api/class.js'
import { dayjs } from '@/utils/date'
import { errMsg, catchMsg } from '@/utils/request'
import { useClassOverview } from './useClassOverview'
import SectionHead from '@/components/ui/SectionHead.vue'
import InlineError from '@/components/InlineError.vue'

const route = useRoute()
const router = useRouter()
// 周目标来自 useClassOverview（壳层已 ensureOverview，这里直接读）
const overview = useClassOverview()

const days = ref(Number(route.query.days) === 90 ? 90 : 30)
const setDays = (d) => {
  days.value = d
  // 落 URL query：分享/刷新不丢。用 replace 不产生多余历史记录
  router.replace({ query: { ...route.query, days: d === 30 ? undefined : d } })
}
watch(() => route.query.days, (v) => {
  const d = Number(v) === 90 ? 90 : 30
  if (d !== days.value) {
    days.value = d
    load()
  }
})

const summary = ref({})
const examList = ref([])
const lessons = ref([])
const status = ref('loading')
const errorMsg = ref('')

const load = async () => {
  status.value = 'loading'
  try {
    // 三个数据源并发、互不依赖；单个挂了用兜底值，不让整页变错误卡
    const [sumRes, examRes, lessonRes] = await Promise.all([
      getLearningSummary(days.value),
      getExamList({ pageNo: 1, pageSize: 100 }),
      getMylessons({ pageNo: 1, pageSize: 100 }),
    ])
    if (sumRes.code == 200 && sumRes.data) summary.value = sumRes.data
    if (examRes.code == 200 && examRes.data) examList.value = examRes.data.list || []
    if (lessonRes.code == 200 && lessonRes.data) lessons.value = lessonRes.data.list || []
    status.value = 'ok'
  } catch (err) {
    errorMsg.value = catchMsg(err, '学习报告加载失败') || '请稍后重试'
    status.value = 'error'
  }
}
onMounted(load)

const isEmpty = computed(() =>
  (Number(summary.value.totalSections) || 0) === 0 && examList.value.length === 0)

const totalSections = computed(() => Number(summary.value.totalSections) || 0)
const activeDays = computed(() => Number(summary.value.activeDays) || 0)
const avgPerDay = computed(() => {
  const n = Number(summary.value.activeDays) || 0
  if (!n) return 0
  return Math.round(totalSections.value / days.value * 100) / 100
})
const activeRate = computed(() => {
  const n = Number(summary.value.activeDays) || 0
  if (!n) return 0
  return Math.round(n / days.value * 1000) / 10
})

/** 热力图：daily 按天升序（后端补 0），列 = 周，节数分 5 档 */
const cells = computed(() => (summary.value.daily || []).map((d) => {
  const n = Number(d.finished) || 0
  let level = 0
  if (n === 1) level = 1
  else if (n === 2) level = 2
  else if (n >= 3 && n <= 4) level = 3
  else if (n >= 5) level = 4
  return { date: d.statDate, finished: n, level }
}))
const cols = computed(() => Math.max(1, Math.ceil(cells.value.length / 7)))

/** 最长连续：数连续有记录（finished>0）的最长段 */
const longest = computed(() => {
  let best = 0
  let cur = 0
  cells.value.forEach((c) => {
    if (c.finished > 0) {
      cur += 1
      best = Math.max(best, cur)
    } else {
      cur = 0
    }
  })
  return best
})

/** 完成 / 在学课程数 */
const finishedCourses = computed(() => lessons.value.filter(l => Number(l.status) === 2).length)
const learningCourses = computed(() => lessons.value.filter(l => [0, 1].includes(Number(l.status))).length)

/** 考试：均分 / 最高 / 最近 */
const scoredExams = computed(() => examList.value.filter(e => e.score != null))
const examCount = computed(() => examList.value.length)
const examAvg = computed(() => {
  if (!scoredExams.value.length) return null
  const sum = scoredExams.value.reduce((s, e) => s + (Number(e.score) || 0), 0)
  return Math.round(sum / scoredExams.value.length * 10) / 10
})
const examMax = computed(() => {
  if (!scoredExams.value.length) return null
  return Math.max(...scoredExams.value.map(e => Number(e.score) || 0))
})
const examLatest = computed(() => (scoredExams.value.length ? scoredExams.value[0].score : null))

const weekPlan = computed(() => Number(overview.weekPlan) || 0)

/**
 * 最近 4 周（滚动 7 天块，不含今天，往前推）：把 daily 切成 4 块。
 * 目标统一用当前周计划 —— 后端只有「本周」一个计划口径，历史周没有快照，
 * 拿今天的计划回看历史是现有数据下唯一诚实的做法。
 */
const weekBlocks = computed(() => {
  const daily = summary.value.daily || []
  if (daily.length === 0 || weekPlan.value <= 0) return []
  const blocks = []
  for (let b = 3; b >= 0; b -= 1) {
    const start = daily.length - (b + 1) * 7
    const rows = daily.slice(Math.max(0, start), daily.length - b * 7)
    const finished = rows.reduce((s, r) => s + (Number(r.finished) || 0), 0)
    const first = rows[0]
    const last = rows[rows.length - 1]
    blocks.push({
      label: first && last
        ? `${dayjs(first.statDate).format('M/D')} - ${dayjs(last.statDate).format('M/D')}`
        : '-',
      finished,
      pct: weekPlan.value > 0 ? Math.min(100, Math.round(finished / weekPlan.value * 100)) : 0,
    })
  }
  return blocks
})
const hitCount = computed(() => weekBlocks.value.filter(w => w.finished >= weekPlan.value).length)

/** 考试趋势：最近 8 次（接口倒序，反转成时间正序），最后一根主色高亮 */
const trendBars = computed(() => {
  const scored = examList.value.filter(e => e.score != null).slice(0, 8).reverse()
  return scored.map(e => ({
    score: e.score,
    date: e.finishTime || e.commitTime ? dayjs(e.finishTime || e.commitTime).format('M/D') : '',
    pct: Math.max(2, Math.min(100, Number(e.score) || 0)),
  }))
})
// 均分虚线：柱区高 150px，按 100 分折算
const avgLineY = computed(() => {
  if (examAvg.value == null) return 0
  return Math.round(Math.max(0, Math.min(100, examAvg.value)) / 100 * 150)
})

/** 课程投入分布：按已学小节降序，取前 6 门 */
const dist = computed(() => {
  const rows = lessons.value
    .filter(l => Number(l.sections) > 0)
    .map((l) => {
      const total = Number(l.sections) || 0
      const learned = Math.min(Number(l.learnedSections) || 0, total)
      return {
        id: l.id || l.courseId,
        name: l.courseName || '课程',
        learned,
        sections: total,
        pct: Math.round(learned / total * 100),
      }
    })
    .sort((a, b) => b.learned - a.learned)
  return rows.slice(0, 6)
})
</script>
<style lang="scss" scoped>
.rpHead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 24px;
  h1 {
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -.4px;
    color: var(--ink);
  }
  p {
    margin-top: 7px;
    font-size: 13px;
    color: var(--ink3);
  }
}
.rpRange {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 999px;
  flex: none;
  span {
    height: 30px;
    padding: 0 16px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    font-size: 12.5px;
    color: var(--ink2);
    cursor: pointer;
    &.on {
      background: var(--main);
      color: #fff;
    }
  }
}

/* KPI */
.rpKpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}
.rpKpi {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  .kLabel {
    font-size: 12.5px;
    color: var(--ink3);
  }
  b {
    font-family: var(--font-serif);
    font-variant-numeric: lining-nums;
    font-size: 34px;
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -1px;
    color: var(--ink);
    em {
      font-style: normal;
      font-family: var(--font-sans);
      font-size: 12.5px;
      color: var(--ink3);
      margin-left: 6px;
      letter-spacing: 0;
    }
  }
  .kSub {
    font-size: 11.5px;
    color: var(--ink3);
  }
}

.rpSec {
  margin-top: 44px;
}
.rpNote {
  font-size: 12.5px;
  color: var(--ink3);
  cursor: pointer;
}

/* 01 热力 */
.rpHeatWrap {
  display: grid;
  /* 卡宽跟格子走：30 天只有 5 列，把热力图拉满整行会变成一堆大色块 */
  grid-template-columns: auto 1fr;
  gap: 20px;
  align-items: stretch;
}
.rpHeat {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 24px 26px;
  width: fit-content;
}
.hm {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, 26px);
  gap: 6px;
}
.hmCell {
  width: 26px;
  height: 26px;
  border-radius: 5px;
  background: #EEF2F5;
  &.lv1 { background: #CFDDE6; }
  &.lv2 { background: #A3BFD0; }
  &.lv3 { background: #5F8BA7; }
  &.lv4 { background: var(--main); }
}
.hmFoot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  font-size: 11.5px;
  color: var(--ink3);
}
.hmLegend {
  display: flex;
  align-items: center;
  gap: 5px;
  i {
    width: 11px;
    height: 11px;
    border-radius: 2px;
    display: block;
    background: #EEF2F5;
    &.lv1 { background: #CFDDE6; }
    &.lv2 { background: #A3BFD0; }
    &.lv3 { background: #5F8BA7; }
    &.lv4 { background: var(--main); }
  }
}
.rpSide {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 22px 26px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 40px;
  align-content: start;
  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 0;
    border-bottom: 1px dashed var(--line);
    span {
      font-size: 12.5px;
      color: var(--ink3);
    }
    b {
      font-family: var(--font-serif);
      font-variant-numeric: lining-nums;
      font-size: 22px;
      font-weight: 400;
      color: var(--ink);
    }
    &:nth-last-of-type(-n + 2) {
      border-bottom: none;
    }
  }
}
.rpTip {
  grid-column: 1 / -1;
  margin-top: 8px;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--ink3);
}

/* 02 周目标 */
.rpWeeks {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 10px 26px 18px;
}
.rpWeek {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 13px 0;
  border-bottom: 1px dashed var(--line);
  &:last-of-type {
    border-bottom: none;
  }
}
.wLabel {
  width: 116px;
  flex: none;
  font-size: 12.5px;
  color: var(--ink2);
}
.wBar {
  flex: 1;
  height: 7px;
  border-radius: 4px;
  background: var(--paper2);
  overflow: hidden;
  i {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--main);
  }
}
.wNum {
  width: 66px;
  flex: none;
  text-align: right;
  font-family: var(--font-serif);
  font-size: 14px;
  color: var(--ink);
  em {
    font-style: normal;
    font-size: 12px;
    color: var(--ink3);
  }
}
.wHit {
  width: 64px;
  flex: none;
  text-align: right;
  font-size: 12px;
  color: var(--ink3);
  &.on {
    color: var(--free);
    font-weight: 500;
  }
}
.rpWeekTip {
  padding-top: 12px;
  font-size: 12px;
  color: var(--ink3);
}

/* 03 趋势 */
.rpTrend {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 26px 26px 20px;
  display: flex;
  gap: 34px;
}
.trendChart {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 26px;
  height: 190px;
  position: relative;
  padding-top: 14px;
}
.avgLine {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed var(--line-strong);
}
.tc {
  flex: 1;
  max-width: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  .tv {
    font-family: var(--font-serif);
    font-size: 12.5px;
    color: var(--ink2);
    margin-bottom: 7px;
  }
  .tb {
    width: 40px;
    border-radius: 5px 5px 0 0;
    background: #C8D8E2;
  }
  .td {
    margin-top: 9px;
    font-size: 11.5px;
    color: var(--ink3);
  }
  &.last .tb {
    background: var(--main);
  }
  &.last .tv {
    color: var(--main);
    font-weight: 600;
  }
}
.trendSide {
  width: 200px;
  flex: none;
  border-left: 1px solid var(--line);
  padding-left: 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  span {
    font-size: 12.5px;
    color: var(--ink3);
  }
  b {
    font-family: var(--font-serif);
    font-variant-numeric: lining-nums;
    font-size: 20px;
    font-weight: 400;
    color: var(--ink);
  }
}

/* 04 投入分布 */
.rpDist {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 12px 26px 20px;
}
.dr {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 13px 0;
  border-bottom: 1px dashed var(--line);
  &:last-child {
    border-bottom: none;
  }
}
.dName {
  width: 300px;
  flex: none;
  font-size: 13px;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dBar {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--paper2);
  overflow: hidden;
  i {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: var(--main);
  }
}
.dNum {
  width: 96px;
  flex: none;
  text-align: right;
  font-size: 12.5px;
  color: var(--ink3);
  b {
    font-family: var(--font-serif);
    font-size: 15px;
    font-weight: 400;
    color: var(--ink);
  }
}

.rpEmptyBlock {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 46px 24px;
  text-align: center;
  font-size: 13px;
  color: var(--ink3);
}
.rpEmpty {
  background: #fff;
  border: 1px dashed var(--line-strong);
  border-radius: 16px;
  padding: 80px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  p {
    font-size: 13.5px;
    color: var(--ink2);
  }
  span {
    font-size: 12px;
    color: var(--ink3);
  }
}
.rpState {
  min-height: 320px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  > .inlineErr {
    flex: 1;
    align-self: stretch;
  }
}
.rpLoadTip {
  font-size: 13px;
  color: var(--ink3);
}
@media (max-width: 1200px) {
  .rpKpis {
    grid-template-columns: repeat(2, 1fr);
  }
  .rpHeatWrap,
  .rpTrend {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
  .trendSide {
    border-left: none;
    border-top: 1px solid var(--line);
    padding-left: 0;
    padding-top: 16px;
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
