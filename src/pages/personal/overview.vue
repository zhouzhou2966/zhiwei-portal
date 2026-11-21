<!-- 学习概览（学习中心默认落地页 · v2）
     信息层级：先回答「现在学什么、今天做什么」，再给课程资产，最后是数据与推荐。
     每个模块自带三态、独立请求 —— 单个接口挂掉只影响自己那一块，父级不做编排。
     账号级数字（本周/连续/今日）读 useClassOverview 单例，壳层已 ensureOverview。 -->
<template>
  <div class="ovWrap">
    <header class="ovGreet">
      <div>
        <h1>{{ greeting }}，{{ userName }}</h1>
        <p>第 {{ weekNo }} 周 · {{ greetSub }}</p>
      </div>
      <div class="ovDate">{{ dateText }}</div>
    </header>

    <!-- 第一屏：继续学习 + 今日 -->
    <div class="ovTop">
      <ContinueHero />
      <TodayCard />
    </div>

    <section class="ovSec">
      <SectionHead index="01" title="本周节奏" subtitle="最近 7 天每天完成的小节，虚线是日均目标">
        <template #action>
          <span class="ovNote" v-if="overview.weekReady && overview.weekPlan > 0">
            目标 {{ overview.weekPlan }} 节 · 已完成 {{ overview.weekFinished }} 节
          </span>
        </template>
      </SectionHead>
      <WeekRhythm />
    </section>

    <section class="ovSec">
      <SectionHead index="02" title="在学课程" subtitle="最近在学的 3 门，点击卡片直接继续"
                   action="查看全部课程" @action="$router.push({ name: 'myClass' })" />
      <CourseShelf />
    </section>

    <section class="ovSec">
      <SectionHead index="03" title="今天要做的" subtitle="只列真正会影响进度和有效期的" />
      <div class="ovDuo">
        <TodoCard />
        <ExamCard />
      </div>
    </section>

    <section class="ovSec">
      <SectionHead index="04" title="我的笔记" subtitle="最近写下的 3 条，点开回到那一节"
                   action="全部笔记" @action="$router.push({ name: 'learningNotes' })" />
      <div class="ovDuo">
        <NotesCard />
        <RankCard />
      </div>
    </section>

    <section class="ovSec">
      <SectionHead index="05" title="学习报告" subtitle="近 30 天的三个关键数字，详细数据在报告页" />
      <div class="ovReportRow">
        <ReportStrip />
        <div class="ovAside">
          <p class="ovAsideTitle">接下来学</p>
          <RecoCard />
        </div>
      </div>
    </section>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store'
import { dayjs } from '@/utils/date'
import { useClassOverview } from './useClassOverview'
import SectionHead from '@/components/ui/SectionHead.vue'
import ContinueHero from './components/ContinueHero.vue'
import TodayCard from './components/TodayCard.vue'
import WeekRhythm from './components/WeekRhythm.vue'
import CourseShelf from './components/CourseShelf.vue'
import TodoCard from './components/TodoCard.vue'
import ExamCard from './components/ExamCard.vue'
import NotesCard from './components/NotesCard.vue'
import RankCard from './components/RankCard.vue'
import ReportStrip from './components/ReportStrip.vue'
import RecoCard from './components/RecoCard.vue'

const userStore = useUserStore()
const overview = useClassOverview()

const userInfo = computed(() => userStore.getUserInfo || {})
const userName = computed(() => userInfo.value.name || '同学')
const weekNo = dayjs().isoWeek()
const dateText = computed(() => dayjs().format('YYYY / MM / DD'))

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

// 副文案：只在这一处讲「差几节」，不重复进待办和卡片
const greetSub = computed(() => {
  if (!overview.weekReady) return '正在同步本周进度…'
  const plan = Number(overview.weekPlan) || 0
  if (plan === 0) return '本周还没有学习计划，在「我的课程」里给课程定个每周目标吧'
  const gap = Math.max(0, plan - (Number(overview.weekFinished) || 0))
  return gap > 0 ? `本周还差 ${gap} 节达标，接着上次的进度继续` : '本周目标已达成，继续保持'
})
</script>
<style lang="scss" scoped>
.ovWrap {
  padding-bottom: 8px;
}

/* 问候 */
.ovGreet {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 6px 0 22px;
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
.ovDate {
  font-family: var(--font-serif);
  font-size: 12px;
  letter-spacing: 1.6px;
  color: var(--ink3);
}

/* 第一屏 */
.ovTop {
  display: grid;
  grid-template-columns: 1fr 372px;
  gap: 20px;
  align-items: stretch;
}

/* 通用段 */
.ovSec {
  margin-top: 44px;
}
.ovNote {
  font-size: 12.5px;
  color: var(--ink3);
}
.ovDuo {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 20px;
  align-items: stretch;
}
.ovReportRow {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
  align-items: stretch;
}
.ovAside {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ovAsideTitle {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}
.ovAside > .recoCard,
.ovAside > * {
  flex: 1;
}

@media (max-width: 1200px) {
  .ovTop,
  .ovDuo,
  .ovReportRow {
    grid-template-columns: 1fr;
  }
  .ovAside {
    display: none;
  }
}
</style>
