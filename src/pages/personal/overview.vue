<!-- 学习概览（学习中心默认落地页 · v2）
     信息层级：先回答「现在学什么、最近考得怎样」，再给课程资产，最后是数据与笔记。
     每个模块自带三态、独立请求 —— 单个接口挂掉只影响自己那一块，父级不做编排。
     账号级数字（本周/连续/今日）只出现在侧栏目标卡（studyShell），这里不再重复。 -->
<template>
  <div class="ovWrap">
    <header class="ovGreet">
      <div>
        <!-- 标题用页面名（signs：不要把问候语当标题——「晚上好，xxx」是 AI 味典型形态）；
             问候保留，降为副行 -->
        <h1>学习概览</h1>
        <p>{{ greeting }}，{{ userName }} · {{ greetSub }}</p>
      </div>
      <div class="ovDate">{{ dateText }}</div>
    </header>

    <!-- 第一屏：继续学习 + 最近考试 -->
    <div class="ovTop">
      <ContinueHero />
      <ExamCard />
    </div>

    <section class="ovSec">
      <SectionHead index="01" title="本周节奏" subtitle="最近 7 天每天完成的小节" />
      <WeekRhythm />
    </section>

    <section class="ovSec">
      <SectionHead index="02" title="在学课程" subtitle="点击卡片直接继续"
                   action="查看全部课程" @action="$router.push({ name: 'myClass' })" />
      <CourseShelf />
    </section>

    <!-- 原来的「03 今天要做的 / 到期提醒」已下线：课程到期本来就是低频事件，
         这一节 99% 的时间是一张空卡占位，把概览的节奏拉散。
         到期提醒挪去了「我的课程」—— 那里才是用户管理课程、看得见每门课有效期的地方
         （卡片有效期行会变琥珀并标「N 天后到期」，页头也有一条汇总）。 -->

    <section class="ovSec">
      <SectionHead index="03" title="我的笔记" subtitle="最近写下的 3 条，点开回到那一节"
                   action="全部笔记" @action="$router.push({ name: 'learningNotes' })" />
      <div class="ovDuo">
        <NotesCard />
        <RankCard />
      </div>
    </section>

    <section class="ovSec">
      <SectionHead index="04" title="学习报告" subtitle="近 30 天的三个关键数字，详细数据在报告页" />
      <ReportStrip />
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
import WeekRhythm from './components/WeekRhythm.vue'
import CourseShelf from './components/CourseShelf.vue'
import ExamCard from './components/ExamCard.vue'
import NotesCard from './components/NotesCard.vue'
import RankCard from './components/RankCard.vue'
import ReportStrip from './components/ReportStrip.vue'

const userStore = useUserStore()
const overview = useClassOverview()

const userInfo = computed(() => userStore.getUserInfo || {})
const userName = computed(() => userInfo.value.name || '同学')
const dateText = computed(() => dayjs().format('YYYY / MM / DD'))

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

/**
 * 副文案：不带任何进度数字。
 * 周进度只在侧栏目标卡出现一次（改造方案 §6.1），这里一旦写「还差 N 节」
 * 就变成同屏第二处，和侧栏互相矛盾。
 */
const greetSub = computed(() => {
  if (!overview.weekReady) return '正在同步本周进度…'
  const plan = Number(overview.weekPlan) || 0
  if (plan === 0) return '本周还没有学习计划，在「我的课程」里给课程定个每周目标吧'
  const gap = Math.max(0, plan - (Number(overview.weekFinished) || 0))
  return gap > 0 ? '接着上次的进度继续' : '本周目标已达成，继续保持'
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
  grid-template-columns: 1fr 330px;
  gap: 20px;
  align-items: stretch;
}

/* 通用段 */
.ovSec {
  margin-top: 44px;
}
.ovDuo {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 20px;
  align-items: stretch;
}

@media (max-width: 900px) {
  .ovTop,
  .ovDuo {
    grid-template-columns: 1fr;
  }
}
</style>
